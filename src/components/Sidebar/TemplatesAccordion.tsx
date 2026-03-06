'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useNoteTemplates, createNoteTemplate, deleteNoteTemplate } from '../../useNoteTemplates';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { Skeleton } from '../Skeleton';
import { useAlert } from '../../contexts/AlertContext';

export const TemplatesAccordion = (): JSX.Element => {
  const { templates, isLoading, error, refetch } = useNoteTemplates();
  const { createNoteFromTemplate } = useNotesActions();
  const { showAlert } = useAlert();
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
      await createNoteTemplate({
        name: newName.trim(),
        content: {}, // Empty content initially, user can edit later
      });
      await refetch();
      setNewName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create template:', error);
      showAlert('Failed to create template. Please try again.', 'Error');
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteNoteTemplate(templateId);
      await refetch();
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
      showAlert('Failed to delete template. Please try again.', 'Error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1 px-2 py-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 py-1 text-xs text-muted">
        <p>Failed to load templates</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {templates && templates.length > 0 ? (
        templates.map((template) => (
          <div key={template.id} className="group relative">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => createNoteFromTemplate(template)}
                className="flex flex-1 items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
                aria-label={`Create note from template: ${template.name}`}
              >
                <span className="truncate">{template.name}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete template ${template.name}`}
                onClick={() => setConfirmDeleteId(template.id)}
                className="opacity-0 group-hover:opacity-100 rounded-xl p-1 text-muted hover:bg-red-500/10 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {confirmDeleteId === template.id ? (
              <div aria-live="polite" className="mt-1 flex items-center gap-2 px-2 text-xs">
                <span>Delete?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(template.id)}
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
        <p className="px-2 py-1 text-xs text-muted">No templates yet.</p>
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
            placeholder="Template name"
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
          <span>New Template</span>
        </button>
      )}
    </div>
  );
};
