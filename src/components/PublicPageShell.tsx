'use client';

import type { JSX, ReactNode } from 'react';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { Ticker } from './Ticker';
import { PageHero, type PageHeroProps } from './PageHero';

export interface PublicPageShellProps {
  hero: Omit<PageHeroProps, 'variant'>;
  children: ReactNode;
  mode?: 'full' | 'embedded';
}

export const PublicPageShell = ({
  hero,
  children,
  mode = 'full',
}: PublicPageShellProps): JSX.Element => {
  const embedded = mode === 'embedded';

  if (embedded) {
    return (
      <>
        <PageHero {...hero} variant="public" />
        <main className="page-content page-content--public">{children}</main>
        <Ticker />
      </>
    );
  }

  return (
    <div className="h-screen min-w-0 flex flex-col overflow-hidden bg-[color:var(--color-ink)] pt-14">
      <Nav />
      <PageHero {...hero} variant="public" />
      <main className="page-content page-content--public">{children}</main>
      <Ticker />
      <Footer />
    </div>
  );
};
