'use client';

import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { NotesPage } from '../../views/NotesPage';

export const dynamic = 'force-dynamic';

export default function Page(): JSX.Element {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-4 text-sm text-muted">Loading notes...</div>}>
        <NotesPage useChrome={false} />
      </Suspense>
    </ProtectedRoute>
  );
}
