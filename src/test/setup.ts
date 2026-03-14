import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Global Supabase client mock — prevents "supabaseUrl is required" errors in
// tests that render components which use AuthContext / AuthProvider.
// AuthContext.test.tsx overrides this with a more specific mock.
// ---------------------------------------------------------------------------
vi.mock('../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});

// Mock window.fetch globally. Tests that need fetch (e.g. API calls) must mock it
// in their own scope (beforeEach) and restore in afterEach if needed.
global.fetch = vi.fn();
