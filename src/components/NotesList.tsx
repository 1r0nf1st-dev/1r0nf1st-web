import type { JSX } from 'react';
import type { Note } from '../useNotes';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

export interface NotesListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  selectedNoteId?: string;
}

export const NotesList = ({ notes, onNoteClick, selectedNoteId }: NotesListProps): JSX.Element => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p>No notes found. Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        const isSelected = note.id === selectedNoteId;
        const preview = note.content_text
          ? note.content_text.substring(0, 150) + (note.content_text.length > 150 ? '...' : '')
          : 'No content';

        return (
          <article
            key={note.id}
            className={`${cardClasses} cursor-pointer transition-transform hover:scale-[1.02] ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onNoteClick(note)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNoteClick(note);
              }
            }}
            aria-label={`Note: ${note.title || 'Untitled'}`}
          >
            <div className={cardOverlay} aria-hidden />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`${cardTitle} text-lg mb-1 flex-1 truncate`}>
                  {note.is_pinned && <span className="mr-2">📌</span>}
                  {note.title || 'Untitled'}
                </h3>
              </div>
              <p className={`${cardBody} flex-1 mb-2 line-clamp-3`}>{preview}</p>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-primary/20 dark:border-border">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary-strong dark:text-primary"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-muted">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}
                <span className="text-xs text-muted ml-auto">
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
