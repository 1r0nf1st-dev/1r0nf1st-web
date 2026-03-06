'use client';

import type { JSX } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useMobileMenu } from '../../hooks/useMobileMenu';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ThemeToggle } from '../Navigation/ThemeToggle';
import { AuthControls } from '../Navigation/AuthControls';
import { UnifiedMobileMenu } from '../UnifiedMobileMenu';
import { btnBase, btnGhost } from '../../styles/buttons';

const linkClass = (active: boolean) =>
  `text-sm font-medium no-underline transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 ${
    active ? 'text-primary-strong dark:text-primary' : 'text-muted hover:text-foreground'
  }`;

export const CorporateNav = (): JSX.Element => {
  const pathname = usePathname();
  const mobileMenu = useMobileMenu();
  const isNotesPage = pathname?.startsWith('/notes') ?? false;


  const navLinks = (
    <>
      <Link
        href="/about"
        className={linkClass(pathname === '/about')}
        onClick={mobileMenu.close}
      >
        01 ABOUT
      </Link>
      <Link
        href="/projects"
        className={linkClass(pathname === '/projects')}
        onClick={mobileMenu.close}
      >
        02 PROJECT
      </Link>
      <Link
        href="/contact"
        className={linkClass(pathname === '/contact')}
        onClick={mobileMenu.close}
      >
        03 CONTACT
      </Link>
    </>
  );


  return (
    <header className="w-full border-b border-border bg-surface/95 dark:bg-surface backdrop-blur-sm sticky top-0 z-40">
      <nav
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-2 no-underline text-inherit shrink-0">
          <span className="font-semibold text-foreground text-lg tracking-tight">
            1r0nf1st
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 xl:gap-8" role="navigation">
          {navLinks}
        </div>

        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0 min-w-0">
          <ThemeToggle />
          <AuthControls variant="corporate" />
        </div>

        <div
          className="flex lg:hidden items-center gap-2 shrink-0 ml-auto"
          style={{ minWidth: 0 }}
        >
          <ThemeToggle />
          {isNotesPage ? (
            <UnifiedMobileMenu />
          ) : (
            <button
              ref={mobileMenu.triggerRef}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                mobileMenu.toggle();
              }}
              aria-label={mobileMenu.isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenu.isOpen}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-foreground hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-opacity"
            >
              {mobileMenu.isOpen ? (
                <X aria-hidden className="w-6 h-6 shrink-0" />
              ) : (
                <Menu aria-hidden className="w-6 h-6 shrink-0" />
              )}
            </button>
          )}
        </div>
      </nav>

      {typeof document !== 'undefined' &&
        !isNotesPage &&
        mobileMenu.isOpen &&
        createPortal(
          <div
            className="lg:hidden"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              isolation: 'isolate',
            }}
          >
            <div
              ref={mobileMenu.menuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
              className={`overflow-y-auto overscroll-contain transition-transform duration-300 ease-out bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md ${
                mobileMenu.isOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              style={{
                position: 'fixed',
                inset: 0,
              }}
            >
          <div className="min-h-screen min-h-dvh flex flex-col">
            {/* Header: logo left, close right */}
            <div className="flex justify-between items-center px-6 py-6 border-b border-border shrink-0">
              <Link
                href="/"
                onClick={mobileMenu.close}
                className="flex items-center gap-2 no-underline text-inherit"
              >
                <span className="font-semibold text-foreground text-lg tracking-tight">
                  1r0nf1st
                </span>
              </Link>
              <button
                type="button"
                onClick={mobileMenu.close}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" aria-hidden />
              </button>
            </div>
            {/* Main nav - centered, takes remaining space */}
            <nav
              className="flex-1 flex flex-col justify-center gap-0 px-6 py-8 [&_a]:text-lg [&_a]:py-4 [&_a]:border-b [&_a]:border-border [&_a:last-of-type]:border-b-0"
              aria-label="Mobile navigation"
            >
              {navLinks}
            </nav>
            {/* Footer: auth */}
            <div className="shrink-0 border-t border-border px-6 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <AuthControls variant="corporate" onMenuClose={mobileMenu.close} />
              </div>
            </div>
          </div>
        </div>
      </div>,
          document.body,
        )}
    </header>
  );
};
