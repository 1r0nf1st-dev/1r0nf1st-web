import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

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

// Mock window.fetch globally
global.fetch = vi.fn();
