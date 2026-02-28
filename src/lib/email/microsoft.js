import { EmailProvider } from './provider.js';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0/me';
const SCOPES = ['Mail.ReadWrite', 'Mail.Send', 'User.Read'];

/**
 * Microsoft Outlook/Hotmail provider using MSAL.js and Microsoft Graph API.
 *
 * Requires an Azure AD App Registration with a Client ID configured
 * for a Single Page Application (SPA) with the appropriate redirect URIs.
 *
 * Set the client ID via the constructor or localStorage key 'microsoft_client_id'.
 */
export class MicrosoftProvider extends EmailProvider {
  constructor(clientId = '') {
    super();
    this._clientId = clientId || localStorage.getItem('microsoft_client_id') || '';
    this._accessToken = localStorage.getItem('microsoft_access_token') || '';
    this._userEmail = localStorage.getItem('microsoft_user_email') || '';
    this._msalInstance = null;
  }

  getInfo() {
    return {
      id: 'microsoft',
      name: 'Outlook',
      description: 'Microsoft Outlook / Hotmail',
    };
  }

  async isLoggedIn() {
    return !!this._accessToken;
  }

  async login() {
    if (!this._clientId) {
      throw new Error('Microsoft Client ID is not configured. Set it in Settings.');
    }

    await this._initMsal();

    try {
      const result = await this._msalInstance.loginPopup({
        scopes: SCOPES,
      });

      if (result.accessToken) {
        this._accessToken = result.accessToken;
        localStorage.setItem('microsoft_access_token', this._accessToken);
        await this._fetchUserProfile();
        return true;
      }

      const tokenResult = await this._msalInstance.acquireTokenSilent({
        scopes: SCOPES,
        account: result.account,
      });
      this._accessToken = tokenResult.accessToken;
      localStorage.setItem('microsoft_access_token', this._accessToken);
      await this._fetchUserProfile();
      return true;
    } catch (e) {
      console.error('Microsoft login failed', e);
      return false;
    }
  }

  async logout() {
    this._accessToken = '';
    this._userEmail = '';
    localStorage.removeItem('microsoft_access_token');
    localStorage.removeItem('microsoft_user_email');

    if (this._msalInstance) {
      try {
        await this._msalInstance.logoutPopup();
      } catch (e) {
        console.warn('Microsoft logout error', e);
      }
    }
  }

  async getUserEmail() {
    return this._userEmail;
  }

  async getMailboxes() {
    const folderMap = {
      inbox: 'Inbox',
      sentitems: 'Sent',
      drafts: 'Drafts',
      junkemail: 'Spam',
      deleteditems: 'Trash',
    };

    const mailboxes = [];
    for (const [folderId, name] of Object.entries(folderMap)) {
      try {
        const data = await this._apiGet(`/mailFolders/${folderId}`);
        mailboxes.push({
          id: data.id,
          name,
          unreadCount: data.unreadItemCount || 0,
          totalCount: data.totalItemCount || 0,
        });
      } catch (e) {
        console.warn(`Failed to load folder ${folderId}`, e);
      }
    }

    return mailboxes;
  }

  async getEmails(mailboxId, options = {}) {
    const { page = 0, pageSize = 10 } = options;
    const skip = page * pageSize;
    const params = `$top=${pageSize}&$skip=${skip}&$orderby=receivedDateTime desc&$select=id,from,toRecipients,subject,bodyPreview,isRead,receivedDateTime,hasAttachments`;
    const data = await this._apiGet(`/mailFolders/${mailboxId}/messages?${params}`);
    const messages = data.value || [];

    return {
      emails: messages.map((msg) => this._parseMessage(msg, mailboxId)),
      hasMore: !!data['@odata.nextLink'],
    };
  }

  async getEmail(emailId) {
    const msg = await this._apiGet(`/messages/${emailId}`);
    return {
      id: msg.id,
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || '',
      to: (msg.toRecipients || []).map((r) => r.emailAddress?.address || ''),
      subject: msg.subject || '(No Subject)',
      snippet: msg.bodyPreview || '',
      body: msg.body?.content || '',
      isRead: msg.isRead,
      date: msg.receivedDateTime || '',
      mailboxId: '',
      hasAttachments: msg.hasAttachments || false,
    };
  }

  async markAsRead(emailId) {
    await this._apiPatch(`/messages/${emailId}`, { isRead: true });
  }

  async searchEmails(query, options = {}) {
    const { page = 0, pageSize = 10 } = options;
    const skip = page * pageSize;
    const params = `$top=${pageSize}&$skip=${skip}&$search="${encodeURIComponent(query)}"&$select=id,from,toRecipients,subject,bodyPreview,isRead,receivedDateTime,hasAttachments`;
    const data = await this._apiGet(`/messages?${params}`);
    const messages = data.value || [];

    return {
      emails: messages.map((msg) => this._parseMessage(msg, '')),
      hasMore: !!data['@odata.nextLink'],
    };
  }

  async sendEmail(data) {
    const message = {
      subject: data.subject,
      body: {
        contentType: 'Text',
        content: data.body,
      },
      toRecipients: data.to.map((addr) => ({
        emailAddress: { address: addr },
      })),
    };

    await this._apiPost('/sendMail', { message, saveToSentItems: true });
    return true;
  }

  // --- Private helpers ---

  async _initMsal() {
    if (this._msalInstance) return;

    await this._loadMsalScript();

    this._msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: this._clientId,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    });

    await this._msalInstance.initialize();
  }

  async _loadMsalScript() {
    if (typeof msal !== 'undefined') return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load MSAL library'));
      document.head.appendChild(script);
    });
  }

  async _fetchUserProfile() {
    try {
      const data = await this._apiGet('');
      this._userEmail = data.mail || data.userPrincipalName || '';
      localStorage.setItem('microsoft_user_email', this._userEmail);
    } catch (e) {
      console.warn('Failed to fetch Microsoft user profile', e);
    }
  }

  async _apiGet(path) {
    const url = path.startsWith('http') ? path : `${GRAPH_API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this._accessToken}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        this._accessToken = '';
        localStorage.removeItem('microsoft_access_token');
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Microsoft Graph API error: ${res.status}`);
    }
    return res.json();
  }

  async _apiPost(path, body) {
    const res = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Microsoft Graph API error: ${res.status}`);
    }
    if (res.status === 202 || res.status === 204) return {};
    return res.json();
  }

  async _apiPatch(path, body) {
    const res = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Microsoft Graph API error: ${res.status}`);
    }
    if (res.status === 204) return {};
    return res.json();
  }

  _parseMessage(msg, mailboxId) {
    return {
      id: msg.id,
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || '',
      to: (msg.toRecipients || []).map((r) => r.emailAddress?.address || ''),
      subject: msg.subject || '(No Subject)',
      snippet: msg.bodyPreview || '',
      body: '',
      isRead: msg.isRead,
      date: msg.receivedDateTime || '',
      mailboxId,
      hasAttachments: msg.hasAttachments || false,
    };
  }
}
