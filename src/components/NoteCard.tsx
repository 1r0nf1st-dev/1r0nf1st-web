'use client';

import type { JSX } from 'react';
import { memo } from 'react';
import { Pin } from 'lucide-react';
import type { Note } from '../useNotes';
import { cardClasses } from '../styles/cards';
import { formatNoteDate } from '../utils/formatNoteDate';
import { NoteTags } from './NoteTags';

export interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: (note: Note) => void;
}

const PREVIEW_LENGTH_CARD = 150;

export const NoteCard = memo(({ note, isSelected, onClick }: NoteCardProps): JSX.Element => {
  const preview = note.content_text
    ? note.content_text.substring(0, PREVIEW_LENGTH_CARD) + (note.content_text.length > PREVIEW_LENGTH_CARD ? '...' : '')
    : 'No content';

  return (
    <article
      className={`
        group relative ${cardClasses.replace('p-6', 'p-4 md:p-5 lg:p-6')} min-w-0 cursor-pointer
        hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl
        active:scale-[0.98] motion-reduce:active:scale-100
        focus:ring-2 focus:ring-blue-600/50 focus:ring-offset-2 focus:outline-none
        min-h-[160px] md:min-h-[180px] lg:min-h-[200px]
        ${isSelected ? 'ring-2 ring-blue-600/50 ring-offset-2 bg-blue-50/30 dark:bg-blue-900/20' : ''}
      `}
      onClick={() => onClick(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(note);
        }
      }}
      aria-label={`Note: ${note.title || 'Untitled'}`}
      aria-selected={isSelected}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 flex-1 pr-2">
            {note.title || 'Untitled'}
          </h3>
          {note.is_pinned && (
            <Pin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-label="Pinned note" />
          )}
        </div>

        {/* Preview */}
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3 flex-1">
          {preview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <NoteTags tags={note.tags || []} maxVisible={3} />
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {formatNoteDate(note.updated_at)}
          </span>
        </div>
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

NoteCard.displayName = 'NoteCard';
