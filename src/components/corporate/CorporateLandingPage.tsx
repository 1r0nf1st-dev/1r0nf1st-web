'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { CorporateNav } from './CorporateNav';
import { CorporateFooter } from './CorporateFooter';
import { CorporateHeroBlock } from './CorporateHeroBlock';
import { CorporateValueProps } from './CorporateValueProps';
import { ScrollReveal } from '../ScrollReveal';
import { btnBase, btnGhost } from '../../styles/buttons';

export const CorporateLandingPage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col">
      <CorporateNav />
      <main className="flex-1 flex flex-col">
        <CorporateHeroBlock />

        <ScrollReveal>
          <section
            className="py-16 md:py-24 px-4 sm:px-6"
            aria-labelledby="projects-teaser-heading"
          >
            <div className="max-w-6xl mx-auto text-center">
              <h2
                id="projects-teaser-heading"
                className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight"
                style={{ letterSpacing: 'var(--corporate-letter-spacing-tight, -0.025em)' }}
              >
                Selected work
              </h2>
              <p className="text-muted max-w-xl mx-auto mb-10">
                A selection of web applications and tools built with modern technologies.
              </p>
              <Link
                href="/projects"
                className={`${btnBase} ${btnGhost} px-8 py-4 text-lg min-h-[44px] flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background`}
                aria-label="Explore more work"
              >
                Explore more work
              </Link>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <CorporateValueProps />
        </ScrollReveal>
      </main>
      <CorporateFooter />
    </div>
  );
};
