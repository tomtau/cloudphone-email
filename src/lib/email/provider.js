/**
 * @typedef {Object} Mailbox
 * @property {string} id - Unique mailbox identifier
 * @property {string} name - Display name (e.g. "Inbox", "Sent")
 * @property {number} unreadCount - Number of unread emails
 * @property {number} totalCount - Total number of emails
 */

/**
 * @typedef {Object} EmailMessage
 * @property {string} id - Unique email identifier
 * @property {string} from - Sender email address
 * @property {string} fromName - Sender display name
 * @property {string[]} to - Recipient email addresses
 * @property {string} subject - Email subject
 * @property {string} snippet - Short preview text
 * @property {string} body - Full email body (HTML or plain text)
 * @property {boolean} isRead - Whether the email has been read
 * @property {string} date - ISO 8601 date string
 * @property {string} mailboxId - ID of the mailbox this email belongs to
 * @property {boolean} [hasAttachments] - Whether the email has attachments
 */

/**
 * @typedef {Object} ComposeData
 * @property {string[]} to - Recipient email addresses
 * @property {string} subject - Email subject
 * @property {string} body - Email body
 * @property {string} [inReplyTo] - ID of email being replied to
 * @property {string} [forwardOf] - ID of email being forwarded
 */

/**
 * @typedef {Object} ProviderInfo
 * @property {string} id - Provider identifier
 * @property {string} name - Display name
 * @property {string} description - Short description
 */

/**
 * Base email provider class.
 * All email providers must extend this class and implement its methods.
 */
export class EmailProvider {
  /**
   * Get provider information.
   * @returns {ProviderInfo}
   */
  getInfo() {
    throw new Error('Not implemented');
  }

  /**
   * Check if the user is currently logged in.
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    throw new Error('Not implemented');
  }

  /**
   * Initiate the login flow.
   * @returns {Promise<boolean>} Whether login was successful
   */
  async login() {
    throw new Error('Not implemented');
  }

  /**
   * Log out the current user.
   * @returns {Promise<void>}
   */
  async logout() {
    throw new Error('Not implemented');
  }

  /**
   * Get the logged-in user's email address.
   * @returns {Promise<string>}
   */
  async getUserEmail() {
    throw new Error('Not implemented');
  }

  /**
   * Get the list of mailboxes/folders.
   * @returns {Promise<Mailbox[]>}
   */
  async getMailboxes() {
    throw new Error('Not implemented');
  }

  /**
   * Get emails in a mailbox.
   * @param {string} mailboxId - The mailbox ID
   * @param {Object} [options]
   * @param {number} [options.page] - Page number (0-indexed)
   * @param {number} [options.pageSize] - Number of emails per page
   * @returns {Promise<{emails: EmailMessage[], hasMore: boolean}>}
   */
  async getEmails(mailboxId, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Get a single email by ID.
   * @param {string} emailId - The email ID
   * @returns {Promise<EmailMessage>}
   */
  async getEmail(emailId) {
    throw new Error('Not implemented');
  }

  /**
   * Mark an email as read.
   * @param {string} emailId - The email ID
   * @returns {Promise<void>}
   */
  async markAsRead(emailId) {
    throw new Error('Not implemented');
  }

  /**
   * Search emails.
   * @param {string} query - Search query
   * @param {Object} [options]
   * @param {number} [options.page] - Page number (0-indexed)
   * @param {number} [options.pageSize] - Number of results per page
   * @returns {Promise<{emails: EmailMessage[], hasMore: boolean}>}
   */
  async searchEmails(query, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Send an email.
   * @param {ComposeData} data - The email data
   * @returns {Promise<boolean>} Whether the email was sent successfully
   */
  async sendEmail(data) {
    throw new Error('Not implemented');
  }
}
