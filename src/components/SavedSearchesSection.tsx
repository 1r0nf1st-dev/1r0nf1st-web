'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { Search, Bookmark, Trash2 } from 'lucide-react';
import {
  useSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  type SavedSearch,
} from '../useSavedSearches';
import { useAlert } from '../contexts/AlertContext';
import { buildSearchQuery } from '../utils/savedSearchQuery';
import { btnBase, btnGhost, btnCompact } from '../styles/buttons';

export interface SavedSearchesSectionProps {
  /** Current search text */
  searchQuery: string;
  /** Selected notebook ID */
  selectedNotebookId?: string;
  /** Selected tag ID */
  selectedTagId?: string;
  /** Whether showing archived notes */
  showArchived: boolean;
  /** Whether showing shared notes (saved searches hidden in this view) */
  showShared: boolean;
  /** Notebooks for building query (names) */
  notebooks?: Array<{ id: string; name: string }>;
  /** Tags for building query (names) */
  tags?: Array<{ id: string; name: string }>;
  /** Called when user selects a saved search - apply its query */
  onApplySearch: (query: string) => void;
  /** Compact mode for narrow sidebar */
  compact?: boolean;
}

export const SavedSearchesSection = ({
  searchQuery,
  selectedNotebookId,
  selectedTagId,
  showArchived,
  showShared,
  notebooks = [],
  tags = [],
  onApplySearch,
  compact = false,
}: SavedSearchesSectionProps): JSX.Element | null => {
  const { savedSearches, isLoading, error, refetch } = useSavedSearches();
  const { showAlert } = useAlert();
  const [isSaving, setIsSaving] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (showShared) return null;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedNotebookId !== undefined ||
    selectedTagId !== undefined ||
    showArchived;

  const handleSaveSearch = async () => {
    if (!newSearchName.trim()) return;
    const query = buildSearchQuery({
      searchText: searchQuery,
      notebookId: selectedNotebookId,
      tagId: selectedTagId,
      showArchived,
      notebooks,
      tags,
    });
    if (!query.trim()) return;

    try {
      await createSavedSearch({ name: newSearchName.trim(), query });
      setNewSearchName('');
      setIsSaving(false);
      await refetch();
    } catch (err) {
      console.error('Failed to save search:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to save search. Try again.';
      showAlert(`Save search failed: ${msg}`, 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteSavedSearch(id);
      await refetch();
    } catch (err) {
      console.error('Failed to delete saved search:', err);
      showAlert('Failed to delete saved search.', 'Error');
    } finally {
      setDeletingId(null);
    }
  };

  const containerClass = compact ? 'py-1' : '';
  const titleClass = compact
    ? 'text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2'
    : 'text-sm font-semibold text-foreground mb-2';

  if (isLoading) {
    return (
      <div className={containerClass}>
        <h2 className={titleClass}>Saved searches</h2>
        <p className="text-xs text-muted px-2">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <h2 className={titleClass}>Saved searches</h2>
        <p className="text-xs text-muted px-2">{error}</p>
      </div>
    );
  }

  const list = savedSearches ?? [];
  const hasSearches = list.length > 0;

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={titleClass}>Saved searches</h2>
        {hasActiveFilters && !isSaving && (
          <button
            type="button"
            onClick={() => setIsSaving(true)}
            className={`${btnBase} ${btnGhost} ${compact ? 'p-1 text-xs' : 'px-2 py-1 text-sm'}`}
            aria-label="Save current search"
            title="Save current search"
          >
            <Bookmark className="w-3.5 h-3.5 text-primary" aria-hidden />
          </button>
        )}
      </div>

      {isSaving && (
        <div className="mb-3 p-2 border border-primary/30 dark:border-border rounded-xl bg-white dark:bg-surface">
          <input
            type="text"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveSearch();
              if (e.key === 'Escape') {
                setIsSaving(false);
                setNewSearchName('');
              }
            }}
            placeholder="Search name..."
            className="w-full px-2 py-1 text-sm border border-primary/20 dark:border-border rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveSearch}
              className={`${btnBase} ${btnCompact} bg-primary text-white hover:opacity-90`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSaving(false);
                setNewSearchName('');
              }}
              className={`${btnBase} ${btnGhost} ${btnCompact}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {hasSearches ? (
        <ul className={`space-y-0.5 ${compact ? 'px-1' : ''}`} role="list">
          {list.map((s) => (
            <SavedSearchItem
              key={s.id}
              savedSearch={s}
              compact={compact}
              onSelect={() => onApplySearch(s.query)}
              onDelete={() => handleDelete(s.id)}
              isDeleting={deletingId === s.id}
            />
          ))}
        </ul>
      ) : (
        !isSaving && (
          <p className="text-xs text-muted px-2">
            Save a search to quick-access it later.
          </p>
        )
      )}
    </div>
  );
};

function SavedSearchItem({
  savedSearch,
  compact,
  onSelect,
  onDelete,
  isDeleting,
}: {
  savedSearch: SavedSearch;
  compact: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}): JSX.Element {
  return (
    <li className="group flex items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 text-left truncate flex items-center gap-2 min-w-0 ${
          compact ? 'px-2 py-1.5 text-sm rounded-xl' : 'px-3 py-2 rounded-xl'
        } transition-colors hover:bg-primary/5 dark:hover:bg-primary/5 text-foreground`}
        title={savedSearch.query}
      >
        <Search className="w-3 h-3 shrink-0 text-muted" aria-hidden />
        <span className="truncate">{savedSearch.name}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isDeleting}
        className={`p-1.5 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors ${
          isDeleting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label={`Delete saved search "${savedSearch.name}"`}
      >
        <Trash2 className="w-3 h-3" aria-hidden />
      </button>
    </li>
  );
}
