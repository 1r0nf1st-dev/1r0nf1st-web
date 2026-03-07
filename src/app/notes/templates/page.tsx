'use client';

import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { NotesPage } from '../../../views/NotesPage';

export const dynamic = 'force-dynamic';

/**
 * Templates page - shows notes page where templates can be accessed.
 * Uses notes layout so sidebar stays visible on mobile.
 */
export default function NotesTemplatesPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading templates...</div>}>
      <ProtectedRoute>
        <NotesPage useChrome={false} />
      </ProtectedRoute>
    </Suspense>
  );
}
