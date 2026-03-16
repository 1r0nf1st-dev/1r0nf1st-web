'use client';

import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { BrainPage } from '../../../views/BrainPage';

export const dynamic = 'force-dynamic';

export default function BrainRoutePage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <ProtectedRoute>
        <BrainPage />
      </ProtectedRoute>
    </Suspense>
  );
}
