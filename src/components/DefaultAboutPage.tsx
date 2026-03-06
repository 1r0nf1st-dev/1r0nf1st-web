'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { Hero } from './Hero';
import { Footer } from './Footer';
import { InfoCard } from './InfoCard';
import { btnBase, btnGhost } from '../styles/buttons';

export const DefaultAboutPage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>
      <main className="flex-1 flex justify-center pt-7">
        <section className="w-full max-w-[1080px] space-y-4">
          <InfoCard title="About">
            Welcome to my personal portfolio. Here you&apos;ll find my latest coding projects, blog
            posts, music I&apos;m listening to, fitness activities, and more. Everything is powered
            by live data from various APIs.
          </InfoCard>
          <InfoCard title="Tech Stack">
            Next.js, React, TypeScript, Express, Tailwind CSS, and Supabase. Notes with TipTap,
            auth, and contact via Brevo. Deployed on Vercel. Integrates with GitHub, Medium, Dev.to,
            Spotify, Strava, OpenWeather, and more.
          </InfoCard>
          <Link href="/projects" className={`${btnBase} ${btnGhost} inline-flex`}>
            View projects
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};
