import { Router, Request, Response } from 'express';
import {
  submitContact,
  parseContactBody,
  type ContactRequestContext,
} from '../services/contactService.js';
import { config } from '../config.js';

export const contactRouter = Router();

/** Get client IP from request (handles proxies via X-Forwarded-For). */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.get('x-forwarded-for');
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress;
}

/** Build request context for the contact note (time, IP, browser, etc.). */
function buildRequestContext(req: Request): ContactRequestContext {
  const submittedAt = new Date().toISOString();
  const ip = getClientIp(req);
  const userAgent = req.get('user-agent') ?? undefined;
  const acceptLanguage = req.get('accept-language') ?? undefined;
  const referer = req.get('referer') ?? req.get('referrer') ?? undefined;
  return {
    submittedAt,
    ...(ip && { ip }),
    ...(userAgent && { userAgent }),
    ...(acceptLanguage && { acceptLanguage }),
    ...(referer && { referer }),
  };
}

/** POST /api/contact — public contact form. Creates note for admin and sends confirmation email. */
contactRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  if (!config.brevoApiKey) {
    res.status(503).json({
      error: 'Contact form is temporarily unavailable. Please try again later.',
    });
    return;
  }

  let submission;
  try {
    submission = parseContactBody(req.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    res.status(400).json({ error: message });
    return;
  }

  const requestContext = buildRequestContext(req);

  try {
    await submitContact(submission, requestContext);
    res.status(200).json({
      success: true,
      message: "Thanks for your message. We'll be in touch soon.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    res.status(500).json({ error: message });
  }
});
