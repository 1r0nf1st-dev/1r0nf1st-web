'use client';

import type { JSX } from 'react';
import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { ChromeLayout } from '../components/ChromeLayout';
import { cardClasses, cardTitle } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';
import { logger } from '../utils/logger';
import { supabaseClient } from '../lib/supabaseClient';

export const ChangePasswordPage = (): JSX.Element => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [recoveryRefreshToken, setRecoveryRefreshToken] = useState<string | null>(null);
  const { user, changePassword, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read recovery tokens from URL hash (from password reset email link)
  useEffect(() => {
    // Check both hash and query params (Supabase might use either)
    const hash = window.location.hash;
    const search = window.location.search;

    let params: URLSearchParams | null = null;
    if (hash) {
      params = new URLSearchParams(hash.replace(/^#/, ''));
    } else if (search) {
      params = new URLSearchParams(search.replace(/^\?/, ''));
    }

    if (!params) return;

    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    // Log for debugging
    if (type === 'recovery' || accessToken) {
      logger.debug('[Password Reset] Detected recovery link', {
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });
    }

    if (type === 'recovery' && accessToken) {
      setRecoveryToken(accessToken);
      setRecoveryRefreshToken(refreshToken || null);
      // Clear hash/query so it isn't sent in requests or shown in URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (recoveryToken) {
        if (!supabaseClient) {
          throw new Error('Password reset is not configured. Please contact support.');
        }
        // Set the recovery session directly with Supabase — the new password
        // never touches the Express server.
        const { error: sessionError } = await supabaseClient.auth.setSession({
          access_token: recoveryToken,
          refresh_token: recoveryRefreshToken ?? '',
        });
        if (sessionError) {
          throw new Error('This reset link is invalid or has expired. Please request a new one.');
        }
        const { error: updateError } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });
        if (updateError) {
          throw new Error(updateError.message);
        }
        await supabaseClient.auth.signOut();
        setSuccess('Password changed successfully! You can now log in.');
        setNewPassword('');
        setConfirmPassword('');
        setRecoveryToken(null);
        setRecoveryRefreshToken(null);
        setTimeout(() => {
          router.replace('/login?reset=success');
        }, 2000);
      } else {
        await changePassword(newPassword);
        setSuccess('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.replace(searchParams.get('returnTo') || '/');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Recovery link: no login required. Logged-in change: require login.
  if (!recoveryToken && !authLoading && !user) {
    router.replace('/login?returnTo=/notes/change-password');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="opacity-70">Redirecting to login…</div>
      </div>
    );
  }

  return (
    <ChromeLayout>
      <section className="w-full max-w-[500px] mx-auto space-y-8">
          <article className={cardClasses}>

            <h2 className={`${cardTitle} mb-6`}>
              {recoveryToken ? 'Set new password' : 'Change Password'}
            </h2>
            <form onSubmit={handleSubmit} className="relative z-10">
              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 mb-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-sm">
                  {success}
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="newPassword"
                  className="block mb-2 text-sm font-medium text-foreground"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 rounded-xl border-2 border-primary/35 dark:border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary/55 dark:focus:border-transparent"
                />
                <p className="mt-2 text-[0.85rem] opacity-70">Must be at least 6 characters</p>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-foreground"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 rounded-xl border-2 border-primary/35 dark:border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary/55 dark:focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className={`${btnBase} ${btnPrimary} w-full mb-4`}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Changing password...'
                  : recoveryToken
                    ? 'Set password'
                    : 'Change Password'}
              </button>
            </form>
          </article>
      </section>
    </ChromeLayout>
  );
};
