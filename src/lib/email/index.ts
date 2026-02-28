import { MockProvider } from './mock';
import { GmailProvider } from './gmail';
import { MicrosoftProvider } from './microsoft';
import { YahooProvider } from './yahoo';
import { JmapProvider } from './jmap';
import type { EmailProvider } from './provider';

/**
 * Registry of all available email providers.
 */
const providers: EmailProvider[] = [
  new GmailProvider(),
  new MicrosoftProvider(),
  new YahooProvider(),
  new JmapProvider(),
  new MockProvider(),
];

/**
 * Get all registered providers.
 */
export function getProviders(): EmailProvider[] {
  return providers;
}

/**
 * Get a provider by its ID.
 */
export function getProviderById(id: string): EmailProvider | undefined {
  return providers.find((p) => p.getInfo().id === id);
}

export { EmailProvider } from './provider';
export type { Mailbox, EmailMessage, ComposeData, ProviderInfo, GetEmailsOptions, EmailListResult } from './provider';
export { MockProvider } from './mock';
export { GmailProvider } from './gmail';
export { MicrosoftProvider } from './microsoft';
export { YahooProvider } from './yahoo';
export { JmapProvider } from './jmap';
