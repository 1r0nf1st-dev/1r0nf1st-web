'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import { BookMarked, Inbox, Plus, Trash2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNotebooks, createNotebook, deleteNotebook } from '../../useNotebooks';
import { SidebarNavItem } from './SidebarNavItem';
import { useAlert } from '../../contexts/AlertContext';

export const NotebooksSidebar = (): JSX.Element => {
  const { notebooks, isLoading, refetch } = useNotebooks();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const activeNotebookId = searchParams.get('notebook') ?? undefined;
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setIsCreating(false);
      setNewName('');
      return;
    }

    try {
      await createNotebook({ name: newName.trim() });
      await refetch();
      setNewName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create notebook:', error);
      showAlert('Failed to create notebook. Please try again.', 'Error');
    }
  };

  const handleDelete = async (notebookId: string) => {
    try {
      await deleteNotebook(notebookId);
      await refetch();
      setConfirmDeleteId(null);
      // If deleted notebook was active, navigate to /notes
      if (activeNotebookId === notebookId) {
        router.push('/notes');
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      showAlert('Failed to delete notebook. Please try again.', 'Error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="h-8 animate-pulse rounded-xl bg-primary/10" />
        <div className="h-8 animate-pulse rounded-xl bg-primary/10" />
        <div className="h-8 animate-pulse rounded-xl bg-primary/10" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SidebarNavItem
        href="/notes"
        label="All Notes"
        icon={Inbox}
        isActive={!activeNotebookId}
        forceShowLabel={true}
      />
      {notebooks && notebooks.length > 0 ? (
        notebooks.map((notebook) => (
          <div key={notebook.id} className="group relative">
            <div className="flex items-center gap-1">
              <SidebarNavItem
                href={`/notes?notebook=${encodeURIComponent(notebook.id)}`}
                label={notebook.name}
                icon={BookMarked}
                isActive={activeNotebookId === notebook.id}
                forceShowLabel={true}
              />
              <button
                type="button"
                aria-label={`Delete notebook ${notebook.name}`}
                onClick={() => setConfirmDeleteId(notebook.id)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 text-muted hover:bg-red-500/10 hover:text-red-500 transition-opacity touch-manipulation"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {confirmDeleteId === notebook.id ? (
              <div aria-live="polite" className="mt-1 flex items-center gap-2 px-2 text-xs">
                <span>Delete?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(notebook.id)}
                  className="rounded-xl bg-red-500/10 px-2 py-1 text-red-600 hover:bg-red-500/20"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-xl px-2 py-1 hover:bg-primary/10"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
        ))
      ) : !isCreating ? (
        <p className="px-2 py-1 text-xs text-muted">No notebooks yet.</p>
      ) : null}
      {isCreating ? (
        <div className="px-2 py-1 space-y-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              } else if (e.key === 'Escape') {
                setIsCreating(false);
                setNewName('');
              }
            }}
            placeholder="Notebook name"
            className="w-full rounded-xl border border-primary/20 bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-xl bg-primary/10 px-2 py-1 text-xs hover:bg-primary/20"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewName('');
              }}
              className="rounded-xl px-2 py-1 text-xs hover:bg-primary/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span>New Notebook</span>
        </button>
      )}
    </div>
  );
};
