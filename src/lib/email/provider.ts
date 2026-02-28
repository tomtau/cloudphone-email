export interface Mailbox {
  id: string;
  name: string;
  unreadCount: number;
  totalCount: number;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  snippet: string;
  body: string;
  isRead: boolean;
  date: string;
  mailboxId: string;
  hasAttachments?: boolean;
}

export interface ComposeData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  inReplyTo?: string;
  forwardOf?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
}

export interface GetEmailsOptions {
  page?: number;
  pageSize?: number;
  _pageToken?: string;
}

export interface EmailListResult {
  emails: EmailMessage[];
  hasMore: boolean;
  _pageToken?: string;
}

/**
 * Base email provider class.
 * All email providers must extend this class and implement its methods.
 */
export class EmailProvider {
  getInfo(): ProviderInfo {
    throw new Error('Not implemented');
  }

  async isLoggedIn(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async login(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    throw new Error('Not implemented');
  }

  async getUserEmail(): Promise<string> {
    throw new Error('Not implemented');
  }

  async getMailboxes(): Promise<Mailbox[]> {
    throw new Error('Not implemented');
  }

  async getEmails(mailboxId: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    throw new Error('Not implemented');
  }

  async getEmail(emailId: string): Promise<EmailMessage> {
    throw new Error('Not implemented');
  }

  async markAsRead(emailId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async markAsUnread(emailId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async moveEmail(emailId: string, targetMailboxId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async deleteEmail(emailId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async searchEmails(query: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    throw new Error('Not implemented');
  }

  async sendEmail(data: ComposeData): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
