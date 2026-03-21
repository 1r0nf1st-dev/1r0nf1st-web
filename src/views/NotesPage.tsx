'use client';

import type { JSX } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { StickyNote, Calendar, Lock } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useNotesActions } from '../contexts/NotesActionsContext';
import { useLiveRegion } from '../contexts/LiveRegionContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ChromeLayout } from '../components/ChromeLayout';
import { NoteDetail } from '../components/NoteDetail';
import { useNotes, createNote, type Note } from '../useNotes';
import { ApiError } from '../apiClient';
import { useNoteTemplates } from '../useNoteTemplates';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useNotebooks } from '../useNotebooks';
import { useTags } from '../useTags';
import { btnBase, btnPrimary } from '../styles/buttons';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { DailyTodoView } from '../components/DailyTodoView';
import { parseArchivedFromQuery } from '../utils/savedSearchQuery';
import type { WidgetType } from '../components/Sidebar/SidebarWidgets';
import { GoalTrackerWidget } from '../components/GoalTrackerWidget';
import { TasksWidget } from '../components/TasksWidget';
import { StravaWidget } from '../components/StravaWidget';
import { WebClipperModal } from '../components/Sidebar/WebClipperModal';
import { SearchModal } from '../components/Sidebar/SearchModal';
import { PageHero } from '../components/PageHero';
import { StatsBar } from '../components/StatsBar';
import { ListCard } from '../components/ListCard';

interface NotesPageProps {
  useChrome?: boolean;
}

