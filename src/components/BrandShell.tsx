'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { Ticker } from './Ticker';

export interface BrandShellProps {
  children: ReactNode;
  showTicker?: boolean;
  mainClassName?: string;
}

export const BrandShell = ({
  children,
  showTicker = false,
  mainClassName = '',
}: BrandShellProps): JSX.Element => {
  return (
    <div className="min-h-screen min-w-0 flex flex-col overflow-x-hidden pt-14">
      <Nav />
      {showTicker ? <Ticker /> : null}
      <main className={mainClassName}>{children}</main>
      <Footer />
    </div>
  );
};
