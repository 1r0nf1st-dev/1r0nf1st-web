'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Hero } from './Hero';
import { Footer } from './Footer';
import { CorporateNav } from './corporate/CorporateNav';
import { CorporateFooter } from './corporate/CorporateFooter';

interface ChromeLayoutProps {
  children: ReactNode;
}

/**
 * Renders theme-aware chrome (nav + footer) around page content.
 * - Default theme: Hero + children + Footer
 * - Corporate theme: CorporateNav + children + CorporateFooter
 */
export const ChromeLayout = ({ children }: ChromeLayoutProps): JSX.Element => {
  const { styleTheme } = useTheme();

  if (styleTheme === 'corporate') {
    return (
      <div className="min-h-screen flex flex-col">
        <CorporateNav />
        <main id="main-content" className="flex-1 px-4 sm:px-6 py-6 md:py-8" tabIndex={-1}>
          {children}
        </main>
        <CorporateFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>
      <main id="main-content" className="flex-1 flex items-stretch justify-center pt-7" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