export const NotesPage = ({ useChrome = true }: NotesPageProps): JSX.Element => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const {
    registerHandlers,
    registerRefetch,
    refetchAllNotes,
    isWebClipperOpen,
    closeWebClipper,
    isSearchOpen,
    closeSearch,
  } = useNotesActions();
  const { announce } = useLiveRegion();
  const { handleError } = useErrorHandler();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showDailyView, setShowDailyView] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | undefined>();
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
  const [activeWidgets, setActiveWidgets] = useState<Set<WidgetType>>(new Set());

  const notesFilters = useMemo(
    () => ({
      notebook_id: selectedNotebookId,
      tag_id: selectedTagId,
      search: searchQuery || undefined,
      archived: showArchived ? true : undefined,
    }),
    [selectedNotebookId, selectedTagId, searchQuery, showArchived],
  );

  const { notes, refetch } = useNotes(notesFilters);
  const { notebooks } = useNotebooks();
  const { tags } = useTags();
  const { templates } = useNoteTemplates();

  const hasRefetchedAfterLogin = useRef(false);
  const previousUser = useRef(user);

  useEffect(() => {
    if (useChrome) return;
    setSelectedNotebookId(searchParams.get('notebook') ?? undefined);
    setSelectedTagId(searchParams.get('tag') ?? undefined);
    setSearchQuery(searchParams.get('q') ?? searchParams.get('search') ?? '');
    setShowArchived(
      searchParams.get('archived') === 'true' || searchParams.get('filter') === 'archived',
    );
  }, [searchParams, useChrome]);

  useEffect(() => {
    if (user && !previousUser.current && !hasRefetchedAfterLogin.current) {
      hasRefetchedAfterLogin.current = true;
      refetch().catch((error) => {
        console.error('Failed to refetch notes after login:', error);
      });
    }
    previousUser.current = user;
    if (!user) {
      hasRefetchedAfterLogin.current = false;
    }
  }, [user, refetch]);

  const handleApplySavedSearch = (query: string): void => {
    setSearchQuery(query);
    setSelectedNotebookId(undefined);
    setSelectedTagId(undefined);
    const archived = parseArchivedFromQuery(query);
    setShowArchived(archived ?? false);
  };

  const handleCreateNote = async () => {
    if (!user) {
      handleError('Please log in to create notes.', {
        fallback: 'Log in required',
        showAlert: true,
      });
      return;
    }

    try {
      const emptyContent = { type: 'doc', content: [] };
      const newNote = await createNote({
        title: 'New Note',
        content: emptyContent,
        notebook_id: selectedNotebookId,
      });

      if (!newNote || typeof newNote !== 'object' || !newNote.id) {
        throw new Error('Note creation failed: server returned invalid response');
      }

      await refetch();
      await refetchAllNotes();

      const noteWithoutTags = { ...newNote, tags: [] };
      setSelectedNote(noteWithoutTags);
      announce('New note created');
    } catch (error) {
      // Normalize empty-object errors (some libs/runtimes throw {} instead of Error)
      const err =
        error &&
        typeof error === 'object' &&
        !(error instanceof Error) &&
        Object.keys(error).length === 0
          ? new Error('Failed to create note. Please try again.')
          : error;
      handleError(err, {
        prefix: 'Failed to create note:',
        fallback: 'Failed to create note. Please try again.',
      });
    }
  };

  const handleCreateNoteFromTemplate = async (template: { content: Record<string, unknown> }) => {
    if (!user) return;
    try {
      const content =
        template.content &&
        typeof template.content === 'object' &&
        (template.content as { type?: string }).type === 'doc'
          ? template.content
          : { type: 'doc' as const, content: [] };
      const newNote = await createNote({
        title: 'New Note',
        content,
        notebook_id: selectedNotebookId,
      });
      await refetch();
      await refetchAllNotes(); // Trigger refetch in sidebar components
      setSelectedNote(newNote);
      announce('Note created from template');
    } catch (error) {
      handleError(error, {
        prefix: 'Failed to create note from template:',
        fallback: 'Failed to create note. Please try again.',
      });
    }
  };

  const handleNoteClick = async (note: Note) => {
    try {
      const { getNoteById } = await import('../useNotes');
      const fullNote = await getNoteById(note.id);
      setSelectedNote(fullNote ?? note);
    } catch (error) {
      // If note not found (404), just use the note we have
      if (error instanceof ApiError && error.status === 404) {
        console.warn('Note not found, using cached note:', note.id);
        setSelectedNote(note);
      } else {
        console.error('Failed to fetch note details:', error);
        setSelectedNote(note);
      }
    }
  };

  const handleSave = async () => {
    await refetch();
    if (selectedNote) {
      try {
        const { getNoteById } = await import('../useNotes');
        const updated = await getNoteById(selectedNote.id);
        if (updated) setSelectedNote(updated);
      } catch (error) {
        console.error('Failed to refresh note:', error);
      }
    }
  };

  const handleDelete = async () => {
    setSelectedNote(null);
    await refetch();
    await refetchAllNotes(); // Trigger refetch in sidebar components
  };

  const handleToggleWidget = (widgetId: WidgetType) => {
    setActiveWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  };

  const handleCreateNoteRef = useRef(handleCreateNote);
  handleCreateNoteRef.current = handleCreateNote;

  const handleCreateNoteFromTemplateRef = useRef(handleCreateNoteFromTemplate);
  handleCreateNoteFromTemplateRef.current = handleCreateNoteFromTemplate;

  const handleNoteClickRef = useRef(handleNoteClick);
  handleNoteClickRef.current = handleNoteClick;

  const handleToggleWidgetRef = useRef(handleToggleWidget);
  handleToggleWidgetRef.current = handleToggleWidget;

  // Create note when navigated from sidebar "New Note" while on another page (e.g. Second Brain)
  useEffect(() => {
    if (useChrome) return;
    if (searchParams.get('create') !== '1' || !user) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('create');
    const newPath = params.toString() ? `/notes?${params}` : '/notes';
    router.replace(newPath);

    handleCreateNoteRef.current();
  }, [searchParams, useChrome, user, router]);

  // Handle note selection from query parameter (e.g., when navigating from shared notes)
  useEffect(() => {
    if (useChrome) return;
    const noteId = searchParams.get('id');
    if (!noteId || (selectedNote && selectedNote.id === noteId)) return;

    const noteInList = notes?.find((note) => note.id === noteId);
    if (noteInList) {
      handleNoteClickRef.current(noteInList).catch((err) => {
        console.error('Failed to select note from query param:', err);
        setSelectedNote(noteInList);
      });
      return;
    }

    // Note not in current list (e.g. shared note) — fetch by ID and select
    void import('../useNotes').then(({ getNoteById }) => {
      getNoteById(noteId)
        .then((fetched: Note) => {
          handleNoteClickRef.current(fetched).catch((err) => {
            console.error('Failed to select note from query param:', err);
            setSelectedNote(fetched);
          });
        })
        .catch((err: unknown) => {
          console.error('Failed to load note from id param:', err);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleNoteClickRef is stable; noteId and notes drive the effect
  }, [searchParams, notes, selectedNote?.id, useChrome]);

  // Register handlers with context so sidebar items can trigger them
  useEffect(() => {
    registerHandlers({
      createNote: () => handleCreateNoteRef.current(),
      createNoteFromTemplate: (template) => handleCreateNoteFromTemplateRef.current(template),
      selectNote: (note) => {
        handleNoteClickRef.current(note).catch((err) => {
          console.error('Failed to select note:', err);
          setSelectedNote(note);
        });
      },
      toggleWidget: (widgetId) => handleToggleWidgetRef.current(widgetId),
    });
  }, [registerHandlers]);

  // Register refetch callback so sidebar components can be notified when notes change
  useEffect(() => {
    const unregister = registerRefetch(refetch);
    return unregister;
  }, [registerRefetch, refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNote(null);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'n') {
        e.preventDefault();
        handleCreateNoteRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const wrapWithChrome = (content: JSX.Element): JSX.Element => {
    if (!useChrome) return content;
    return <ChromeLayout>{content}</ChromeLayout>;
  };

  if (!user) {
    return wrapWithChrome(
      <article className={cardClasses} style={{ maxWidth: '600px' }}>
        <div className="relative z-10 flex flex-col items-center text-center">
          <Lock className="text-4xl text-primary mb-4" />
          <h2 className={cardTitle}>Notes</h2>
          <p className={cardBody}>
            Please log in to access your notes. Notes are private and only visible to you.
          </p>
          <Link href="/login?returnTo=/notes" className={`${btnBase} ${btnPrimary} mt-4`}>
            Log In
          </Link>
        </div>
      </article>,
    );
  }

  const isAdmin = !!user?.email && user.email.toLowerCase() === 'admin@1r0nf1st.com';
  const widgetArray = Array.from(activeWidgets).filter((id) => id !== 'strava' || isAdmin);

  const totalNotes = notes?.length ?? 0;
  const totalNotebooks = notebooks?.length ?? 0;
  const totalTags = tags?.length ?? 0;
  const pinnedCount = notes?.filter((n) => n.is_pinned).length ?? 0;

  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'recent' | 'archived'>('all');

  const filteredNotes = useMemo(() => {
    const base = notes ?? [];
    if (activeTab === 'archived') return base.filter((n) => n.is_archived);
    if (activeTab === 'pinned') return base.filter((n) => n.is_pinned && !n.is_archived);
    if (activeTab === 'recent')
      return base
        .filter((n) => !n.is_archived)
        .slice()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return base.filter((n) => !n.is_archived);
  }, [notes, activeTab]);

  const hero = (
    <PageHero
      flagLabel="Library"
      watermark="All Notes"
      title="All Notes"
      actions={
        <>
          <button type="button" className="act-btn">
            Export
          </button>
          <button
            type="button"
            className="act-btn primary"
            onClick={() => void handleCreateNoteRef.current()}
          >
            + New Note
          </button>
        </>
      }
      tabs={[
        { id: 'all', label: 'All' },
        { id: 'pinned', label: 'Pinned' },
        { id: 'recent', label: 'Recent' },
        { id: 'archived', label: 'Archived' },
      ]}
      activeTabId={activeTab}
      onTabChange={(id) => {
        if (id === 'archived') setShowArchived(true);
        if (id !== 'archived') setShowArchived(false);
        setActiveTab(id as typeof activeTab);
      }}
    />
  );

  if (!useChrome) {
    return (
      <div className="flex flex-col min-h-0 h-full">
        {hero}
        <div className="page-content">
          <StatsBar
            items={[
              { label: 'Total Notes', value: totalNotes },
              { label: 'Notebooks', value: totalNotebooks },
              { label: 'Tags', value: totalTags },
              { label: 'Pinned', value: pinnedCount, accent: true },
            ]}
          />

          {isWebClipperOpen ? (
            <WebClipperModal isOpen={isWebClipperOpen} onClose={closeWebClipper} />
          ) : null}
          {isSearchOpen ? <SearchModal isOpen={isSearchOpen} onClose={closeSearch} /> : null}

          {selectedNote ? (
            <NoteDetail
              note={selectedNote}
              tags={tags || []}
              notebooks={notebooks || []}
              notes={notes || []}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={() => setSelectedNote(null)}
              onNoteClick={handleNoteClick}
              onNotesChanged={() => refetch()}
            />
          ) : (
            <div>
              {filteredNotes.map((note) => (
                <ListCard
                  key={note.id}
                  icon="📄"
                  title={note.title || 'Untitled'}
                  tag={note.tags?.[0]?.name}
                  date={new Date(note.updated_at).toLocaleString()}
                  onClick={() => {
                    void handleNoteClick(note);
                  }}
                />
              ))}
              {filteredNotes.length === 0 ? (
                <div className="mt-8 text-[color:var(--color-text-inv-2)] font-mono text-[11px]">
                  No notes in this view.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  return wrapWithChrome(
    <div className="w-full h-full flex flex-col min-h-0 min-h-screen">
      {showDailyView ? (
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden touch-scroll">
          <DailyTodoView onBack={() => setShowDailyView(false)} />
        </div>
      ) : (
        <>
          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden touch-scroll">
            {/* Widget Grid */}
            {widgetArray.length > 0 && (
              <div className="w-full p-3 lg:p-6 border-b border-primary/10 dark:border-border">
                <div className="flex flex-wrap gap-3 lg:gap-4">
                  {widgetArray.map((widgetId) => (
                    <div
                      key={widgetId}
                      className="rounded-xl border border-primary/10 dark:border-border bg-white dark:bg-surface p-3 lg:p-4 min-w-[280px] max-w-[400px] flex-1"
                    >
                      {widgetId === 'goals' && <GoalTrackerWidget />}
                      {widgetId === 'tasks' && <TasksWidget />}
                      {widgetId === 'strava' && <StravaWidget />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Content */}
            <div className="flex-1 min-w-0 flex flex-col relative">
              {/* Web Clipper Modal - positioned at top-left */}
              {isWebClipperOpen && (
                <WebClipperModal isOpen={isWebClipperOpen} onClose={closeWebClipper} />
              )}
              {/* Search Modal - positioned at top-left */}
              {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />}
              {selectedNote ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden touch-scroll p-3 lg:p-6">
                  <NoteDetail
                    note={selectedNote}
                    tags={tags || []}
                    notebooks={notebooks || []}
                    notes={notes || []}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => setSelectedNote(null)}
                    onNoteClick={handleNoteClick}
                    onNotesChanged={() => refetch()}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-primary/10 p-4">
                        <StickyNote className="w-8 h-8 text-primary" aria-hidden />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">No note open</h2>
                    <p className="text-sm text-muted">
                      Select a note from the sidebar, or create a new one to get started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom nav - left-16 so it doesn't overlap sidebar column, keeping sidebar style consistent */}
      {useChrome ? (
        <nav
          className="lg:hidden fixed bottom-0 left-16 right-0 z-40 flex items-center justify-around gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-surface/95 border-t border-primary/15 dark:border-border backdrop-blur-sm"
          aria-label="Quick actions"
        >
          <button
            type="button"
            onClick={() => handleCreateNoteRef.current()}
            className="flex flex-col items-center gap-0.5 flex-1 min-h-12 py-2 px-3 rounded-xl text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 active:bg-primary/10 touch-manipulation transition-colors"
            aria-label="New note"
          >
            <StickyNote className="w-5 h-5 text-primary" aria-hidden />
            <span className="text-xs font-medium">New</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDailyView(true)}
            className={`flex flex-col items-center gap-0.5 flex-1 min-h-12 py-2 px-3 rounded-xl touch-manipulation transition-colors ${
              showDailyView
                ? 'bg-primary/20 dark:bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 active:bg-primary/10'
            }`}
            aria-label="Daily tasks"
            aria-pressed={showDailyView}
          >
            <Calendar className="w-5 h-5" aria-hidden />
            <span className="text-xs font-medium">Today</span>
          </button>
        </nav>
      ) : null}
    </div>,
  );
};
