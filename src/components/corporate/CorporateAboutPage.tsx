'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { CorporateNav } from './CorporateNav';
import { CorporateFooter } from './CorporateFooter';
import { btnBase, btnGhost } from '../../styles/buttons';

export const CorporateAboutPage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col">
      <CorporateNav />
      <main className="flex-1 px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight"
            style={{ letterSpacing: 'var(--corporate-letter-spacing-tight, -0.025em)' }}
          >
            ABOUT
          </h1>
          <p className="text-muted mb-8">
            Welcome to my personal portfolio. Here you&apos;ll find my latest coding projects, blog
            posts, and activity. Everything is powered by live data from various APIs.
          </p>
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-lg font-semibold mb-2">Tech Stack</h2>
              <p className="text-muted text-sm leading-relaxed">
                Next.js, React, TypeScript, Express, Tailwind CSS, and Supabase. Notes with TipTap,
                auth, and contact via Brevo. Deployed on Vercel. Integrates with GitHub, Medium,
                Dev.to, Spotify, Strava, OpenWeather, and more.
              </p>
            </section>
          </div>
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} mt-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center`}
          >
            View projects
          </Link>
        </div>
      </main>
      <CorporateFooter />
    </div>
  );
};
