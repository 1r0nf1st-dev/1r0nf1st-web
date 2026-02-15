'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export const Hero = (): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isProjectsPage = pathname === '/projects';
  const isLoginPage = pathname === '/login';
  const isChangePasswordPage = pathname === '/change-password';

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push('/');
  };

  return (
    <header className="w-full">
      <div className="relative rounded-xl border-2 border-primary/40 dark:border-border bg-gradient-to-br from-white via-primary/8 to-primary/5 dark:from-surface dark:to-surface-soft shadow-lg dark:shadow-soft overflow-hidden px-6 py-8 md:px-10 md:py-10 backdrop-blur-sm">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent dark:from-primary/20 dark:via-transparent from-10% to-55% opacity-100 dark:opacity-80 pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border-2 border-primary/40 dark:border-border bg-primary/15 dark:bg-primary/10 text-xs uppercase tracking-wider text-primary-strong dark:text-muted font-medium">
              Portfolio · Next.js + React
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                }
                className={`${btnBase} ${btnGhost} p-2 min-w-0 text-xl leading-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full`}
              >
                {theme === 'dark' ? (
                  <HiSun aria-hidden />
                ) : (
                  <HiMoon aria-hidden />
                )}
              </button>
              {user && (
                <span className="text-sm opacity-80 text-muted">
                  Logged in as <strong>{user.username || user.email}</strong>
                </span>
              )}
            </div>
          </div>
          <Link href="/" className="no-underline text-inherit flex items-center gap-4 mt-4 mb-2">
            <img
              src="/logo.jpg"
              alt="1r0nf1st logo"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-primary/40 dark:border-border shadow-sm flex-shrink-0"
            />
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight cursor-pointer">
              1r0nf1st
            </h1>
          </Link>
          <p className="mb-6 max-w-md text-muted leading-relaxed">
            A dynamic portfolio showcasing my latest projects, writing, and activity across GitHub, Medium, Spotify, and Strava. Built with Next.js, React, TypeScript, and real-time API integrations.
          </p>
          <div className="flex flex-wrap gap-3">
            {isProjectsPage || isLoginPage || isChangePasswordPage ? (
              <Link href="/" className={`${btnBase} ${btnPrimary}`}>
                Back to Home
              </Link>
            ) : (
              <Link href="/projects" className={`${btnBase} ${btnPrimary}`}>
                View projects
              </Link>
            )}
            {user ? (
              <>
                {!isChangePasswordPage && (
                  <Link
                    href="/change-password"
                    className={`${btnBase} ${btnGhost}`}
                  >
                    Change Password
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${btnBase} ${btnGhost}`}
                >
                  Logout
                </button>
              </>
            ) : (
              !isLoginPage && (
                <Link href="/login" className={`${btnBase} ${btnGhost}`}>
                  Login
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
