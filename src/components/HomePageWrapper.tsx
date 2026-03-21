'use client';

import type { JSX } from 'react';
import { Nav } from './Nav';
import { Hero } from './Hero';
import { Ticker } from './Ticker';
import { WorkSection } from './WorkSection';
import { Pillars } from './Pillars';
import { Footer } from './Footer';

export const HomePageWrapper = (): JSX.Element => (
  <div className="min-w-0 w-full overflow-x-hidden bg-[color:var(--color-ink)] pt-[52px] md:pt-14">
    <Nav />
    <Hero />
    <Ticker />
    <WorkSection />
    <Pillars />
    <Footer />
  </div>
);
