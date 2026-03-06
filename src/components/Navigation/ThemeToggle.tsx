'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Theme toggle button component.
 * Switches between light and dark mode.
 */
export const ThemeToggle = (): JSX.Element => {
  const { colorMode, toggleColorMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="p-2 min-w-0 text-xl leading-none opacity-0 pointer-events-none text-foreground"
        aria-hidden
      >
        <Moon aria-hidden />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleColorMode}
      aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 min-w-0 text-xl leading-none focus:outline-none transition-transform duration-200 hover:scale-110 active:scale-95 text-foreground"
    >
      {colorMode === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
};
