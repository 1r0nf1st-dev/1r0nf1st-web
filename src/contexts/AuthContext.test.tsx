import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { JSX } from 'react';

// ---------------------------------------------------------------------------
// Hoist the mock auth object so it can be referenced inside vi.mock factory.
// vi.mock calls are hoisted to the top of the file by Vitest; any variables
// they close over must also be hoisted via vi.hoisted().
// ---------------------------------------------------------------------------
const mockUnsubscribe = vi.hoisted(() => vi.fn());
const capturedAuthCallbacks = vi.hoisted(() => ({ current: null as ((event: string, session: Session | null) => void) | null }));

const mockAuth = vi.hoisted(() => ({
  onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
    capturedAuthCallbacks.current = cb;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  setSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabaseClient: { auth: mockAuth },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as SupabaseUser,
    ...overrides,
  } as Session;
}

/** Trigger the captured onAuthStateChange callback to simulate an SDK event. */
function fireAuthChange(event: string, session: Session | null): void {
  capturedAuthCallbacks.current?.(event, session);
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    capturedAuthCallbacks.current = null;

    // Default: onAuthStateChange fires immediately with null session (unauthenticated)
    mockAuth.onAuthStateChange.mockImplementation(
      (cb: (event: string, session: Session | null) => void) => {
        capturedAuthCallbacks.current = cb;
        setTimeout(() => cb('INITIAL_SESSION', null), 0);
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children as JSX.Element}</AuthProvider>
  );

  // -------------------------------------------------------------------------
  describe('useAuth hook', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider',
      );
      consoleSpy.mockRestore();
    });

    it('returns null user/token and isLoading false when no session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('populates user and token when onAuthStateChange fires with a session', async () => {
      const session = makeSession();
      mockAuth.onAuthStateChange.mockImplementation(
        (cb: (event: string, session: Session | null) => void) => {
          capturedAuthCallbacks.current = cb;
          setTimeout(() => cb('SIGNED_IN', session), 0);
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        },
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      });
      expect(result.current.token).toBe('test-access-token');
      expect(localStorage.getItem('authToken')).toBe('test-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
    });

    it('clears state and localStorage when session becomes null', async () => {
      localStorage.setItem('authToken', 'old-token');
      localStorage.setItem('refreshToken', 'old-refresh');

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('unsubscribes from auth state changes on unmount', async () => {
      const { result, unmount } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('login', () => {
    it('calls signInWithPassword with email and password', async () => {
      const session = makeSession();
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session, user: session.user },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
        fireAuthChange('SIGNED_IN', session);
      });

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.token).toBe('test-access-token');
    });

    it('throws a friendly message for invalid credentials', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('throws a friendly message when email is not confirmed', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Email not confirmed', status: 400 },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'password123');
        }),
      ).rejects.toThrow('Please confirm your email address');
    });
  });

  // -------------------------------------------------------------------------
  describe('register', () => {
    it('calls signUp with email, password, and username metadata', async () => {
      const session = makeSession();
      mockAuth.signUp.mockResolvedValue({
        data: { session, user: session.user },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.register('new@example.com', 'password123', 'newuser');
        fireAuthChange('SIGNED_IN', session);
      });

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: { username: 'newuser' } },
      });
    });

    it('throws when email verification is required (null session)', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: {
          session: null,
          user: { id: 'user-1', email: 'new@example.com', user_metadata: {} },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.register('new@example.com', 'password123');
        }),
      ).rejects.toThrow('Please check your email to verify your account');
    });

    it('throws the Supabase error message on failure', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'User already registered', status: 422 },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password123');
        }),
      ).rejects.toThrow('User already registered');
    });
  });

  // -------------------------------------------------------------------------
  describe('changePassword', () => {
    it('calls updateUser with the new password', async () => {
      mockAuth.updateUser.mockResolvedValue({ data: {}, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.changePassword('newpass123');
      });

      expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newpass123' });
    });

    it('throws on updateUser error', async () => {
      mockAuth.updateUser.mockResolvedValue({
        data: {},
        error: { message: 'New password should be different from the old password.' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.changePassword('samepassword');
        }),
      ).rejects.toThrow('New password should be different');
    });
  });

  // -------------------------------------------------------------------------
  describe('logout', () => {
    it('calls signOut and clears state when onAuthStateChange fires SIGNED_OUT', async () => {
      const session = makeSession();
      mockAuth.onAuthStateChange.mockImplementation(
        (cb: (event: string, session: Session | null) => void) => {
          capturedAuthCallbacks.current = cb;
          setTimeout(() => cb('SIGNED_IN', session), 0);
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        },
      );
      mockAuth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.user).not.toBeNull());

      await act(async () => {
        await result.current.logout();
        fireAuthChange('SIGNED_OUT', null);
      });

      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
