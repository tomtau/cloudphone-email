import { EmailProvider } from './provider';
import type { EmailMessage, ComposeData, ProviderInfo, Mailbox, GetEmailsOptions, EmailListResult } from './provider';

const JMAP_CORE_CAPABILITY = 'urn:ietf:params:jmap:core';
const JMAP_MAIL_CAPABILITY = 'urn:ietf:params:jmap:mail';

/**
 * JMAP provider for FastMail and other JMAP-compatible services.
 */
export class JmapProvider extends EmailProvider {
  private _sessionUrl: string;
  private _authToken: string;
  private _apiUrl: string;
  private _accountId: string;
  private _userEmail: string;

  constructor() {
    super();
    this._sessionUrl = import.meta.env.VITE_JMAP_SESSION_URL || localStorage.getItem('jmap_session_url') || '';
    this._authToken = import.meta.env.VITE_JMAP_AUTH_TOKEN || localStorage.getItem('jmap_auth_token') || '';
    this._apiUrl = '';
    this._accountId = '';
    this._userEmail = '';
  }

  getInfo(): ProviderInfo {
    return {
      id: 'jmap',
      name: 'JMAP',
      description: 'JMAP (FastMail, etc.)',
    };
  }

  async isLoggedIn(): Promise<boolean> {
    return !!this._authToken && !!this._apiUrl;
  }

  async login(): Promise<boolean> {
    if (!this._sessionUrl || !this._authToken) {
      throw new Error('JMAP session URL and auth token are required. Set VITE_JMAP_SESSION_URL and VITE_JMAP_AUTH_TOKEN env variables at build time.');
    }

    try {
      const res = await fetch(this._sessionUrl, {
        headers: { Authorization: `Bearer ${this._authToken}` },
      });
      if (!res.ok) throw new Error(`JMAP session error: ${res.status}`);
      const session = await res.json();

      this._apiUrl = session.apiUrl || '';
      const accounts = session.accounts || {};
      const accountIds = Object.keys(accounts);
      if (accountIds.length === 0) throw new Error('No JMAP accounts found');
      this._accountId = session.primaryAccounts?.[JMAP_MAIL_CAPABILITY] || accountIds[0];
      this._userEmail = session.username || accounts[this._accountId]?.name || this._accountId;

      return true;
    } catch (e) {
      console.error('JMAP login failed', e);
      return false;
    }
  }

  async logout(): Promise<void> {
    this._apiUrl = '';
    this._accountId = '';
  }

  async getUserEmail(): Promise<string> {
    return this._userEmail || this._accountId;
  }

  async getMailboxes(): Promise<Mailbox[]> {
    const response = await this._apiCall('Mailbox/get', {
      accountId: this._accountId,
    });
    const list: any[] = response?.list || [];
    return list.map((m: any) => ({
      id: m.id,
      name: m.name || '',
      unreadCount: m.unreadEmails || 0,
      totalCount: m.totalEmails || 0,
    }));
  }

  async getEmails(mailboxId: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { page = 0, pageSize = 10 } = options;
    const queryResponse = await this._apiCall('Email/query', {
      accountId: this._accountId,
      filter: { inMailbox: mailboxId },
      sort: [{ property: 'receivedAt', isAscending: false }],
      position: page * pageSize,
      limit: pageSize,
    });

    const ids: string[] = queryResponse?.ids || [];
    if (ids.length === 0) {
      return { emails: [], hasMore: false };
    }

    const getResponse = await this._apiCall('Email/get', {
      accountId: this._accountId,
      ids,
      properties: ['id', 'from', 'to', 'cc', 'bcc', 'subject', 'preview', 'receivedAt', 'keywords', 'mailboxIds', 'hasAttachment'],
    });

    const emails: EmailMessage[] = (getResponse?.list || []).map((e: any) => this._parseEmail(e));
    return {
      emails,
      hasMore: (queryResponse?.total || 0) > (page + 1) * pageSize,
    };
  }

  async getEmail(emailId: string): Promise<EmailMessage> {
    const response = await this._apiCall('Email/get', {
      accountId: this._accountId,
      ids: [emailId],
      properties: ['id', 'from', 'to', 'cc', 'bcc', 'subject', 'preview', 'receivedAt', 'keywords', 'mailboxIds', 'hasAttachment', 'bodyValues', 'htmlBody', 'textBody'],
      fetchHTMLBodyValues: true,
      fetchTextBodyValues: true,
    });

    const list: any[] = response?.list || [];
    if (list.length === 0) throw new Error('Email not found');
    const e = list[0];
    const email = this._parseEmail(e);

    // Extract body
    const bodyValues = e.bodyValues || {};
    const htmlParts: any[] = e.htmlBody || [];
    const textParts: any[] = e.textBody || [];

    if (htmlParts.length > 0 && bodyValues[htmlParts[0].partId]) {
      email.body = bodyValues[htmlParts[0].partId].value || '';
    } else if (textParts.length > 0 && bodyValues[textParts[0].partId]) {
      const text = bodyValues[textParts[0].partId].value || '';
      email.body = `<pre style="white-space:pre-wrap;word-break:break-word">${this._escapeHtml(text)}</pre>`;
    }

    return email;
  }

  async markAsRead(emailId: string): Promise<void> {
    await this._apiCall('Email/set', {
      accountId: this._accountId,
      update: {
        [emailId]: { 'keywords/$seen': true },
      },
    });
  }

  async markAsUnread(emailId: string): Promise<void> {
    await this._apiCall('Email/set', {
      accountId: this._accountId,
      update: {
        [emailId]: { 'keywords/$seen': null },
      },
    });
  }

