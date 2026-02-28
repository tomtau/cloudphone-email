import { EmailProvider } from './provider.js';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

/**
 * Gmail provider using Google Identity Services and Gmail API.
 *
 * Requires a Google Cloud OAuth 2.0 Client ID configured for
 * a web application with the appropriate redirect URIs.
 *
 * Set the client ID via the constructor or localStorage key 'gmail_client_id'.
 */
export class GmailProvider extends EmailProvider {
  constructor(clientId = '') {
    super();
    this._clientId = clientId || localStorage.getItem('gmail_client_id') || '';
    this._accessToken = localStorage.getItem('gmail_access_token') || '';
    this._userEmail = localStorage.getItem('gmail_user_email') || '';
  }

  getInfo() {
    return {
      id: 'gmail',
      name: 'Gmail',
      description: 'Google Gmail',
    };
  }

  async isLoggedIn() {
    return !!this._accessToken;
  }

  async login() {
    if (!this._clientId) {
      throw new Error('Gmail Client ID is not configured. Set it in Settings.');
    }

    await this._loadGoogleIdentityServices();

    return new Promise((resolve) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this._clientId,
        scope: SCOPES,
        callback: (response) => {
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

  async logout() {
    if (this._accessToken && typeof google !== 'undefined') {
      google.accounts.oauth2.revoke(this._accessToken);
    }
    this._accessToken = '';
    this._userEmail = '';
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_user_email');
  }

  async getUserEmail() {
    return this._userEmail;
  }

  async getMailboxes() {
    const data = await this._apiGet('/labels');
    const labels = data.labels || [];

    const standardLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH'];
    const nameMap = {
      INBOX: 'Inbox',
      SENT: 'Sent',
      DRAFT: 'Drafts',
      SPAM: 'Spam',
      TRASH: 'Trash',
    };

    const mailboxes = [];
    for (const labelId of standardLabels) {
      const label = labels.find((l) => l.id === labelId);
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

  async getEmails(mailboxId, options = {}) {
    const { page = 0, pageSize = 10 } = options;
    const params = new URLSearchParams({
      labelIds: mailboxId,
      maxResults: String(pageSize),
    });

    if (options._pageToken) {
      params.set('pageToken', options._pageToken);
    }

    const data = await this._apiGet(`/messages?${params}`);
    const messageIds = data.messages || [];

    const emails = [];
    for (const { id } of messageIds) {
      const msg = await this._apiGet(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
      emails.push(this._parseMessage(msg, mailboxId));
    }

    return {
      emails,
      hasMore: !!data.nextPageToken,
      _pageToken: data.nextPageToken,
    };
  }

  async getEmail(emailId) {
    const msg = await this._apiGet(`/messages/${emailId}?format=full`);
    const email = this._parseMessage(msg, '');
    email.body = this._extractBody(msg.payload);
    return email;
  }

  async markAsRead(emailId) {
    await this._apiPost(`/messages/${emailId}/modify`, {
      removeLabelIds: ['UNREAD'],
    });
  }

  async searchEmails(query, options = {}) {
    const { page = 0, pageSize = 10 } = options;
    const params = new URLSearchParams({
      q: query,
      maxResults: String(pageSize),
    });

    const data = await this._apiGet(`/messages?${params}`);
    const messageIds = data.messages || [];

    const emails = [];
    for (const { id } of messageIds) {
      const msg = await this._apiGet(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
      emails.push(this._parseMessage(msg, ''));
    }

    return {
      emails,
      hasMore: !!data.nextPageToken,
    };
  }

  async sendEmail(data) {
    const message = this._buildRawEmail(data);
    await this._apiPost('/messages/send', { raw: message });
    return true;
  }

  // --- Private helpers ---

  async _loadGoogleIdentityServices() {
    if (typeof google !== 'undefined' && google.accounts) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async _fetchUserProfile() {
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

  async _apiGet(path) {
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

  async _apiPost(path, body) {
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

  _parseMessage(msg, mailboxId) {
    const headers = msg.payload?.headers || [];
    const getHeader = (name) =>
      (headers.find((h) => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

    const fromRaw = getHeader('From');
    const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);

    return {
      id: msg.id,
      from: fromMatch ? fromMatch[2] : fromRaw,
      fromName: fromMatch ? fromMatch[1].replace(/"/g, '') : fromRaw,
      to: (getHeader('To') || '').split(',').map((s) => s.trim()),
      subject: getHeader('Subject') || '(No Subject)',
      snippet: msg.snippet || '',
      body: '',
      isRead: !(msg.labelIds || []).includes('UNREAD'),
      date: getHeader('Date') || '',
      mailboxId: mailboxId || (msg.labelIds || [])[0] || '',
      hasAttachments: this._hasAttachments(msg.payload),
    };
  }

  _hasAttachments(payload) {
    if (!payload) return false;
    if (payload.filename && payload.filename.length > 0 && payload.body?.attachmentId) return true;
    if (payload.parts) return payload.parts.some((p) => this._hasAttachments(p));
    return false;
  }

  _extractBody(payload) {
    if (!payload) return '';

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      const text = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      return `<pre style="white-space:pre-wrap;word-break:break-word">${text}</pre>`;
    }

    if (payload.parts) {
      const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
      if (htmlPart) return this._extractBody(htmlPart);

      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      if (textPart) return this._extractBody(textPart);

      for (const part of payload.parts) {
        const result = this._extractBody(part);
        if (result) return result;
      }
    }

    return '';
  }

  _buildRawEmail(data) {
    const lines = [
      `To: ${data.to.join(', ')}`,
      `Subject: ${data.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      data.body,
    ];
    const raw = lines.join('\r\n');
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
