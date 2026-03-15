'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './Navigation/ThemeToggle';
import { AuthControls } from './Navigation/AuthControls';
import { btnBase, btnPrimary } from '../styles/buttons';
import { BrandName } from './BrandName';

export const Hero = (): JSX.Element => {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/projects';
  const isLoginPage = pathname === '/login';
  const isChangePasswordPage =
    pathname === '/change-password' || pathname === '/notes/change-password';

  return (
    <header className="w-full">
      <div className="relative rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg overflow-hidden px-6 py-8 md:px-10 md:py-10 glass-card-fallback">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border-2 border-primary/40 dark:border-border bg-primary/15 dark:bg-primary/10 text-xs uppercase tracking-wider text-primary-strong dark:text-muted font-medium">
              Tools · Next.js + React
            </span>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <AuthControls />
              </div>
            </div>
          </div>
          <Link href="/" className="no-underline text-inherit flex items-center gap-4 mt-4 mb-2" aria-label="1r0nf1st">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight cursor-pointer">
              <BrandName />
            </h1>
          </Link>
          <p className="mb-6 max-w-md text-muted leading-relaxed">
            A growing toolbox of web experiences and utilities I use every day, powered by live data
            from GitHub, Medium, Spotify, Strava, weather APIs, and more.
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
            <div className="sm:hidden">
              <AuthControls />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
