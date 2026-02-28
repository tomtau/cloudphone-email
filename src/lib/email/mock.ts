import { EmailProvider } from './provider';
import type { Mailbox, EmailMessage, ComposeData, ProviderInfo, GetEmailsOptions, EmailListResult } from './provider';

const MOCK_MAILBOXES: Mailbox[] = [
  { id: 'inbox', name: 'Inbox', unreadCount: 3, totalCount: 8 },
  { id: 'sent', name: 'Sent', unreadCount: 0, totalCount: 4 },
  { id: 'drafts', name: 'Drafts', unreadCount: 0, totalCount: 1 },
  { id: 'spam', name: 'Spam', unreadCount: 1, totalCount: 2 },
  { id: 'trash', name: 'Trash', unreadCount: 0, totalCount: 1 },
];

const MOCK_EMAILS: EmailMessage[] = [
  {
    id: 'msg-1',
    from: 'alice@example.com',
    fromName: 'Alice Johnson',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Welcome to Cloud Phone Email!',
    snippet: 'Thank you for trying the Cloud Phone email client...',
    body: '<p>Thank you for trying the <b>Cloud Phone email client</b>!</p><p>This is a demo email to show how the email app works on feature phones. You can navigate with the D-pad, read emails, compose new messages, and more.</p><p>Best regards,<br>Alice</p>',
    isRead: false,
    date: '2026-02-28T08:00:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-2',
    from: 'bob@example.com',
    fromName: 'Bob Smith',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Meeting Tomorrow',
    snippet: 'Hi, just a reminder about our meeting tomorrow at 10am...',
    body: '<p>Hi,</p><p>Just a reminder about our meeting tomorrow at 10am. Please bring the project updates.</p><p>Thanks,<br>Bob</p>',
    isRead: false,
    date: '2026-02-27T15:30:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-3',
    from: 'newsletter@techdigest.com',
    fromName: 'Tech Digest',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Weekly Tech News',
    snippet: 'This week in tech: new features for mobile devices...',
    body: '<p><b>Weekly Tech Digest</b></p><p>This week in tech:</p><ul><li>New features for mobile devices</li><li>Cloud computing trends</li><li>AI developments</li></ul><p>Read more at techdigest.com</p>',
    isRead: true,
    date: '2026-02-27T09:00:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-4',
    from: 'carol@example.com',
    fromName: 'Carol Davis',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Photos from the trip',
    snippet: 'Here are the photos from last weekend...',
    body: '<p>Here are the photos from last weekend! I hope you enjoy them.</p><p>Let me know which ones you like best.</p><p>Carol</p>',
    isRead: false,
    date: '2026-02-26T18:45:00Z',
    mailboxId: 'inbox',
    hasAttachments: true,
  },
  {
    id: 'msg-5',
    from: 'support@cloudphone.com',
    fromName: 'Cloud Phone Support',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Your account is ready',
    snippet: 'Your Cloud Phone account has been set up successfully...',
    body: '<p>Your Cloud Phone account has been set up successfully!</p><p>If you have any questions, please visit our help center.</p><p>Cloud Phone Team</p>',
    isRead: true,
    date: '2026-02-25T12:00:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-6',
    from: 'dave@example.com',
    fromName: 'Dave Wilson',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Quick question',
    snippet: 'Hey, do you have a minute to chat about the project?',
    body: '<p>Hey,</p><p>Do you have a minute to chat about the project? I have some ideas I would like to discuss.</p><p>Dave</p>',
    isRead: true,
    date: '2026-02-24T16:20:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-7',
    from: 'events@community.org',
    fromName: 'Community Events',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Upcoming community event',
    snippet: 'Join us for the annual community gathering...',
    body: '<p><b>Annual Community Gathering</b></p><p>Date: March 15, 2026</p><p>Location: Community Center</p><p>Join us for food, games, and fun!</p>',
    isRead: true,
    date: '2026-02-23T10:00:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  {
    id: 'msg-8',
    from: 'emma@example.com',
    fromName: 'Emma Brown',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Lunch plans',
    snippet: 'Are you free for lunch on Friday?',
    body: '<p>Are you free for lunch on Friday? There is a new place downtown I want to try.</p><p>Let me know!</p><p>Emma</p>',
    isRead: true,
    date: '2026-02-22T14:30:00Z',
    mailboxId: 'inbox',
    hasAttachments: false,
  },
  // Sent emails
  {
    id: 'msg-9',
    from: 'demo@example.com',
    fromName: 'Demo User',
    to: ['alice@example.com'],
    cc: [],
    bcc: [],
    subject: 'Re: Welcome to Cloud Phone Email!',
    snippet: 'Thanks Alice! The email client looks great...',
    body: '<p>Thanks Alice! The email client looks great on my feature phone.</p><p>Best,<br>Demo User</p>',
    isRead: true,
    date: '2026-02-28T08:15:00Z',
    mailboxId: 'sent',
    hasAttachments: false,
  },
  {
    id: 'msg-10',
    from: 'demo@example.com',
    fromName: 'Demo User',
    to: ['bob@example.com'],
    cc: [],
    bcc: [],
    subject: 'Re: Meeting Tomorrow',
    snippet: 'Sure, I will be there with the updates...',
    body: '<p>Sure, I will be there with the updates. See you at 10am!</p><p>Demo User</p>',
    isRead: true,
    date: '2026-02-27T16:00:00Z',
    mailboxId: 'sent',
    hasAttachments: false,
  },
  {
    id: 'msg-11',
    from: 'demo@example.com',
    fromName: 'Demo User',
    to: ['carol@example.com'],
    cc: [],
    bcc: [],
    subject: 'Re: Photos from the trip',
    snippet: 'These are amazing photos! I love the sunset ones...',
    body: '<p>These are amazing photos! I love the sunset ones especially.</p><p>Demo User</p>',
    isRead: true,
    date: '2026-02-26T19:00:00Z',
    mailboxId: 'sent',
    hasAttachments: false,
  },
  {
    id: 'msg-12',
    from: 'demo@example.com',
    fromName: 'Demo User',
    to: ['dave@example.com'],
    cc: [],
    bcc: [],
    subject: 'Project proposal',
    snippet: 'Hi Dave, here is the project proposal we discussed...',
    body: '<p>Hi Dave,</p><p>Here is the project proposal we discussed. Let me know your thoughts.</p><p>Demo User</p>',
    isRead: true,
    date: '2026-02-24T11:00:00Z',
    mailboxId: 'sent',
    hasAttachments: false,
  },
  // Drafts
  {
    id: 'msg-13',
    from: 'demo@example.com',
    fromName: 'Demo User',
    to: ['team@example.com'],
    cc: [],
    bcc: [],
    subject: 'Team update',
    snippet: 'Hi team, here is the weekly update...',
    body: '<p>Hi team,</p><p>Here is the weekly update...</p>',
    isRead: true,
    date: '2026-02-28T07:00:00Z',
    mailboxId: 'drafts',
    hasAttachments: false,
  },
  // Spam
  {
    id: 'msg-14',
    from: 'spam@scammer.com',
    fromName: 'You Won!',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Congratulations! You won $1,000,000',
    snippet: 'Click here to claim your prize...',
    body: '<p>Congratulations! You have won $1,000,000!</p><p>This is obviously a spam email for demo purposes.</p>',
    isRead: false,
    date: '2026-02-27T03:00:00Z',
    mailboxId: 'spam',
    hasAttachments: false,
  },
  {
    id: 'msg-15',
    from: 'offers@deals.com',
    fromName: 'Amazing Deals',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: '90% OFF Everything!',
    snippet: 'Unbelievable deals just for you...',
    body: '<p>90% OFF Everything! Limited time offer!</p><p>This is a spam demo email.</p>',
    isRead: true,
    date: '2026-02-26T01:00:00Z',
    mailboxId: 'spam',
    hasAttachments: false,
  },
  // Trash
  {
    id: 'msg-16',
    from: 'old@example.com',
    fromName: 'Old Contact',
    to: ['demo@example.com'],
    cc: [],
    bcc: [],
    subject: 'Old message',
    snippet: 'This is an old deleted message...',
    body: '<p>This is an old deleted message that is in the trash.</p>',
    isRead: true,
    date: '2026-02-20T09:00:00Z',
    mailboxId: 'trash',
    hasAttachments: false,
  },
];

