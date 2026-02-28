import { MockProvider } from './mock.js';
import { GmailProvider } from './gmail.js';
import { MicrosoftProvider } from './microsoft.js';
import { YahooProvider } from './yahoo.js';

/**
 * Registry of all available email providers.
 * To add a new provider, create a class that extends EmailProvider
 * and add it to this array.
 */
const providers = [
  new GmailProvider(),
  new MicrosoftProvider(),
  new YahooProvider(),
  new MockProvider(),
];

/**
 * Get all registered providers.
 * @returns {import('./provider.js').EmailProvider[]}
 */
export function getProviders() {
  return providers;
}

/**
 * Get a provider by its ID.
 * @param {string} id - Provider ID
 * @returns {import('./provider.js').EmailProvider|undefined}
 */
export function getProviderById(id) {
  return providers.find((p) => p.getInfo().id === id);
}

export { EmailProvider } from './provider.js';
export { MockProvider } from './mock.js';
export { GmailProvider } from './gmail.js';
export { MicrosoftProvider } from './microsoft.js';
export { YahooProvider } from './yahoo.js';
