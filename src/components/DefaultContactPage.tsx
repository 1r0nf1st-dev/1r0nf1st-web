'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { Hero } from './Hero';
import { Footer } from './Footer';
import { ContactUsCard } from './ContactUsCard';
import { btnBase, btnGhost } from '../styles/buttons';

export const DefaultContactPage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>
      <main className="flex-1 flex justify-center pt-7">
        <section className="w-full max-w-[1080px] space-y-4">
          <ContactUsCard />
          <Link href="/projects" className={`${btnBase} ${btnGhost} inline-flex`}>
            View projects
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};
