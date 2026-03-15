'use client';

import type { JSX } from 'react';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useMobileMenu } from '../hooks/useMobileMenu';
import { ThemeToggle } from './Navigation/ThemeToggle';
import { AuthControls } from './Navigation/AuthControls';
import { BrandName } from './BrandName';

/**
 * Unified mobile menu for notes pages.
 * Provides main navigation links (About, Projects, Contact) and auth controls.
 * Notes navigation is handled by the permanently visible sidebar on mobile.
 */
export const UnifiedMobileMenu = (): JSX.Element => {
  const pathname = usePathname();
  const mobileMenu = useMobileMenu();
  const isAppShellPage =
    (pathname?.startsWith('/notes') || pathname?.startsWith('/projects')) ?? false;
  const [shouldRender, setShouldRender] = useState(false);

  // Keep menu mounted during close animation
  useEffect(() => {
    if (mobileMenu.isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      // Delay unmounting to allow slide-out animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration (300ms)
      return () => clearTimeout(timer);
    }
  }, [mobileMenu.isOpen, shouldRender]);

  if (!isAppShellPage) {
    return <></>;
  }

  const mainNavLinks = (
    <>
      <Link
        href="/about"
        className="block px-4 py-3 text-lg border-b border-border hover:bg-surface-soft transition-colors"
        onClick={mobileMenu.close}
      >
        01 ABOUT
      </Link>
      <Link
        href="/projects"
        className="block px-4 py-3 text-lg border-b border-border hover:bg-surface-soft transition-colors"
        onClick={mobileMenu.close}
      >
        02 PROJECT
      </Link>
      <Link
        href="/contact"
        className="block px-4 py-3 text-lg border-b border-border hover:bg-surface-soft transition-colors"
        onClick={mobileMenu.close}
      >
        03 CONTACT
      </Link>
    </>
  );

  return (
    <>
      {/* Menu trigger button */}
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

      {/* Unified menu overlay */}
      {typeof document !== 'undefined' &&
        shouldRender &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`lg:hidden fixed inset-0 z-[2147483646] bg-black/50 transition-opacity duration-300 ${
                mobileMenu.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={mobileMenu.close}
              aria-hidden="true"
            />
            {/* Menu panel */}
            <div
              className={`lg:hidden fixed inset-0 z-[2147483647] transition-transform duration-300 ease-out ${
                mobileMenu.isOpen ? 'translate-x-0' : 'translate-x-full'
              } ${mobileMenu.isOpen ? '' : 'pointer-events-none'}`}
              style={{
                isolation: 'isolate',
              }}
            >
              <div
                ref={mobileMenu.menuRef}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile menu"
                className="overflow-y-auto overscroll-contain h-full w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md"
              >
                <div className="min-h-screen min-h-dvh flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-center px-6 py-6 border-b border-border shrink-0">
                    <Link
                      href="/"
                      onClick={mobileMenu.close}
                      className="flex items-center gap-2 no-underline text-inherit"
                      aria-label="1r0nf1st"
                    >
                      <BrandName className="font-semibold text-foreground text-lg tracking-tight" />
                    </Link>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <button
                        type="button"
                        onClick={mobileMenu.close}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                        aria-label="Close menu"
                      >
                        <X className="w-6 h-6" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* Main Navigation Section */}
                  <div className="flex-1 px-6 py-4 overflow-y-auto">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Navigation</h2>
                    <nav aria-label="Main navigation">{mainNavLinks}</nav>
                  </div>

                  {/* Footer: Auth */}
                  <div className="shrink-0 border-t border-border px-6 py-6">
                    <AuthControls onMenuClose={mobileMenu.close} />
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};
