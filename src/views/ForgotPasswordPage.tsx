'use client';

import type { JSX } from 'react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ChromeLayout } from '../components/ChromeLayout';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';
import { supabaseClient } from '../lib/supabaseClient';

export const ForgotPasswordPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    try {
      if (!supabaseClient) {
        setError('Password reset is not configured. Please contact support.');
        return;
      }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/notes/change-password`,
      });
      if (error) {
        setError(error.message || 'Something went wrong');
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChromeLayout>
      <section className="w-full max-w-[500px] mx-auto">
          <article className={cardClasses}>

            <h2 className={`${cardTitle} mb-4`}>Reset password</h2>
            {sent ? (
              <div className="relative z-10 space-y-4">
                <p className={cardBody}>
                  If an account exists for that email, we&apos;ve sent a link to reset your
                  password. Check your inbox and spam folder.
                </p>
                <p className="text-sm opacity-80">
                  The link expires in about an hour. If you don&apos;t see it, request a new one
                  below.
                </p>
                <Link href="/login" className={`${btnBase} ${btnPrimary} inline-block`}>
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10">
                {error && (
                  <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full p-3 rounded-xl border-2 border-primary/35 dark:border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary/55 dark:focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className={`${btnBase} ${btnPrimary} w-full mb-4`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </button>
                <Link
                  href="/login"
                  className={`${btnBase} ${btnGhost} w-full block text-center text-sm`}
                >
                  Back to login
                </Link>
              </form>
            )}
          </article>
      </section>
    </ChromeLayout>
  );
};
