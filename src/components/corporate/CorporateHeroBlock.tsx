'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { btnBase, btnPrimary } from '../../styles/buttons';

export const CorporateHeroBlock = (): JSX.Element => {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 md:py-24 relative"
      aria-labelledby="hero-headline"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-4xl">
        <h1
          id="hero-headline"
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight"
          style={{ letterSpacing: 'var(--corporate-letter-spacing-tight, -0.025em)' }}
        >
          <span className="block">WEB EXPERIENCES</span>
          <span className="block">CRAFTED</span>
          <span className="block">BY 1R0NF1ST</span>
        </h1>
        <p className="mt-6 text-muted text-center max-w-xl text-lg">
          A collection of tools and web experiences I use, built with Next.js, React, TypeScript,
          and modern web technologies.
        </p>
        <Link
          href="/projects"
          className={`${btnBase} ${btnPrimary} mt-10 px-8 py-4 text-lg min-h-[44px] min-w-[44px] flex items-center justify-center`}
          aria-label="View projects"
        >
          View projects
        </Link>
      </div>
    </section>
  );
};
