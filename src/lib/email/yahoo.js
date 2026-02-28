import { EmailProvider } from './provider.js';

/**
 * Yahoo Mail provider stub.
 *
 * Yahoo does not provide a public email API for third-party web clients.
 * This stub is provided so that a future Yahoo integration can be added
 * when/if Yahoo makes such an API available.
 *
 * To add Yahoo support, implement the methods below using the appropriate
 * Yahoo API endpoints and authentication flow.
 */
export class YahooProvider extends EmailProvider {
  getInfo() {
    return {
      id: 'yahoo',
      name: 'Yahoo',
      description: 'Yahoo Mail (coming soon)',
    };
  }

  async isLoggedIn() {
    return false;
  }

  async login() {
    throw new Error(
      'Yahoo Mail does not currently provide a public API for third-party web clients. This provider will be available in a future update.'
    );
  }

  async logout() {}
  async getUserEmail() { return ''; }
  async getMailboxes() { return []; }
  async getEmails() { return { emails: [], hasMore: false }; }
  async getEmail() { throw new Error('Not available'); }
  async markAsRead() {}
  async searchEmails() { return { emails: [], hasMore: false }; }
  async sendEmail() { return false; }
}
