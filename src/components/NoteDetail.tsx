import type { JSX } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { Note, Tag } from '../useNotes';
import { NoteEditor } from './NoteEditor';
import { updateNote, deleteNote, getNoteById } from '../useNotes';
import { SaveConfirmationModal } from './SaveConfirmationModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { FileUpload } from './FileUpload';
import { AttachmentsList } from './AttachmentsList';
import { NoteVersionHistory } from './NoteVersionHistory';
import { ShareNoteModal } from './ShareNoteModal';
import { ShareSettings } from './ShareSettings';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { BacklinksSection } from './BacklinksSection';
import { tiptapToMarkdown } from '../utils/tiptapToMarkdown';
import { createNoteTemplate } from '../useNoteTemplates';
import { useAlert } from '../contexts/AlertContext';
import { cardClasses, cardTitle } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost, btnIcon, btnCompact } from '../styles/buttons';
import { ChevronDown, X } from 'lucide-react';

export interface NoteDetailProps {
  note: Note | null;
  tags: Tag[];
  notebooks: Array<{ id: string; name: string }>;
  notes?: Note[];
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onNoteClick?: (note: Note) => void;
  /** Called when the notes list should refresh (e.g. after sharing, which adds a history note). */
  onNotesChanged?: () => void;
}

