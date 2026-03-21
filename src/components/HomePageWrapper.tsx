'use client';

import type { JSX } from 'react';
import { Nav } from './Nav';
import { Hero } from './Hero';
import { Ticker } from './Ticker';
import { WorkSection } from './WorkSection';
import { Pillars } from './Pillars';
import { Footer } from './Footer';

export const HomePageWrapper = (): JSX.Element => (
  <div className="pt-14">
    <Nav />
    <Hero />
    <Ticker />
    <WorkSection />
    <Pillars />
    <Footer />
  </div>
);
