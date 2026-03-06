'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'theme';

type ColorMode = 'light' | 'dark';

interface ThemePreferences {
  colorMode: ColorMode;
}

interface ThemeContextType {
  colorMode: ColorMode;
  /** Always 'corporate'; kept for compatibility with components that expect styleTheme */
  styleTheme: 'corporate';
  setColorMode: (mode: ColorMode) => void;
  setStyleTheme: () => void;
  toggleColorMode: () => void;
  theme: ColorMode;
  setTheme: (theme: ColorMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemePreferences | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<ThemePreferences & { styleTheme?: string }>;
    if (
      parsed.colorMode &&
      (parsed.colorMode === 'light' || parsed.colorMode === 'dark')
    ) {
      return { colorMode: parsed.colorMode };
    }
  } catch {
    // fall through
  }

  if (stored === 'light' || stored === 'dark') {
    return { colorMode: stored };
  }
  return null;
}

function applyTheme(preferences: ThemePreferences): void {
  const root = document.documentElement;
  // Add transition class for smooth theme switching
  root.classList.add('theme-transitioning');
  if (preferences.colorMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // Remove transition class after transition completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 300);
}

const INITIAL_PREFERENCES: ThemePreferences = {
  colorMode: 'dark',
};

export const ThemeProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [preferences, setPreferencesState] = useState<ThemePreferences>(INITIAL_PREFERENCES);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setPreferencesState(stored);
      applyTheme(stored);
    } else {
      const systemColor = getSystemColorMode();
      const next = { colorMode: systemColor };
      setPreferencesState(next);
      applyTheme(next);
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    applyTheme(preferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, hasMounted]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (): void => {
      const stored = getStoredTheme();
      if (!stored) {
        const next: ThemePreferences = {
          colorMode: media.matches ? 'dark' : 'light',
        };
        setPreferencesState(next);
        applyTheme(next);
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setPreferencesState((prev) => ({ ...prev, colorMode: mode }));
  }, []);

  const setStyleTheme = useCallback((_theme?: string) => {
    /* No-op: only corporate style is supported */
  }, []);

  const toggleColorMode = useCallback(() => {
    setPreferencesState((prev) => ({
      ...prev,
      colorMode: prev.colorMode === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setTheme = useCallback((t: ColorMode) => setColorMode(t), [setColorMode]);
  const toggleTheme = useCallback(() => toggleColorMode(), [toggleColorMode]);

  return (
    <ThemeContext.Provider
      value={{
        colorMode: preferences.colorMode,
        styleTheme: 'corporate' as const,
        setColorMode,
        setStyleTheme,
        toggleColorMode,
        theme: preferences.colorMode,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
