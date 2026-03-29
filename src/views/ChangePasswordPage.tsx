'use client';

import type { JSX } from 'react';
import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
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
      <section className="flex h-full min-h-0 flex-1 items-center justify-center">
        <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]" role="status">
          Redirecting to login…
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label={recoveryToken ? 'Set New Password' : 'Change Password'}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="page-content min-h-0">
        <div className="content-panel" style={{ maxWidth: 520, marginInline: 'auto' }}>
          <h2 className="panel-title">{recoveryToken ? 'Set new password' : 'Change Password'}</h2>

          <form onSubmit={handleSubmit}>
            {error ? (
              <p
                className="font-display text-[12px] text-[color:var(--color-orange)] mb-4"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {success ? (
              <p
                className="font-display text-[12px] text-[color:var(--color-text-inv-2)] mb-4"
                role="status"
              >
                {success}
              </p>
            ) : null}

            <div className="field-group">
              <label htmlFor="newPassword" className="field-label">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="field-input"
                aria-label="New password"
              />
              <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)] mt-2">
                Must be at least 6 characters
              </p>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword" className="field-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="field-input"
                aria-label="Confirm new password"
              />
            </div>

            <button type="submit" className="act-btn primary w-full" disabled={isLoading}>
              {isLoading
                ? 'Changing password...'
                : recoveryToken
                  ? 'Set password'
                  : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
