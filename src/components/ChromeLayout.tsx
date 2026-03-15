'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { CorporateNav } from './corporate/CorporateNav';
import { CorporateFooter } from './corporate/CorporateFooter';

interface ChromeLayoutProps {
  children: ReactNode;
}

/**
 * Renders app chrome (nav + footer) around page content.
 * Single layout – design tokens live in globals.css.
 */
export const ChromeLayout = ({ children }: ChromeLayoutProps): JSX.Element => (
  <div className="min-h-screen flex flex-col">
    <CorporateNav />
    <main id="main-content" className="flex-1 px-4 sm:px-6 py-6 md:py-8" tabIndex={-1}>
      {children}
    </main>
    <CorporateFooter />
  </div>
);
