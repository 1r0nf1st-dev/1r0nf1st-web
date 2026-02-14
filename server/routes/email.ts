import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { config } from '../config.js';
import {
  parseEmails,
  sanitizeMessageBody,
  sendTransactionalEmail,
} from '../services/brevoService.js';
import { checkDomainAuth } from '../services/domainAuthService.js';
import { stripHtmlAndScripts } from '../utils/sanitize.js';

export const emailRouter = Router();

/** Only this email can send; no env/config required. */
const ADMIN_EMAIL = 'admin@1r0nf1st.com';

function isAdmin(req: AuthRequest): boolean {
  return req.email?.toLowerCase().trim() === ADMIN_EMAIL;
}

/** GET /api/email/can-send — whether the current user is allowed to send email (admin only). */
emailRouter.get('/can-send', authenticateToken, (req: AuthRequest, res) => {
  res.json({ allowed: isAdmin(req) });
});

/** GET /api/email/domain-auth?domain=example.com&dkimSelector=mail — DMARC + DKIM DNS check (admin only). */
emailRouter.get('/domain-auth', authenticateToken, async (req: AuthRequest, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Only the admin can run domain auth checks.' });
    return;
  }

  const domain = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
  const dkimSelector = typeof req.query.dkimSelector === 'string' ? req.query.dkimSelector.trim() : 'mail';

  if (!domain) {
    res.status(400).json({ error: 'Query parameter "domain" is required (e.g. example.com).' });
    return;
  }

  try {
    const result = await checkDomainAuth(domain, dkimSelector);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Domain auth check failed';
    res.status(500).json({ error: message });
  }
});

// POST /api/email/send — send email via Brevo (admin only)
emailRouter.post('/send', authenticateToken, async (req: AuthRequest, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Only the admin can send emails from this endpoint.' });
    return;
  }

  if (!config.brevoApiKey) {
    res.status(503).json({ error: 'Email sending is not configured. Set BREVO_API_KEY.' });
    return;
  }

  const { to: toRaw, cc: ccRaw, subject, message } = req.body as {
    to?: string;
    cc?: string;
    subject?: string;
    message?: string;
  };

  // Validate To (required, valid emails)
  const toStr = typeof toRaw === 'string' ? toRaw.trim() : '';
  if (!toStr) {
    res.status(400).json({ error: 'To is required.' });
    return;
  }
  const { emails: toEmails, invalid: toInvalid } = parseEmails(toStr);
  if (toEmails.length === 0) {
    res.status(400).json({
      error: toInvalid.length
        ? `Invalid To email(s): ${toInvalid.join(', ')}. Use comma-separated valid addresses.`
        : 'At least one valid To email is required.',
    });
    return;
  }
  if (toInvalid.length > 0) {
    res.status(400).json({
      error: `Invalid To email(s): ${toInvalid.join(', ')}. Use comma-separated valid addresses.`,
    });
    return;
  }

  // Validate CC (optional, but if provided must be valid)
  let ccEmails: string[] = [];
  if (ccRaw !== undefined && ccRaw !== null) {
    const ccStr = typeof ccRaw === 'string' ? ccRaw.trim() : String(ccRaw).trim();
    if (ccStr) {
      const parsed = parseEmails(ccStr);
      ccEmails = parsed.emails;
      if (parsed.invalid.length > 0) {
        res.status(400).json({
          error: `Invalid CC email(s): ${parsed.invalid.join(', ')}. Use comma-separated valid addresses.`,
        });
        return;
      }
    }
  }

  // Validate Subject (required, sanitized to prevent script injection)
  const subjectStr = stripHtmlAndScripts(typeof subject === 'string' ? subject.trim() : '');
  if (!subjectStr) {
    res.status(400).json({ error: 'Subject is required.' });
    return;
  }

  // Validate Message (required, sanitized)
  const messageStr = typeof message === 'string' ? message : '';
  const sanitized = sanitizeMessageBody(messageStr);
  if (!sanitized) {
    res.status(400).json({
      error: 'Message is required and must not contain only scripts or invalid content.',
    });
    return;
  }

  try {
    const result = await sendTransactionalEmail({
      to: toEmails,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: subjectStr,
      message: messageStr,
    });
    res.status(200).json({ success: true, messageId: result.messageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    res.status(500).json({ error: message });
  }
});
