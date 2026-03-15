'use client';

import type { JSX } from 'react';
import { PacManGame } from '../components/pacman/PacManGame';
export const PacManPage = (): JSX.Element => {
  return (
    <section aria-label="Pac-Man game section">
        <PacManGame />
    </section>
  );
};
