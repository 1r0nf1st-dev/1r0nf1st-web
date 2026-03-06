'use client';

import type { JSX } from 'react';
import { memo } from 'react';
import { Pin, FileText } from 'lucide-react';
import type { Note } from '../useNotes';
import { formatNoteDate } from '../utils/formatNoteDate';
import { NoteTags } from './NoteTags';

export interface NotesListItemProps {
  note: Note;
  isSelected: boolean;
  onClick: (note: Note) => void;
}

const PREVIEW_LENGTH_LIST = 140;

export const NotesListItem = memo(({ note, isSelected, onClick }: NotesListItemProps): JSX.Element => {
  const preview = note.content_text
    ? note.content_text.substring(0, PREVIEW_LENGTH_LIST) + (note.content_text.length > PREVIEW_LENGTH_LIST ? '...' : '')
    : '';

  return (
    <button
      type="button"
      onClick={() => onClick(note)}
      className={`w-full text-left px-4 py-3 hover:bg-surface-soft dark:hover:bg-surface transition-colors border-b border-border/50 flex items-start gap-3 ${
        isSelected ? 'bg-primary/10 dark:bg-primary/5 ring-inset ring-1 ring-primary/40' : ''
      }`}
      aria-label={`Note: ${note.title || 'Untitled'}`}
      aria-selected={isSelected}
    >
      <div className="w-5 h-5 shrink-0 mt-0.5">
        {note.is_pinned ? (
          <Pin className="w-5 h-5 text-primary" aria-label="Pinned note" />
        ) : (
          <FileText className="w-5 h-5 text-muted" aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-foreground line-clamp-2 mb-1">
          {note.title || 'Untitled'}
        </div>
        {preview && (
          <div className="text-sm text-muted line-clamp-2 mb-2">{preview}</div>
        )}
        <div className="text-xs text-muted flex items-center gap-2">
          <span>{formatNoteDate(note.updated_at)}</span>
          {note.tags && note.tags.length > 0 && (
            <>
              <span aria-hidden>•</span>
              <NoteTags tags={note.tags} maxVisible={2} />
            </>
          )}
        </div>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

NotesListItem.displayName = 'NotesListItem';
