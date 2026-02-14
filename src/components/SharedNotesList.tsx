import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { getSharedNotes } from '../useNoteSharing';
import type { Note } from '../useNotes';
import { NotesList } from './NotesList';

export interface SharedNotesListProps {
  onNoteSelect: (note: Note | null) => void;
}

export const SharedNotesList = ({ onNoteSelect }: SharedNotesListProps): JSX.Element => {
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedNotes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const notes = await getSharedNotes();
        setSharedNotes(notes as Note[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedNotes();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted">
        <p>Loading shared notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (sharedNotes.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <p>No shared notes yet.</p>
        <p className="text-sm mt-2">Notes shared with you will appear here.</p>
      </div>
    );
  }

  return (
    <NotesList
      notes={sharedNotes}
      onNoteClick={onNoteSelect}
      selectedNoteId={undefined}
    />
  );
};
