import type { JSX } from 'react';
import { useState } from 'react';
import type { Tag } from '../useNotes';
import { useTags, createTag } from '../useTags';
import { useAlert } from '../contexts/AlertContext';
import { Skeleton } from './Skeleton';
import { cardSidebar, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost, btnCompact } from '../styles/buttons';

export interface TagsListProps {
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  /** Compact mode for narrow sidebar or drawer */
  compact?: boolean;
  /** Hide internal header/title (for embedding inside another section) */
  hideTitle?: boolean;
}

export const TagsList = ({
  selectedTagIds,
  onTagToggle,
  compact = false,
  hideTitle = false,
}: TagsListProps): JSX.Element => {
  const { tags, isLoading, error, refetch } = useTags();
  const { showAlert } = useAlert();
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
        error instanceof Error ? error.message : 'Failed to create tag. It may already exist.';
      showAlert(`Failed to create tag: ${message}`, 'Error');
    }
  };

  const containerClass = compact ? 'py-1' : cardSidebar;
  const titleClass = compact
    ? 'text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2'
    : cardTitle;
  const showHeader = !hideTitle;

  if (isLoading) {
    return (
      <div className={containerClass}>
        {showHeader && <h2 className={titleClass}>Tags</h2>}
        <div className={cardBody} aria-busy>
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        {showHeader && <h2 className={titleClass}>Tags</h2>}
        <p className="text-sm text-muted px-2">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div>
        {showHeader && (
          <div className={`flex items-center justify-between ${compact ? 'mb-2 px-2' : 'mb-4'}`}>
            <h2 className={titleClass}>Tags</h2>
            {!compact && (
              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className={`${btnBase} ${btnPrimary} ${btnCompact}`}
                aria-label="Add tag"
              >
                +
              </button>
            )}
          </div>
        )}

        {!compact && isCreating && (
          <div className="mb-4 p-3 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface">
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
              className="w-full px-2 py-1 border border-primary/20 dark:border-border rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTag}
                className={`${btnBase} ${btnPrimary} ${btnCompact}`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName('');
                }}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={`flex flex-wrap gap-1.5 ${compact ? 'px-2' : ''}`}>
          {tags?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.id)}
              className={`rounded-full transition-colors ${
                compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
              } ${
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
    </div>
  );
};
