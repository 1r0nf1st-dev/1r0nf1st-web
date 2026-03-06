import type { JSX } from 'react';
import type { Note } from '../useNotes';
import { NoteCard } from './NoteCard';
import { NotesListItem } from './NotesListItem';

export interface NotesListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  selectedNoteId?: string;
  /** Contextual empty message when no notes. Defaults to first-time message. */
  emptyMessage?: string;
  /** Layout: cards (grid) for mobile/overview, list (rows) for 3-pane sidebar view */
  layout?: 'cards' | 'list';
}

export const NotesList = ({
  notes,
  onNoteClick,
  selectedNoteId,
  emptyMessage = 'No notes yet. Create your first note to get started!',
  layout = 'cards',
}: NotesListProps): JSX.Element => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="flex flex-col">
        {notes.map((note) => (
          <NotesListItem
            key={note.id}
            note={note}
            isSelected={note.id === selectedNoteId}
            onClick={onNoteClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 min-w-0">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
};
