/**
 * Server-side input sanitization to protect against XSS, script injection,
 * and dangerous content. Use for all user-controlled free text and file metadata.
 *
 * SQL injection: Supabase client uses parameterized queries; do not build raw SQL.
 */

/** Remove script/style tags, javascript:/data: URLs, event handlers, and strip HTML. */
export function stripHtmlAndScripts(input: string): string {
  if (typeof input !== 'string') return '';
  let s = input;
  // Remove script tags and content
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove style tags and content (can contain expression() etc.)
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove javascript:, data:, vbscript: URLs
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

/** Remove control characters and limit length. Use for plain-text fields (titles, names). */
export function sanitizePlainText(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') return '';
  // Remove control chars (0x00-0x1F except tab/newline/carriage return, and 0x7F)
  const withoutControl = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return withoutControl.trim().slice(0, maxLength);
}

/** Sanitize for storage/display: strip HTML/scripts then plain-text sanitize. */
export function sanitizeFreeText(input: string, maxLength = 10000): string {
  return sanitizePlainText(stripHtmlAndScripts(input), maxLength);
}

/** Sanitize file name: only allow safe characters, no path separators. */
export function sanitizeFileName(name: string): string {
  if (typeof name !== 'string') return 'unnamed';
  // Remove path segments and allow only alphanumeric, dot, underscore, hyphen
  const basename = name.replace(/^.*[/\\]/, '');
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
  return safe && /[a-zA-Z0-9]/.test(safe) ? safe : 'unnamed';
}

/** Reject path traversal and ensure path is within expected prefix. */
export function isSafeStoragePath(path: string, allowedPrefix: string): boolean {
  if (typeof path !== 'string' || !path.trim()) return false;
  const normalized = path.replace(/\\/g, '/').trim();
  if (normalized.includes('..') || normalized.startsWith('/')) return false;
  return normalized.startsWith(allowedPrefix);
}

/** Allowed MIME types for note attachments (whitelist). */
export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
]);

/** Check if MIME type is allowed for upload. */
export function isAllowedMimeType(mime: string): boolean {
  if (!mime || typeof mime !== 'string') return false;
  const normalized = mime.trim().toLowerCase().split(';')[0].trim();
  if (ALLOWED_ATTACHMENT_MIME_TYPES.has(normalized)) return true;
  if (normalized.startsWith('image/')) return true;
  return false;
}

/** Dangerous file extensions that should never be accepted. */
const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'vbs', 'js', 'jse', 'ws', 'wsf', 'ps1', 'sh', 'bash',
  'php', 'phtml', 'php3', 'php4', 'php5', 'phar', 'asp', 'aspx', 'jsp', 'cgi',
  'jar', 'dll', 'so', 'dylib',
]);

/** Check file name (after sanitizeFileName) for dangerous extension. */
export function hasDangerousExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? DANGEROUS_EXTENSIONS.has(ext) : false;
}