export const NoteDetail = ({
  note,
  tags,
  notebooks,
  notes = [],
  onSave,
  onDelete,
  onClose,
  onNoteClick,
  onNotesChanged,
}: NoteDetailProps): JSX.Element => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Note['attachments']>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const shareSettingsModalRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (showShareSettings && shareSettingsModalRef.current) {
      shareSettingsModalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [showShareSettings]);

  // Sally: focus title when opening a note for better keyboard flow
  useEffect(() => {
    if (!note) return;
    const id = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [note?.id]);

  // Close tags dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagsDropdownRef.current &&
        !tagsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTagsDropdownOpen(false);
      }
    };

    if (isTagsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTagsDropdownOpen]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      // Normalize content: ensure it's a valid TipTap document structure
      if (
        note.content &&
        typeof note.content === 'object' &&
        Object.keys(note.content).length > 0
      ) {
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
      // Set tags from note - tags should only be present if explicitly added by user
      // For new notes, tags should be empty array (tags are optional, not auto-added)
      setSelectedTagIds(note.tags?.map((t) => t.id) || []);
      setIsPinned(note.is_pinned);
      setIsArchived(note.is_archived);
      setAttachments(note.attachments || []);
    } else {
      // Reset for new note - use proper TipTap empty document structure
      setTitle('');
      setContent({ type: 'doc', content: [] });
      setNotebookId(null);
      setSelectedTagIds([]); // Explicitly reset tags to empty array - tags are optional
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
          error instanceof Error ? error.message : 'Failed to create note. Please try again.';
        showAlert(`Failed to create note: ${message}`, 'Error');
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
        error instanceof Error ? error.message : 'Failed to save note. Please try again.';
      showAlert(`Failed to save note: ${message}`, 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!note) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteNote(note.id);
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Failed to delete note:', error);
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete note. Please try again.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!note) {
    return (
      <div className="text-center py-12 text-muted">
        <p>Select a note to view or create a new one</p>
      </div>
    );
  }

  // Show version history if requested
  if (showVersionHistory) {
    return (
      <NoteVersionHistory
        noteId={note.id}
        onVersionRestored={() => {
          setShowVersionHistory(false);
          onSave(); // Refresh the note after restore
        }}
        onClose={() => setShowVersionHistory(false)}
      />
    );
  }

  return (
    <>
      <article className={cardClasses}>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className={cardTitle}>Edit Note</h2>
            <button
              type="button"
              onClick={onClose}
              className={`${btnBase} ${btnGhost} ${btnIcon}`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="note-title"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Title
              </label>
              <input
                ref={titleInputRef}
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Note title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Notebook</label>
              <select
                value={notebookId || ''}
                onChange={(e) => setNotebookId(e.target.value || null)}
                className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium mb-1 text-foreground">Tags</label>
              <div ref={tagsDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                  className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedTagIds.length === 0
                      ? 'No tags'
                      : selectedTagIds.length === 1
                        ? tags.find((t) => t.id === selectedTagIds[0])?.name || '1 tag'
                        : `${selectedTagIds.length} tags`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isTagsDropdownOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>
                {isTagsDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface shadow-lg max-h-60 overflow-y-auto">
                    {tags.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted">No tags available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {tags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          return (
                            <label
                              key={tag.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTagIds([...selectedTagIds, tag.id]);
                                  } else {
                                    setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                                  }
                                }}
                                className="rounded border-primary/40 text-primary focus:ring-primary"
                              />
                              <span className="text-sm text-foreground flex-1">{tag.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Content</label>
              <NoteEditor
                content={content}
                onChange={setContent}
                notesForLinking={notes}
              />
            </div>

            {note && onNoteClick && (
              <BacklinksSection noteId={note.id} onNoteClick={onNoteClick} />
            )}

            {note && (
              <>
                <div>
                  <FileUpload
                    noteId={note.id}
                    onUploadComplete={handleAttachmentUploadComplete}
                    onError={(error) => {
                      setAttachmentError(error);
                      setTimeout(() => setAttachmentError(null), 10000);
                    }}
                  />
                  {attachmentError && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
                      {attachmentError}
                    </div>
                  )}
                </div>
                <AttachmentsList
                  attachments={attachments || []}
                  onDelete={handleAttachmentDelete}
                />
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

            <div className="flex flex-wrap gap-2 pt-4 border-t border-primary/20 dark:border-border [&_button]:touch-manipulation">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`${btnBase} ${btnPrimary} flex-1 min-w-[80px]`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const md = `# ${title}\n\n${tiptapToMarkdown(content)}`;
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${(title || 'note').replace(/[^a-z0-9-]/gi, '_')}.md`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
                title="Export as Markdown"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => setShowVersionHistory(true)}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
                title="View version history"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setShowSaveAsTemplateModal(true)}
                disabled={isSavingTemplate}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
                title="Save as template"
              >
                {isSavingTemplate ? '...' : 'Save as template'}
              </button>
              <SaveAsTemplateModal
                isOpen={showSaveAsTemplateModal}
                defaultName={title || 'Untitled'}
                isSaving={isSavingTemplate}
                onSave={async (templateName) => {
                  setIsSavingTemplate(true);
                  try {
                    await createNoteTemplate({ name: templateName, content });
                    setShowSaveAsTemplateModal(false);
                    onNotesChanged?.();
                    showAlert('Template saved.', 'Success');
                  } catch (err) {
                    showAlert(
                      err instanceof Error ? err.message : 'Failed to save template.',
                      'Error',
                    );
                  } finally {
                    setIsSavingTemplate(false);
                  }
                }}
                onCancel={() => setShowSaveAsTemplateModal(false)}
              />
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => setShowShareSettings(true)}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
              >
                Share Settings
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className={`${btnBase} ${btnGhost} ${btnCompact}`}
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
        {showShareModal && (
          <ShareNoteModal
            noteId={note.id}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            onShareCreated={() => {
              setShowShareModal(false);
              setShowShareSettings(true);
              onNotesChanged?.();
            }}
          />
        )}
        {showShareSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/50 dark:bg-black/70 overscroll-contain">
            <div
              ref={shareSettingsModalRef}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto"
            >
              <ShareSettings noteId={note.id} onClose={() => setShowShareSettings(false)} />
            </div>
          </div>
        )}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title="Delete note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteError(null);
          }}
          isLoading={isDeleting}
          errorMessage={deleteError}
        />
      </article>
    </>
  );
};
