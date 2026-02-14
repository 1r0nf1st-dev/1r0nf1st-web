/**
 * Basic email format validation (RFC-style).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailsClient(value: string): { emails: string[]; invalid: string[] } {
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

/** Check if message contains obviously malicious script patterns. */
export function hasMaliciousScripts(message: string): boolean {
  if (typeof message !== 'string') return true;
  const lower = message.toLowerCase();
  const patterns = [
    '<script',
    'javascript:',
    'vbscript:',
    'data:',
    'onclick=',
    'onerror=',
    'onload=',
    'onmouseover=',
  ];
  return patterns.some((p) => lower.includes(p));
}
