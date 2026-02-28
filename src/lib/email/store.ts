import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { EmailProvider, Mailbox, EmailMessage } from './provider';

export const currentProvider: Writable<EmailProvider | null> = writable(null);

export const isLoggedIn: Writable<boolean> = writable(false);

export const userEmail: Writable<string> = writable('');

export const mailboxes: Writable<Mailbox[]> = writable([]);

export const currentEmails: Writable<EmailMessage[]> = writable([]);

export const currentEmail: Writable<EmailMessage | null> = writable(null);

export const loading: Writable<boolean> = writable(false);

export const errorMessage: Writable<string> = writable('');
