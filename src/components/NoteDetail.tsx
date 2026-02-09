import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import type { Note, Tag } from '../useNotes';
import { NoteEditor } from './NoteEditor';
import { updateNote, deleteNote, getNoteById } from '../useNotes';
import { SaveConfirmationModal } from './SaveConfirmationModal';
import { FileUpload } from './FileUpload';
import { AttachmentsList } from './AttachmentsList';
import { cardClasses, cardOverlay, cardTitle } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface NoteDetailProps {
  note: Note | null;
  tags: Tag[];
  notebooks: Array<{ id: string; name: string }>;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const NoteDetail = ({
  note,
  tags,
  notebooks,
  onSave,
  onDelete,
  onClose,
}: NoteDetailProps): JSX.Element => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [attachments, setAttachments] = useState<Note['attachments']>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      // Normalize content: ensure it's a valid TipTap document structure
      if (note.content && typeof note.content === 'object' && Object.keys(note.content).length > 0) {
        // If content has proper TipTap structure, use it; otherwise use empty doc
        if (note.content.type === 'doc' && Array.isArray(note.content.content)) {
          setContent(note.content);
        } else {
          setContent({ type: 'doc', content: [] });
        }
      } else {
        setContent({ type: 'doc', content: [] });
      }
      setNotebookId(note.notebook_id);
      setSelectedTagIds(note.tags?.map((t) => t.id) || []);
      setIsPinned(note.is_pinned);
      setIsArchived(note.is_archived);
      setAttachments(note.attachments || []);
    } else {
      // Reset for new note - use proper TipTap empty document structure
      setTitle('');
      setContent({ type: 'doc', content: [] });
      setNotebookId(null);
      setSelectedTagIds([]);
      setIsPinned(false);
      setIsArchived(false);
      setAttachments([]);
    }
  }, [note]);

  const handleAttachmentUploadComplete = async () => {
    if (!note) return;
    try {
      // Refresh note to get updated attachments
      const updated = await getNoteById(note.id);
      if (updated) {
        setAttachments(updated.attachments || []);
      }
    } catch (error) {
      console.error('Failed to refresh attachments:', error);
    }
  };

  const handleAttachmentDelete = async () => {
    if (!note) return;
    try {
      // Refresh note to get updated attachments
      const updated = await getNoteById(note.id);
      if (updated) {
        setAttachments(updated.attachments || []);
      }
    } catch (error) {
      console.error('Failed to refresh attachments:', error);
    }
  };

  const handleSave = async () => {
    if (!note) {
      // Create new note
      const { createNote } = await import('../useNotes');
      setIsSaving(true);
      try {
        const newNote = await createNote({
          title: title || 'New Note',
          content,
          notebook_id: notebookId || undefined,
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });
        onSave();
        setShowSaveModal(true);
        // Note: The parent component should handle selecting the new note
      } catch (error) {
        console.error('Failed to create note:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to create note. Please try again.';
        alert(`Failed to create note: ${message}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      await updateNote(note.id, {
        title,
        content,
        notebook_id: notebookId,
        tag_ids: selectedTagIds,
        is_pinned: isPinned,
        is_archived: isArchived,
      });
      onSave();
      setShowSaveModal(true);
    } catch (error) {
      console.error('Failed to save note:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save note. Please try again.';
      alert(`Failed to save note: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(note.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete note:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete note. Please try again.';
      alert(`Failed to delete note: ${message}`);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  if (!note) {
    return (
      <div className="text-center py-12 text-muted">
        <p>Select a note to view or create a new one</p>
      </div>
    );
  }

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cardTitle}>Edit Note</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${btnBase} ${btnGhost} text-sm`}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium mb-1 text-foreground">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Note title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Notebook</label>
            <select
              value={notebookId || ''}
              onChange={(e) => setNotebookId(e.target.value || null)}
              className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No notebook</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
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

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Content</label>
            <NoteEditor content={content} onChange={setContent} />
          </div>

          {note && (
            <>
              <div>
                <FileUpload
                  noteId={note.id}
                  onUploadComplete={handleAttachmentUploadComplete}
                  onError={(error) => {
                    setAttachmentError(error);
                    setTimeout(() => setAttachmentError(null), 5000);
                  }}
                />
                {attachmentError && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                    {attachmentError}
                  </div>
                )}
              </div>
              <AttachmentsList attachments={attachments || []} onDelete={handleAttachmentDelete} />
            </>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Pin note</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Archive</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-primary/20 dark:border-border">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`${btnBase} ${btnPrimary} flex-1`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className={`${btnBase} ${btnGhost}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <SaveConfirmationModal
        isOpen={showSaveModal}
        onReturnToDashboard={() => {
          setShowSaveModal(false);
          onClose();
        }}
        onContinueEditing={() => {
          setShowSaveModal(false);
        }}
      />
    </article>
  );
};