  async moveEmail(emailId: string, targetMailboxId: string): Promise<void> {
    // Get current mailbox ids, then replace
    const getResponse = await this._apiCall('Email/get', {
      accountId: this._accountId,
      ids: [emailId],
      properties: ['mailboxIds'],
    });
    const current = getResponse?.list?.[0]?.mailboxIds || {};
    const patch: Record<string, any> = {};
    for (const key of Object.keys(current)) {
      patch[`mailboxIds/${key}`] = null;
    }
    patch[`mailboxIds/${targetMailboxId}`] = true;

    await this._apiCall('Email/set', {
      accountId: this._accountId,
      update: {
        [emailId]: patch,
      },
    });
  }

  async deleteEmail(emailId: string): Promise<void> {
    // Find trash mailbox
    const mailboxResponse = await this._apiCall('Mailbox/get', {
      accountId: this._accountId,
    });
    const mailboxes: any[] = mailboxResponse?.list || [];
    const trash = mailboxes.find((m: any) => m.role === 'trash');

    if (!trash) {
      // No trash found, destroy directly
      await this._apiCall('Email/set', {
        accountId: this._accountId,
        destroy: [emailId],
      });
      return;
    }

    // Check if already in trash
    const getResponse = await this._apiCall('Email/get', {
      accountId: this._accountId,
      ids: [emailId],
      properties: ['mailboxIds'],
    });
    const currentMailboxIds = getResponse?.list?.[0]?.mailboxIds || {};

    if (currentMailboxIds[trash.id]) {
      // Already in trash, destroy permanently
      await this._apiCall('Email/set', {
        accountId: this._accountId,
        destroy: [emailId],
      });
    } else {
      // Move to trash
      await this.moveEmail(emailId, trash.id);
    }
  }

  async searchEmails(query: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { page = 0, pageSize = 10 } = options;
    const queryResponse = await this._apiCall('Email/query', {
      accountId: this._accountId,
      filter: { text: query },
      sort: [{ property: 'receivedAt', isAscending: false }],
      position: page * pageSize,
      limit: pageSize,
    });

    const ids: string[] = queryResponse?.ids || [];
    if (ids.length === 0) {
      return { emails: [], hasMore: false };
    }

    const getResponse = await this._apiCall('Email/get', {
      accountId: this._accountId,
      ids,
      properties: ['id', 'from', 'to', 'cc', 'bcc', 'subject', 'preview', 'receivedAt', 'keywords', 'mailboxIds', 'hasAttachment'],
    });

    const emails: EmailMessage[] = (getResponse?.list || []).map((e: any) => this._parseEmail(e));
    return {
      emails,
      hasMore: (queryResponse?.total || 0) > (page + 1) * pageSize,
    };
  }

  async sendEmail(data: ComposeData): Promise<boolean> {
    // Create the email as a draft then submit
    const emailBody: any = {
      from: [{ email: this._userEmail || this._accountId }],
      to: data.to.map((addr) => ({ email: addr })),
      subject: data.subject,
      bodyValues: {
        body: { value: data.body, charset: 'utf-8' },
      },
      textBody: [{ partId: 'body', type: 'text/plain' }],
      mailboxIds: {},
    };

    if (data.cc && data.cc.length > 0) {
      emailBody.cc = data.cc.map((addr: string) => ({ email: addr }));
    }
    if (data.bcc && data.bcc.length > 0) {
      emailBody.bcc = data.bcc.map((addr: string) => ({ email: addr }));
    }

    // Use EmailSubmission/set to create and send in one call
    const response = await this._jmapRequest([
      ['Email/set', {
        accountId: this._accountId,
        create: { draft: emailBody },
      }, '0'],
      ['EmailSubmission/set', {
        accountId: this._accountId,
        create: {
          submission: {
            emailId: '#draft',
          },
        },
        onSuccessDestroyEmail: ['#draft'],
      }, '1'],
    ]);

    return !!response;
  }

  // --- Private helpers ---

  private _parseEmail(e: any): EmailMessage {
    const from = e.from?.[0] || {};
    const mailboxIds = e.mailboxIds || {};
    const firstMailboxId = Object.keys(mailboxIds)[0] || '';

    return {
      id: e.id,
      from: from.email || '',
      fromName: from.name || from.email || '',
      to: (e.to || []).map((r: any) => r.email || ''),
      cc: (e.cc || []).map((r: any) => r.email || ''),
      bcc: (e.bcc || []).map((r: any) => r.email || ''),
      subject: e.subject || '(No Subject)',
      snippet: e.preview || '',
      body: '',
      isRead: !!(e.keywords?.['$seen']),
      date: e.receivedAt || '',
      mailboxId: firstMailboxId,
      hasAttachments: e.hasAttachment || false,
    };
  }

  private async _apiCall(method: string, args: any): Promise<any> {
    const response = await this._jmapRequest([[method, args, '0']]);
    const methodResponses: any[][] = response?.methodResponses || [];
    if (methodResponses.length > 0) {
      return methodResponses[0][1];
    }
    return null;
  }

  private async _jmapRequest(methodCalls: any[][]): Promise<any> {
    const res = await fetch(this._apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        using: [JMAP_CORE_CAPABILITY, JMAP_MAIL_CAPABILITY],
        methodCalls,
      }),
    });
    if (!res.ok) {
      throw new Error(`JMAP API error: ${res.status}`);
    }
    return res.json();
  }

  private _escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