/**
 * Mock email provider for demo and testing purposes.
 */
export class MockProvider extends EmailProvider {
  private _loggedIn: boolean;
  private _emails: EmailMessage[];
  private _mailboxes: Mailbox[];

  constructor() {
    super();
    this._loggedIn = false;
    this._emails = [...MOCK_EMAILS];
    this._mailboxes = MOCK_MAILBOXES.map((m) => ({ ...m }));
  }

  getInfo(): ProviderInfo {
    return {
      id: 'mock',
      name: 'Demo',
      description: 'Demo email account for testing',
    };
  }

  async isLoggedIn(): Promise<boolean> {
    return this._loggedIn;
  }

  async login(): Promise<boolean> {
    this._loggedIn = true;
    return true;
  }

  async logout(): Promise<void> {
    this._loggedIn = false;
  }

  async getUserEmail(): Promise<string> {
    return 'demo@example.com';
  }

  async getMailboxes(): Promise<Mailbox[]> {
    this._recalculateCounts();
    return this._mailboxes;
  }

  async getEmails(mailboxId: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { page = 0, pageSize = 10 } = options;
    const filtered = this._emails
      .filter((e) => e.mailboxId === mailboxId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const start = page * pageSize;
    const end = start + pageSize;
    return {
      emails: filtered.slice(start, end),
      hasMore: end < filtered.length,
    };
  }

  async getEmail(emailId: string): Promise<EmailMessage> {
    const email = this._emails.find((e) => e.id === emailId);
    if (!email) throw new Error('Email not found');
    return email;
  }

  async markAsRead(emailId: string): Promise<void> {
    const email = this._emails.find((e) => e.id === emailId);
    if (email) {
      email.isRead = true;
      this._recalculateCounts();
    }
  }

  async markAsUnread(emailId: string): Promise<void> {
    const email = this._emails.find((e) => e.id === emailId);
    if (email) {
      email.isRead = false;
      this._recalculateCounts();
    }
  }

  async moveEmail(emailId: string, targetMailboxId: string): Promise<void> {
    const email = this._emails.find((e) => e.id === emailId);
    if (email) {
      email.mailboxId = targetMailboxId;
      this._recalculateCounts();
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    const email = this._emails.find((e) => e.id === emailId);
    if (!email) return;
    if (email.mailboxId === 'trash') {
      this._emails = this._emails.filter((e) => e.id !== emailId);
    } else {
      email.mailboxId = 'trash';
    }
    this._recalculateCounts();
  }

  async searchEmails(query: string, options: GetEmailsOptions = {}): Promise<EmailListResult> {
    const { page = 0, pageSize = 10 } = options;
    const q = query.toLowerCase();
    const results = this._emails
      .filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.fromName.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const start = page * pageSize;
    const end = start + pageSize;
    return {
      emails: results.slice(start, end),
      hasMore: end < results.length,
    };
  }

  async sendEmail(data: ComposeData): Promise<boolean> {
    const newEmail: EmailMessage = {
      id: `msg-${Date.now()}`,
      from: 'demo@example.com',
      fromName: 'Demo User',
      to: data.to,
      cc: data.cc || [],
      bcc: data.bcc || [],
      subject: data.subject,
      snippet: data.body.substring(0, 60),
      body: `<p>${data.body.replace(/\n/g, '</p><p>')}</p>`,
      isRead: true,
      date: new Date().toISOString(),
      mailboxId: 'sent',
      hasAttachments: false,
    };
    this._emails.unshift(newEmail);
    this._recalculateCounts();
    return true;
  }

  private _recalculateCounts(): void {
    for (const mailbox of this._mailboxes) {
      const emails = this._emails.filter((e) => e.mailboxId === mailbox.id);
      mailbox.totalCount = emails.length;
      mailbox.unreadCount = emails.filter((e) => !e.isRead).length;
    }
  }
}
