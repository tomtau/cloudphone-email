import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<import('./provider.js').EmailProvider|null>} */
export const currentProvider = writable(null);

/** @type {import('svelte/store').Writable<boolean>} */
export const isLoggedIn = writable(false);

/** @type {import('svelte/store').Writable<string>} */
export const userEmail = writable('');

/** @type {import('svelte/store').Writable<import('./provider.js').Mailbox[]>} */
export const mailboxes = writable([]);

/** @type {import('svelte/store').Writable<import('./provider.js').EmailMessage[]>} */
export const currentEmails = writable([]);

/** @type {import('svelte/store').Writable<import('./provider.js').EmailMessage|null>} */
export const currentEmail = writable(null);

/** @type {import('svelte/store').Writable<boolean>} */
export const loading = writable(false);

/** @type {import('svelte/store').Writable<string>} */
export const errorMessage = writable('');
