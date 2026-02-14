import { config } from '../config.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/** RFC-style email regex (basic). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse comma-separated string into trimmed, non-empty emails.
 * Returns array of invalid entries for error reporting.
 */
export function parseEmails(value: string): { emails: string[]; invalid: string[] } {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  const emails: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (EMAIL_REGEX.test(p)) {
      emails.push(p);
    } else {
      invalid.push(p);
    }
  }
  return { emails, invalid };
}

/**
 * Sanitize message body: remove script tags, javascript: URLs, and event handlers
 * to prevent malicious script injection. Returns plain text safe for email body.
 */
export function sanitizeMessageBody(message: string): string {
  if (typeof message !== 'string') return '';
  let s = message;
  // Remove script tags and content
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove style tags and content (can contain expression() etc.)
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove javascript: and data: URLs
  s = s.replace(/\s*(javascript|data|vbscript):\s*[^\s]*/gi, '');
  // Remove event handlers (onclick=, onerror=, etc.)
  s = s.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  s = s.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  // Strip remaining HTML tags
  s = s.replace(/<[^>]+>/g, ' ');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  subject: string;
  message: string;
  /** Sender email (must be verified in Brevo). Uses config.brevoFromEmail if not provided. */
  fromEmail?: string;
  /** Sender name. Uses config.brevoFromName if not provided. */
  fromName?: string;
}

export interface SendEmailResult {
  messageId: string;
}

/**
 * Send a transactional email via Brevo API.
 * Requires config.brevoApiKey and verified sender in Brevo dashboard.
 */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = config.brevoApiKey;
  if (!apiKey) {
    throw new Error('Brevo API key is not configured. Set BREVO_API_KEY in your .env.');
  }

  const fromEmail = (params.fromEmail ?? config.brevoFromEmail).trim();
  if (!fromEmail) {
    throw new Error('Sender email is not configured. Set BREVO_FROM_EMAIL in your .env.');
  }
  const fromName = params.fromName ?? (config.brevoFromName || '1r0nf1st');

  const body = params.message;
  const sanitized = sanitizeMessageBody(body);
  if (!sanitized) {
    throw new Error('Message body is required and must not be empty after sanitization.');
  }

  const toList = params.to.map((email) => ({ email, name: email }));
  const ccList = (params.cc ?? []).map((email) => ({ email, name: email }));

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: toList,
    ...(ccList.length > 0 && { cc: ccList }),
    subject: params.subject,
    textContent: sanitized,
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    let errMessage = `Brevo API error: ${response.status}`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (typeof json.message === 'string') errMessage = json.message;
    } catch {
      if (text) errMessage = text;
    }
    throw new Error(errMessage);
  }

  const data = (await response.json()) as { messageId?: string };
  const messageId = data.messageId ?? '';
  return { messageId };
}
