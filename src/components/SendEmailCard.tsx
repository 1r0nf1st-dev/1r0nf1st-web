'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getJson, ApiError } from '../apiClient';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';
import { parseEmailsClient, hasMaliciousScripts } from '../utils/emailValidation';
import { getApiBase } from '../config';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

/** True if the current user is the admin (by client email or server can-send). */
function useCanSendEmail(): boolean {
  const { user } = useAuth();
  const [serverAllowed, setServerAllowed] = useState<boolean | null>(null);

  const clientIsAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!user) {
      setServerAllowed(false);
      return;
    }
    let cancelled = false;
    getJson<{ allowed: boolean }>(`${getApiBase()}/email/can-send`)
      .then((data) => {
        if (!cancelled) setServerAllowed(data.allowed);
      })
      .catch(() => {
        if (!cancelled) setServerAllowed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Show card if client has admin email (no wait) or server confirmed admin
  return clientIsAdmin || serverAllowed === true;
}

export const SendEmailCard = (): JSX.Element | null => {
  const { user } = useAuth();
  const canSend = useCanSendEmail();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || !canSend) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const toTrim = to.trim();
    if (!toTrim) {
      setError('To is required.');
      return;
    }
    const { emails: toEmails, invalid: toInvalid } = parseEmailsClient(toTrim);
    if (toEmails.length === 0) {
      setError(toInvalid.length ? `Invalid To email(s): ${toInvalid.join(', ')}` : 'At least one valid To email is required.');
      return;
    }
    if (toInvalid.length > 0) {
      setError(`Invalid To email(s): ${toInvalid.join(', ')}`);
      return;
    }

    const ccTrim = cc.trim();
    if (ccTrim) {
      const { emails: ccEmails, invalid: ccInvalid } = parseEmailsClient(ccTrim);
      if (ccInvalid.length > 0) {
        setError(`Invalid CC email(s): ${ccInvalid.join(', ')}`);
        return;
      }
    }

    const subjectTrim = subject.trim();
    if (!subjectTrim) {
      setError('Subject is required.');
      return;
    }

    const messageTrim = message.trim();
    if (!messageTrim) {
      setError('Message is required.');
      return;
    }
    if (hasMaliciousScripts(messageTrim)) {
      setError('Message must not contain scripts or unsafe content.');
      return;
    }

    setSending(true);
    try {
      await getJson<{ success: boolean; messageId?: string }>(`${getApiBase()}/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toTrim,
          cc: ccTrim || undefined,
          subject: subjectTrim,
          message: messageTrim,
        }),
      });
      setSuccess(true);
      setTo('');
      setCc('');
      setSubject('');
      setMessage('');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to send email';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Send Email</h2>
      <p className={cardBody}>
        Send an email via Brevo. Only visible to admin. To and CC accept comma-separated addresses.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="email-to" className="block text-sm font-medium text-foreground mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <input
            id="email-to"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="one@example.com, two@example.com"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary"
            aria-required
            disabled={sending}
          />
        </div>
        <div>
          <label htmlFor="email-cc" className="block text-sm font-medium text-foreground mb-1">
            CC
          </label>
          <input
            id="email-cc"
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="optional, comma-separated"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary"
            disabled={sending}
          />
        </div>
        <div>
          <label htmlFor="email-subject" className="block text-sm font-medium text-foreground mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary"
            aria-required
            disabled={sending}
          />
        </div>
        <div>
          <label htmlFor="email-message" className="block text-sm font-medium text-foreground mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="email-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Plain text message (no scripts or HTML)"
            rows={4}
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary resize-y"
            aria-required
            disabled={sending}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400" role="status">
            Email sent successfully.
          </p>
        )}
        <button
          type="submit"
          className={`${btnBase} ${btnPrimary}`}
          disabled={sending}
          aria-busy={sending}
        >
          {sending ? 'Sending…' : 'Send Email'}
        </button>
      </form>
    </article>
  );
};
