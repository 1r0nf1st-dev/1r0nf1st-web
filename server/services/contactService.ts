import { supabase } from '../db/supabase.js';
import { createNote } from './noteService.js';
import { sendTransactionalEmail } from './brevoService.js';
import { sanitizeFreeText } from '../utils/sanitize.js';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX_LENGTH = 5000;
const NAME_MAX_LENGTH = 200;

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

/** Request metadata captured server-side when the contact form is submitted. */
export interface ContactRequestContext {
  /** ISO timestamp when the request was received. */
  submittedAt: string;
  /** Client IP (may be proxy or unknown). */
  ip?: string;
  /** User-Agent string (browser, OS, etc.). */
  userAgent?: string;
  /** Accept-Language header. */
  acceptLanguage?: string;
  /** Referer (page they came from), if present. */
  referer?: string;
}

export interface ContactValidationError {
  field: string;
  message: string;
}

/**
 * Resolve admin user id by email (admin@1r0nf1st.com).
 * Uses Supabase Auth Admin API.
 */
export async function getAdminUserId(): Promise<string> {
  if (!supabase) {
    throw new Error('Database not configured');
  }
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw new Error(`Failed to look up admin user: ${error.message}`);
  }
  const admin = data?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!admin) {
    throw new Error(`Admin user with email ${ADMIN_EMAIL} not found`);
  }
  return admin.id;
}

/**
 * Build TipTap doc content for the contact note (so content_text trigger works).
 * Includes submission plus optional request context (time, IP, browser, etc.).
 */
function buildNoteContent(
  submission: ContactSubmission,
  context?: ContactRequestContext,
): Record<string, unknown> {
  const lines: string[] = [
    `From: ${submission.email}`,
    `Name: ${submission.name}`,
    '',
    submission.message,
  ];

  if (context) {
    lines.push('');
    lines.push('---');
    lines.push('Submitted: ' + context.submittedAt);
    if (context.ip) {
      lines.push('IP: ' + context.ip);
    }
    if (context.userAgent) {
      lines.push('User-Agent: ' + context.userAgent);
    }
    if (context.acceptLanguage) {
      lines.push('Accept-Language: ' + context.acceptLanguage);
    }
    if (context.referer) {
      lines.push('Referer: ' + context.referer);
    }
  }

  const paragraphContents = lines.map((text) => ({
    type: 'paragraph',
    content: text ? [{ type: 'text' as const, text }] : [],
  }));
  return {
    type: 'doc',
    content: paragraphContents,
  };
}

/**
 * Validate contact form input. Returns an array of errors (empty if valid).
 */
export function validateContactSubmission(body: unknown): ContactValidationError[] {
  const errors: ContactValidationError[] = [];
  const name = typeof (body as Record<string, unknown>).name === 'string'
    ? (body as Record<string, unknown>).name as string
    : '';
  const email = typeof (body as Record<string, unknown>).email === 'string'
    ? (body as Record<string, unknown>).email as string
    : '';
  const message = typeof (body as Record<string, unknown>).message === 'string'
    ? (body as Record<string, unknown>).message as string
    : '';

  const nameTrim = name.trim();
  if (!nameTrim) {
    errors.push({ field: 'name', message: 'Name is required.' });
  } else if (nameTrim.length > NAME_MAX_LENGTH) {
    errors.push({ field: 'name', message: `Name must be at most ${NAME_MAX_LENGTH} characters.` });
  }

  const emailTrim = email.trim();
  if (!emailTrim) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else if (!EMAIL_REGEX.test(emailTrim)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  const messageTrim = message.trim();
  if (!messageTrim) {
    errors.push({ field: 'message', message: 'Message is required.' });
  } else if (messageTrim.length > MESSAGE_MAX_LENGTH) {
    errors.push({ field: 'message', message: `Message must be at most ${MESSAGE_MAX_LENGTH} characters.` });
  }

  return errors;
}

/**
 * Normalize and validate; returns submission or throws with validation errors.
 */
export function parseContactBody(body: unknown): ContactSubmission {
  const errors = validateContactSubmission(body);
  if (errors.length > 0) {
    const msg = errors.map((e) => `${e.field}: ${e.message}`).join(' ');
    throw new Error(msg);
  }
  const b = body as Record<string, unknown>;
  return {
    name: sanitizeFreeText((b.name as string).trim(), NAME_MAX_LENGTH),
    email: (b.email as string).trim().toLowerCase(),
    message: sanitizeFreeText((b.message as string).trim(), MESSAGE_MAX_LENGTH),
  };
}

/**
 * Create a note for the admin user with the contact details and send a confirmation email.
 * Optional requestContext adds submission time, IP, User-Agent, etc. to the note.
 */
export async function submitContact(
  submission: ContactSubmission,
  requestContext?: ContactRequestContext,
): Promise<void> {
  const adminUserId = await getAdminUserId();
  const title = `Contact from ${submission.name}`;
  const content = buildNoteContent(submission, requestContext);

  await createNote(adminUserId, {
    title,
    content,
  });

  await sendTransactionalEmail({
    to: [submission.email],
    subject: "We've received your message",
    message: `Hi ${submission.name},\n\nThank you for getting in touch. We've received your message and will get back to you as soon as we can.\n\nBest,\n1r0nf1st`,
  });
}
