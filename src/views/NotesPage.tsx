'use client';

import type { JSX } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { NotesList } from '../components/NotesList';
import { NoteDetail } from '../components/NoteDetail';
import { NotebooksSidebar } from '../components/NotebooksSidebar';
import { TagsList } from '../components/TagsList';
import { SharedNotesList } from '../components/SharedNotesList';
import { useNotes, createNote, type Note } from '../useNotes';
import { useNotebooks } from '../useNotebooks';
import { useTags } from '../useTags';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { FaLock, FaStickyNote } from 'react-icons/fa';

export const NotesPage = (): JSX.Element => {
  const { user } = useAuth();
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | undefined>();
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showShared, setShowShared] = useState(false);

  const notesFilters = useMemo(
    () => ({
      notebook_id: selectedNotebookId,
      tag_id: selectedTagId,
      search: searchQuery || undefined,
      archived: showArchived ? true : undefined,
    }),
    [selectedNotebookId, selectedTagId, searchQuery, showArchived],
  );

  const { notes, isLoading, error, refetch } = useNotes(notesFilters);

  const { notebooks } = useNotebooks();
  const { tags } = useTags();

  // Track if we've already refetched after login to prevent infinite loops
  const hasRefetchedAfterLogin = useRef(false);
  const previousUser = useRef(user);

  // Refetch notes when user becomes authenticated (e.g., after login)
  useEffect(() => {
    // Only refetch if user changed from null/undefined to authenticated
    if (user && !previousUser.current && !hasRefetchedAfterLogin.current) {
      hasRefetchedAfterLogin.current = true;
      refetch().catch((error) => {
        console.error('Failed to refetch notes after login:', error);
      });
    }
    previousUser.current = user;
    // Reset the flag when user logs out
    if (!user) {
      hasRefetchedAfterLogin.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch is stable (memoized), and we only want to run when user changes
  }, [user]);

  const handleCreateNote = async () => {
    // Ensure user is authenticated
    if (!user) {
      alert('Please log in to create notes.');
      return;
    }

    // Switch back to "My Notes" view if viewing shared notes
    if (showShared) {
      setShowShared(false);
    }

    try {
      // TipTap empty document structure
      const emptyContent = { type: 'doc', content: [] };
      const newNote = await createNote({
        title: 'New Note',
        content: emptyContent,
        notebook_id: selectedNotebookId,
      });
      
      // Refetch notes list to include the new note
      await refetch();
      
      // Select the newly created note
      setSelectedNote(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
      let message = 'Failed to create note. Please try again.';
      
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String(error.message);
      }
      
      alert(`Failed to create note: ${message}`);
    }
  };

  const handleSave = async () => {
    await refetch();
    // Refresh selected note by fetching it again
    if (selectedNote) {
      try {
        const { getNoteById } = await import('../useNotes');
        const updated = await getNoteById(selectedNote.id);
        if (updated) {
          setSelectedNote(updated);
        }
      } catch (error) {
        console.error('Failed to refresh note:', error);
      }
    }
  };

  const handleDelete = async () => {
    setSelectedNote(null);
    await refetch();
  };

  const handleNoteClick = async (note: Note) => {
    // For shared notes, use the data directly (already includes attachments)
    // For own notes, fetch full details with attachments
    if (showShared) {
      // Shared notes already have attachments loaded from getSharedNotes
      setSelectedNote(note);
      return;
    }

    // Fetch full note with attachments when opening own notes
    try {
      const { getNoteById } = await import('../useNotes');
      const fullNote = await getNoteById(note.id);
      if (fullNote) {
        setSelectedNote(fullNote);
      } else {
        // Fallback to note from list if fetch fails
        setSelectedNote(note);
      }
    } catch (error) {
      console.error('Failed to fetch note details:', error);
      // Fallback to note from list if fetch fails
      setSelectedNote(note);
    }
  };

  const handleNoteSelect = (note: Note | null) => {
    if (note === null) {
      setSelectedNote(null);
      return;
    }
    // Fetch full note with attachments when opening
    handleNoteClick(note).catch((error) => {
      console.error('Failed to fetch note details:', error);
      // Fallback to note from list if fetch fails
      setSelectedNote(note);
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
        <div className="w-full max-w-[1080px] mx-auto">
          <Hero />
        </div>
        <main className="flex-1 flex items-stretch justify-center pt-7">
          <article className={cardClasses} style={{ maxWidth: '600px' }}>
            <div className={cardOverlay} aria-hidden />
            <div className="relative z-10 flex flex-col items-center text-center">
              <FaLock className="text-4xl text-primary mb-4" />
              <h2 className={cardTitle}>Notes</h2>
              <p className={cardBody}>
                Please log in to access your notes. Notes are private and only visible to you.
              </p>
              <Link href="/login?returnTo=/notes" className={`${btnBase} ${btnPrimary} mt-4`}>
                Log In
              </Link>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section className="w-full max-w-[1080px] mx-auto" aria-label="Notes">
          <div className="mb-6">
            <Link
              href="/"
              className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
            >
              ← Back to Home
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="space-y-4">
                <NotebooksSidebar
                  selectedNotebookId={selectedNotebookId}
                  onNotebookSelect={setSelectedNotebookId}
                />
                <TagsList
                  selectedTagIds={selectedTagId ? [selectedTagId] : []}
                  onTagToggle={(tagId) => setSelectedTagId(selectedTagId === tagId ? undefined : tagId)}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Search and create */}
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="flex-1 px-4 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNote(null);
                    setShowArchived(false);
                    setShowShared(false);
                    setSelectedNotebookId(undefined);
                    setSelectedTagId(undefined);
                    setSearchQuery('');
                  }}
                  className={`${btnBase} ${btnGhost} ${!showArchived && !showShared ? 'bg-primary/20 dark:bg-primary/10' : ''}`}
                  aria-label="Show my notes"
                >
                  My Notes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setShowShared(false);
                  }}
                  className={`${btnBase} ${btnGhost} ${showArchived && !showShared ? 'bg-primary/20 dark:bg-primary/10' : ''}`}
                  aria-label={showArchived ? 'Show active notes' : 'Show archived notes'}
                >
                  {showArchived ? 'Active Notes' : 'Archived'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowArchived(false);
                    setShowShared(!showShared);
                  }}
                  className={`${btnBase} ${btnGhost} ${showShared ? 'bg-primary/20 dark:bg-primary/10' : ''}`}
                  aria-label="Show shared notes"
                >
                  Shared
                </button>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className={`${btnBase} ${btnPrimary}`}
                  aria-label="Create new note"
                >
                  <FaStickyNote className="mr-2" />
                  New Note
                </button>
              </div>

            {/* Notes list or detail */}
            {selectedNote ? (
              <NoteDetail
                note={selectedNote}
                tags={tags || []}
                notebooks={notebooks || []}
                onSave={handleSave}
                onDelete={handleDelete}
                onClose={() => setSelectedNote(null)}
                onNotesChanged={() => refetch()}
              />
            ) : (
              <>
                {(selectedTagId || selectedNotebookId) && (
                  <p className="text-sm text-muted mb-2" aria-live="polite">
                    {selectedTagId && (
                      <span>
                        Tag: <strong>{tags?.find((t) => t.id === selectedTagId)?.name ?? 'Tag'}</strong>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setSelectedTagId(undefined)}
                          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        >
                          Clear tag
                        </button>
                      </span>
                    )}
                    {selectedNotebookId && selectedTagId && ' · '}
                    {selectedNotebookId && (
                      <span>
                        Notebook: <strong>{notebooks?.find((n) => n.id === selectedNotebookId)?.name ?? 'Notebook'}</strong>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setSelectedNotebookId(undefined)}
                          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        >
                          Clear notebook
                        </button>
                      </span>
                    )}
                  </p>
                )}
                {isLoading ? (
                  <article className={cardClasses}>
                    <div className={cardOverlay} aria-hidden />
                    <h2 className={cardTitle}>Notes</h2>
                    <p className={cardBody}>Loading notes...</p>
                  </article>
                ) : error ? (
                  <article className={cardClasses}>
                    <div className={cardOverlay} aria-hidden />
                    <h2 className={cardTitle}>Notes</h2>
                    <p className={cardBody}>Error: {error}</p>
                  </article>
                ) : showShared ? (
                  <SharedNotesList onNoteSelect={handleNoteSelect} />
                ) : (
                  <NotesList
                    notes={notes || []}
                    onNoteClick={handleNoteClick}
                    selectedNoteId={undefined}
                  />
                )}
              </>
            )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
