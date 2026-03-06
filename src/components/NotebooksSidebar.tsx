import type { JSX } from 'react';
import { useState } from 'react';
import type { Notebook } from '../useNotes';
import { useNotebooks, createNotebook } from '../useNotebooks';
import { useAlert } from '../contexts/AlertContext';
import { Skeleton } from './Skeleton';
import { cardSidebar, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost, btnCompact } from '../styles/buttons';

export interface NotebooksSidebarProps {
  selectedNotebookId?: string;
  onNotebookSelect: (notebookId: string | undefined) => void;
  /** Compact mode for narrow sidebar (Evernote-style) */
  compact?: boolean;
  /** Hide internal header/title (for embedding inside another section) */
  hideTitle?: boolean;
}

export const NotebooksSidebar = ({
  selectedNotebookId,
  onNotebookSelect,
  compact = false,
  hideTitle = false,
}: NotebooksSidebarProps): JSX.Element => {
  const { notebooks, isLoading, error, refetch } = useNotebooks();
  const { showAlert } = useAlert();
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;

    try {
      await createNotebook({ name: newNotebookName.trim() });
      setNewNotebookName('');
      setIsCreating(false);
      await refetch();
    } catch (error) {
      console.error('Failed to create notebook:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to create notebook. Please try again.';
      showAlert(`Failed to create notebook: ${message}`, 'Error');
    }
  };

  const containerClass = compact ? 'py-1' : cardSidebar;
  const titleClass = compact ? 'text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2' : cardTitle;
  const showHeader = !hideTitle;

  if (isLoading) {
    return (
      <div className={containerClass}>
        {showHeader && <h2 className={titleClass}>Notebooks</h2>}
        <div className={compact ? 'space-y-1' : cardBody} aria-busy>
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
        {showHeader && <h2 className={titleClass}>Notebooks</h2>}
        <p className="text-sm text-muted px-2">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div>
        {showHeader && (
          <div className={`flex items-center justify-between ${compact ? 'mb-2 px-2' : 'mb-4'}`}>
            <h2 className={titleClass}>Notebooks</h2>
            {!compact && (
              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className={`${btnBase} ${btnPrimary} ${btnCompact}`}
                aria-label="Add notebook"
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
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNotebook();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewNotebookName('');
                }
              }}
              placeholder="Notebook name..."
              className="w-full px-2 py-1 border border-primary/20 dark:border-border rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateNotebook}
                className={`${btnBase} ${btnPrimary} ${btnCompact}`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewNotebookName('');
                }}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={`space-y-0.5 ${compact ? 'px-1' : ''}`}>
          <button
            type="button"
            onClick={() => onNotebookSelect(undefined)}
            className={`w-full text-left ${compact ? 'px-2 py-1.5 text-sm rounded-xl' : 'px-3 py-2 rounded-xl'} transition-colors ${
              selectedNotebookId === undefined
                ? 'bg-primary/20 dark:bg-primary/10 text-primary-strong dark:text-primary'
                : 'hover:bg-gray-100 dark:hover:bg-surface-soft text-foreground'
            }`}
          >
            All Notes
          </button>
          {notebooks?.map((notebook) => (
            <button
              key={notebook.id}
              type="button"
              onClick={() => onNotebookSelect(notebook.id)}
              className={`w-full text-left ${compact ? 'px-2 py-1.5 text-sm rounded-xl' : 'px-3 py-2 rounded-xl'} transition-colors ${
                selectedNotebookId === notebook.id
                  ? 'bg-primary/20 dark:bg-primary/10 text-primary-strong dark:text-primary'
                  : 'hover:bg-gray-100 dark:hover:bg-surface-soft text-foreground'
              }`}
            >
              {notebook.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
