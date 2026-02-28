import { EmailProvider } from './provider';
import type { ProviderInfo, Mailbox, EmailMessage, GetEmailsOptions, EmailListResult, ComposeData } from './provider';

/**
 * Yahoo Mail provider stub.
 *
 * Yahoo does not provide a public email API for third-party web clients.
 * This stub is provided so that a future Yahoo integration can be added
 * when/if Yahoo makes such an API available.
 */
export class YahooProvider extends EmailProvider {
  getInfo(): ProviderInfo {
    return {
      id: 'yahoo',
      name: 'Yahoo',
      description: 'Yahoo Mail (coming soon)',
    };
  }

  async isLoggedIn(): Promise<boolean> {
    return false;
  }

  async login(): Promise<boolean> {
    throw new Error(
      'Yahoo Mail does not currently provide a public API for third-party web clients. This provider will be available in a future update.'
    );
  }

  async logout(): Promise<void> {}
  async getUserEmail(): Promise<string> { return ''; }
  async getMailboxes(): Promise<Mailbox[]> { return []; }
  async getEmails(_mailboxId: string, _options: GetEmailsOptions = {}): Promise<EmailListResult> { return { emails: [], hasMore: false }; }
  async getEmail(_emailId: string): Promise<EmailMessage> { throw new Error('Not available'); }
  async markAsRead(_emailId: string): Promise<void> {}
  async markAsUnread(_emailId: string): Promise<void> { throw new Error('Not available'); }
  async moveEmail(_emailId: string, _targetMailboxId: string): Promise<void> { throw new Error('Not available'); }
  async deleteEmail(_emailId: string): Promise<void> { throw new Error('Not available'); }
  async searchEmails(_query: string, _options: GetEmailsOptions = {}): Promise<EmailListResult> { return { emails: [], hasMore: false }; }
  async sendEmail(_data: ComposeData): Promise<boolean> { return false; }
}
