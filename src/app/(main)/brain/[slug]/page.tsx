'use client';

import type { JSX } from 'react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { PublicBrainPage } from '../../../../views/PublicBrainPage';

export const dynamic = 'force-dynamic';

function PublicBrainRouteContent(): JSX.Element {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  if (!slug) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <p className="text-muted">Invalid brain URL.</p>
      </div>
    );
  }

  return <PublicBrainPage slug={slug} />;
}

export default function PublicBrainRoutePage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <ProtectedRoute>
        <PublicBrainRouteContent />
      </ProtectedRoute>
    </Suspense>
  );
}
