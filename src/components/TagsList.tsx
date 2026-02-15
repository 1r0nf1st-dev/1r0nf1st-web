import type { JSX } from 'react';
import { useState } from 'react';
import type { Tag } from '../useNotes';
import { useTags, createTag } from '../useTags';
import { Skeleton } from './Skeleton';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';

export interface TagsListProps {
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
}

export const TagsList = ({ selectedTagIds, onTagToggle }: TagsListProps): JSX.Element => {
  const { tags, isLoading, error, refetch } = useTags();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await createTag({ name: newTagName.trim() });
      setNewTagName('');
      setIsCreating(false);
      await refetch();
    } catch (error) {
      console.error('Failed to create tag:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create tag. It may already exist.';
      alert(`Failed to create tag: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <article className={cardClasses}>
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Tags</h2>
        <div className={cardBody} aria-busy>
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses}>
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Tags</h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cardTitle}>Tags</h2>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className={`${btnBase} ${btnPrimary} text-sm py-1 px-3`}
            aria-label="Create tag"
          >
            +
          </button>
        </div>

        {isCreating && (
          <div className="mb-4 p-3 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewTagName('');
                }
              }}
              placeholder="Tag name..."
              className="w-full px-2 py-1 border border-primary/20 dark:border-border rounded text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTag}
                className={`${btnBase} ${btnPrimary} text-sm py-1 px-3`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName('');
                }}
                className={`${btnBase} text-sm py-1 px-3`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 dark:bg-primary/20 text-primary-strong dark:text-primary hover:bg-primary/20'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};
