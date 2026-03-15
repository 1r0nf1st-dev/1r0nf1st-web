'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { BrandName } from '../BrandName';

export const CorporateFooter = (): JSX.Element => {
  const buildVersion =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BUILD_VERSION
      ? process.env.NEXT_PUBLIC_BUILD_VERSION
      : 'dev';

  return (
    <footer className="border-t border-border bg-surface/50 py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <p className="text-foreground font-semibold text-lg">
            <BrandName />
          </p>
          <p className="text-muted text-sm mt-1">
            Web experiences crafted with Next.js, React, TypeScript
          </p>
          <p className="text-muted text-sm mt-2">
          </p>
        </div>
        <nav
          className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-center"
          aria-label="Footer navigation"
        >
          <Link
            href="/about"
            className="text-sm text-muted hover:text-foreground transition-colors no-underline min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            01 ABOUT
          </Link>
          <Link
            href="/projects"
            className="text-sm text-muted hover:text-foreground transition-colors no-underline min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            02 PROJECT
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted hover:text-foreground transition-colors no-underline min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            03 CONTACT
          </Link>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border text-center text-muted text-sm">
        <p>
          Version: <span className="font-mono font-semibold opacity-90">{buildVersion}</span>
        </p>
        <p className="mt-1">© {new Date().getFullYear()} <BrandName />. All rights reserved.</p>
      </div>
    </footer>
  );
};
