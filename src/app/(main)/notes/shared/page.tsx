'use client';

import type { JSX } from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { SharedNotesList } from '../../../../components/SharedNotesList';
import type { Note } from '../../../../useNotes';

function SharedNotesContent(): JSX.Element {
  const router = useRouter();

  const handleNoteSelect = (note: Note | null): void => {
    if (note) {
      // Navigate to the main notes page with the note ID as a query parameter
      router.push(`/notes?id=${encodeURIComponent(note.id)}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <SharedNotesList onNoteSelect={handleNoteSelect} />
    </div>
  );
}

export default function SharedNotesPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading shared notes...</div>}>
      <ProtectedRoute>
        <SharedNotesContent />
      </ProtectedRoute>
    </Suspense>
  );
}
