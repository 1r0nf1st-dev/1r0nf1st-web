import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reads the URL hash for Supabase auth redirect errors (e.g. otp_expired)
 * and shows a friendly message so users know to request a new link.
 */
export const AuthHashErrorHandler = (): JSX.Element | null => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const description = params.get('error_description');

    if (error === 'access_denied' && errorCode === 'otp_expired') {
      setMessage(
        description && description.length < 120
          ? decodeURIComponent(description.replace(/\+/g, ' '))
          : 'This password reset link has expired or was already used.',
      );
      // Clear the hash so the message doesn't reappear on refresh
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 dark:bg-amber-600/95 text-amber-950 dark:text-amber-100 px-4 py-3 shadow-md"
    >
      <div className="max-w-[600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-800 rounded"
          >
            Go to login
          </Link>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-800 rounded"
          >
            Request a new reset link
          </Link>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-sm font-medium opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
