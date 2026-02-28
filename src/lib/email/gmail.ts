import { EmailProvider } from './provider';
import type { EmailMessage, ComposeData, ProviderInfo, Mailbox, GetEmailsOptions, EmailListResult } from './provider';

declare const google: any;

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

/**
 * Gmail provider using Google Identity Services and Gmail API.
 */
export class GmailProvider extends EmailProvider {
  private _clientId: string;
  private _accessToken: string;
  private _userEmail: string;

  constructor(clientId = '') {
    super();
    this._clientId = clientId || localStorage.getItem('gmail_client_id') || '';
    this._accessToken = localStorage.getItem('gmail_access_token') || '';
    this._userEmail = localStorage.getItem('gmail_user_email') || '';
  }

  getInfo(): ProviderInfo {
    return {
      id: 'gmail',
      name: 'Gmail',
      description: 'Google Gmail',
    };
  }

  async isLoggedIn(): Promise<boolean> {
    return !!this._accessToken;
  }

  async login(): Promise<boolean> {
    if (!this._clientId) {
      throw new Error('Gmail Client ID is not configured. Set it in Settings.');
    }

    await this._loadGoogleIdentityServices();

    return new Promise((resolve) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this._clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            this._accessToken = response.access_token;
            localStorage.setItem('gmail_access_token', this._accessToken);
            this._fetchUserProfile().then(() => resolve(true));
          } else {
            resolve(false);
          }
        },
      });
      client.requestAccessToken();
    });
  }

  async logout(): Promise<void> {
    if (this._accessToken && typeof google !== 'undefined') {
      google.accounts.oauth2.revoke(this._accessToken);
    }
    this._accessToken = '';
    this._userEmail = '';
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_user_email');
  }

  async getUserEmail(): Promise<string> {
    return this._userEmail;
  }

  async getMailboxes(): Promise<Mailbox[]> {
    const data = await this._apiGet('/labels');
    const labels: any[] = data.labels || [];

    const standardLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH'];
    const nameMap: Record<string, string> = {
      INBOX: 'Inbox',
      SENT: 'Sent',
      DRAFT: 'Drafts',
      SPAM: 'Spam',
      TRASH: 'Trash',
    };

    const mailboxes: Mailbox[] = [];
    for (const labelId of standardLabels) {
      const label = labels.find((l: any) => l.id === labelId);
      if (label) {
        const details = await this._apiGet(`/labels/${labelId}`);
        mailboxes.push({
          id: labelId,
          name: nameMap[labelId] || label.name,
          unreadCount: details.messagesUnread || 0,
          totalCount: details.messagesTotal || 0,
        });
      }
    }

    return mailboxes;
  }

  async getEmails(mailboxId: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { pageSize = 10 } = options;
    const params = new URLSearchParams({
      labelIds: mailboxId,
      maxResults: String(pageSize),
    });

    if (options._pageToken) {
      params.set('pageToken', options._pageToken);
    }

    const data = await this._apiGet(`/messages?${params}`);
    const messageIds: any[] = data.messages || [];

    const emails: EmailMessage[] = [];
    for (const { id } of messageIds) {
      const msg = await this._apiGet(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc&metadataHeaders=Subject&metadataHeaders=Date`);
      emails.push(this._parseMessage(msg, mailboxId));
    }

    return {
      emails,
      hasMore: !!data.nextPageToken,
      _pageToken: data.nextPageToken,
    };
  }

  async getEmail(emailId: string): Promise<EmailMessage> {
    const msg = await this._apiGet(`/messages/${emailId}?format=full`);
    const email = this._parseMessage(msg, '');
    email.body = this._extractBody(msg.payload);
    return email;
  }

  async markAsRead(emailId: string): Promise<void> {
    await this._apiPost(`/messages/${emailId}/modify`, {
      removeLabelIds: ['UNREAD'],
    });
  }

  async markAsUnread(emailId: string): Promise<void> {
    await this._apiPost(`/messages/${emailId}/modify`, {
      addLabelIds: ['UNREAD'],
    });
  }

  async moveEmail(emailId: string, targetMailboxId: string): Promise<void> {
    const msg = await this._apiGet(`/messages/${emailId}?format=minimal`);
    const currentLabels: string[] = (msg.labelIds || []).filter(
      (l: string) => !['UNREAD', 'STARRED', 'IMPORTANT'].includes(l)
    );
    await this._apiPost(`/messages/${emailId}/modify`, {
      addLabelIds: [targetMailboxId],
      removeLabelIds: currentLabels,
    });
  }

  async deleteEmail(emailId: string): Promise<void> {
    await this._apiPost(`/messages/${emailId}/trash`, {});
  }

  async searchEmails(query: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { pageSize = 10 } = options;
    const params = new URLSearchParams({
      q: query,
      maxResults: String(pageSize),
    });

    const data = await this._apiGet(`/messages?${params}`);
    const messageIds: any[] = data.messages || [];

    const emails: EmailMessage[] = [];
    for (const { id } of messageIds) {
      const msg = await this._apiGet(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc&metadataHeaders=Subject&metadataHeaders=Date`);
      emails.push(this._parseMessage(msg, ''));
    }

    return {
      emails,
      hasMore: !!data.nextPageToken,
    };
  }

  async sendEmail(data: ComposeData): Promise<boolean> {
    const message = this._buildRawEmail(data);
    await this._apiPost('/messages/send', { raw: message });
    return true;
  }

  // --- Private helpers ---

  private async _loadGoogleIdentityServices(): Promise<void> {
    if (typeof google !== 'undefined' && google.accounts) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  private async _fetchUserProfile(): Promise<void> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${this._accessToken}` },
      });
      const data = await res.json();
      this._userEmail = data.email || '';
      localStorage.setItem('gmail_user_email', this._userEmail);
    } catch (e) {
      console.warn('Failed to fetch Gmail user profile', e);
    }
  }

  private async _apiGet(path: string): Promise<any> {
    const res = await fetch(`${GMAIL_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${this._accessToken}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        this._accessToken = '';
        localStorage.removeItem('gmail_access_token');
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Gmail API error: ${res.status}`);
    }
    return res.json();
  }

  private async _apiPost(path: string, body: any): Promise<any> {
    const res = await fetch(`${GMAIL_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Gmail API error: ${res.status}`);
    }
    return res.json();
  }

  private _parseMessage(msg: any, mailboxId: string): EmailMessage {
    const headers: any[] = msg.payload?.headers || [];
    const getHeader = (name: string): string =>
      (headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

    const fromRaw = getHeader('From');
    const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);

    const ccRaw = getHeader('Cc');
    const bccRaw = getHeader('Bcc');

    return {
      id: msg.id,
      from: fromMatch ? fromMatch[2] : fromRaw,
      fromName: fromMatch ? fromMatch[1].replace(/"/g, '') : fromRaw,
      to: (getHeader('To') || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      cc: ccRaw ? ccRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      bcc: bccRaw ? bccRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      subject: getHeader('Subject') || '(No Subject)',
      snippet: msg.snippet || '',
      body: '',
      isRead: !(msg.labelIds || []).includes('UNREAD'),
      date: getHeader('Date') || '',
      mailboxId: mailboxId || (msg.labelIds || [])[0] || '',
      hasAttachments: this._hasAttachments(msg.payload),
    };
  }

  private _hasAttachments(payload: any): boolean {
    if (!payload) return false;
    if (payload.filename && payload.filename.length > 0 && payload.body?.attachmentId) return true;
    if (payload.parts) return payload.parts.some((p: any) => this._hasAttachments(p));
    return false;
  }

  private _extractBody(payload: any): string {
    if (!payload) return '';

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      const text = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      return `<pre style="white-space:pre-wrap;word-break:break-word">${text}</pre>`;
    }

    if (payload.parts) {
      const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) return this._extractBody(htmlPart);

      const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart) return this._extractBody(textPart);

      for (const part of payload.parts) {
        const result = this._extractBody(part);
        if (result) return result;
      }
    }

    return '';
  }

  private _buildRawEmail(data: ComposeData): string {
    const lines = [
      `To: ${data.to.join(', ')}`,
    ];
    if (data.cc && data.cc.length > 0) {
      lines.push(`Cc: ${data.cc.join(', ')}`);
    }
    if (data.bcc && data.bcc.length > 0) {
      lines.push(`Bcc: ${data.bcc.join(', ')}`);
    }
    lines.push(
      `Subject: ${data.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      data.body,
    );
    const raw = lines.join('\r\n');
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
