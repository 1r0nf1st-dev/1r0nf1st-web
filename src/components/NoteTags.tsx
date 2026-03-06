'use client';

import type { JSX } from 'react';
import type { Tag } from '../useNotes';

export interface NoteTagsProps {
  tags: Tag[];
  maxVisible?: number;
}

export const NoteTags = ({ tags, maxVisible = 3 }: NoteTagsProps): JSX.Element | null => {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visible = tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className="text-xs px-2 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary-strong dark:text-primary font-medium"
        >
          {tag.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted">+{remaining}</span>
      )}
    </div>
  );
};
