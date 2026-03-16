'use client';

import type { JSX } from 'react';
import { Suspense } from 'react';
import { ExplorePage } from '../../../views/ExplorePage';

export const dynamic = 'force-dynamic';

export default function ExploreRoutePage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <ExplorePage />
    </Suspense>
  );
}
