'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { PacManGame } from '../components/pacman/PacManGame';
import { ChromeLayout } from '../components/ChromeLayout';
import { btnBase, btnGhost } from '../styles/buttons';

export const PacManPage = (): JSX.Element => {
  return (
    <ChromeLayout>
      <section
        className="w-full max-w-[1080px] mx-auto"
        aria-label="Pac-Man game section"
      >
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
        </div>
        <PacManGame />
      </section>
    </ChromeLayout>
  );
};
