import type { JSX } from 'react';
import { useState } from 'react';
import type { Notebook } from '../useNotes';
import { useNotebooks, createNotebook } from '../useNotebooks';
import { Skeleton } from './Skeleton';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';

export interface NotebooksSidebarProps {
  selectedNotebookId?: string;
  onNotebookSelect: (notebookId: string | undefined) => void;
}

export const NotebooksSidebar = ({
  selectedNotebookId,
  onNotebookSelect,
}: NotebooksSidebarProps): JSX.Element => {
  const { notebooks, isLoading, error, refetch } = useNotebooks();
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
        error instanceof Error
          ? error.message
          : 'Failed to create notebook. Please try again.';
      alert(`Failed to create notebook: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <article className={cardClasses}>
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Notebooks</h2>
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
        <h2 className={cardTitle}>Notebooks</h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cardTitle}>Notebooks</h2>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className={`${btnBase} ${btnPrimary} text-sm py-1 px-3`}
            aria-label="Create notebook"
          >
            +
          </button>
        </div>

        {isCreating && (
          <div className="mb-4 p-3 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface">
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
              className="w-full px-2 py-1 border border-primary/20 dark:border-border rounded text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateNotebook}
                className={`${btnBase} ${btnPrimary} text-sm py-1 px-3`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewNotebookName('');
                }}
                className={`${btnBase} text-sm py-1 px-3`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNotebookSelect(undefined)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
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
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
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
    </article>
  );
};
