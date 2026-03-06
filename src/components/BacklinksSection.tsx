'use client';

import type { JSX } from 'react';
import type { Note } from '../useNotes';
import { useBacklinks } from '../useBacklinks';
import { btnBase, btnGhost, btnCompact } from '../styles/buttons';

export interface BacklinksSectionProps {
  noteId: string | null;
  onNoteClick: (note: Note) => void;
}

export function BacklinksSection({
  noteId,
  onNoteClick,
}: BacklinksSectionProps): JSX.Element | null {
  const { backlinks, isLoading, error } = useBacklinks(noteId);

  if (!noteId) return null;
  if (isLoading || error) return null;
  if (backlinks.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl border border-primary/20 dark:border-border bg-gray-50/50 dark:bg-surface-soft/50">
      <h3 className="text-sm font-medium text-foreground mb-2">Linked from</h3>
      <p className="text-xs text-muted mb-2">
        Notes that link to this note
      </p>
      <ul className="flex flex-wrap gap-2">
        {backlinks.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onNoteClick(n)}
              className={`${btnBase} ${btnGhost} ${btnCompact} text-sm`}
            >
              {n.title || 'Untitled'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
