'use client';

import type { MutableRefObject } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { StickyNote, FileText, ChevronDown, Archive, Search, Wrench } from 'lucide-react';
import { NotebooksSidebar } from './NotebooksSidebar';
import { TagsList } from './TagsList';
import { SavedSearchesSection } from './SavedSearchesSection';
import { WebClipperSection } from './WebClipperSection';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';

export interface NoteTemplate {
  id: string;
  name: string;
  content: Record<string, unknown>;
}

export interface NotesSidebarProps {
  /** Ref for search input (Cmd+K focus) */
  searchInputRef: MutableRefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateNote: () => void;
  templates: NoteTemplate[];
  onCreateNoteFromTemplate: (template: { content: Record<string, unknown> }) => void;
  /** View segment state */
  showArchived: boolean;
  showShared: boolean;
  showDailyView: boolean;
  onViewMyNotes: () => void;
  onViewToday: () => void;
  onViewArchived: () => void;
  onViewShared: () => void;
  /** Filters */
  selectedNotebookId: string | undefined;
  onNotebookSelect: (id: string | undefined) => void;
  selectedTagId: string | undefined;
  onTagToggle: (tagId: string) => void;
  onApplySavedSearch: (query: string) => void;
  notebooks: Array<{ id: string; name: string }> | undefined;
  tags: Array<{ id: string; name: string }> | undefined;
  styleTheme?: 'default' | 'corporate';
  /** Compact layout (smaller spacing for mobile slide-out) */
  compact?: boolean;
  /** Called when user selects notebook/tag in slide-out (e.g. close sidebar on mobile) */
  onFilterSelect?: () => void;
}

export const NotesSidebar = ({
  searchInputRef,
  searchQuery,
  onSearchChange,
  onCreateNote,
  templates,
  onCreateNoteFromTemplate,
  showArchived,
  showShared,
  showDailyView,
  onViewMyNotes,
  onViewToday,
  onViewArchived,
  onViewShared,
  selectedNotebookId,
  onNotebookSelect,
  selectedTagId,
  onTagToggle,
  onApplySavedSearch,
  notebooks = [],
  tags = [],
  styleTheme = 'default',
  compact = false,
  onFilterSelect,
}: NotesSidebarProps): JSX.Element => {
  const handleNotebookSelect = (id: string | undefined) => {
    onNotebookSelect(id);
    onFilterSelect?.();
  };

  const handleTagToggle = (tagId: string) => {
    onTagToggle(tagId);
    onFilterSelect?.();
  };

  const sectionSummaryClass = `cursor-pointer list-none flex items-center justify-between gap-2 rounded-xl text-sm font-semibold hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
    compact ? 'py-2 px-3 min-h-11 touch-manipulation' : 'py-2 px-2'
  }`;

  const summaryLeftClass = 'flex items-center gap-2 min-w-0';
  const summaryChevronClass =
    'w-4 h-4 shrink-0 text-muted transition-transform group-open:rotate-180';

  const itemButtonClass = (active: boolean) =>
    `w-full text-left flex items-center gap-2 min-w-0 rounded-xl transition-colors ${
      compact ? 'px-3 py-2 min-h-11 touch-manipulation text-sm' : 'px-2 py-2 text-sm'
    } ${
      active
        ? 'bg-primary/20 dark:bg-primary/10 text-primary-strong dark:text-primary'
        : 'text-foreground hover:bg-primary/5 dark:hover:bg-primary/10'
    }`;

  const isMyNotesActive = !showArchived && !showShared && !showDailyView;
  const isTodayActive = showDailyView;
  const isArchiveActive = showArchived && !showShared && !showDailyView;
  const isSharedActive = showShared;

  return (
    <div className="flex flex-col h-full">
      <Link
        href={styleTheme === 'corporate' ? '/projects' : '/'}
        className={`${btnBase} ${btnGhost} text-sm py-1.5 px-2 mb-3 self-start`}
      >
        ← Back
      </Link>

      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="px-2">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Notes
          </div>

          <div className="space-y-1 mb-2">
            <button
              type="button"
              onClick={() => {
                onCreateNote();
                onFilterSelect?.();
              }}
              className={`${btnBase} ${btnPrimary} w-full ${compact ? 'min-h-11 touch-manipulation' : ''}`}
            >
              <StickyNote className="mr-2" />
              New Note
            </button>

            {templates.length > 0 && (
              <details className="group">
                <summary
                  className={`cursor-pointer list-none flex items-center justify-between gap-2 rounded-xl text-sm font-medium hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                    compact ? 'py-2 px-3 min-h-11 touch-manipulation' : 'py-1.5 px-2'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" aria-hidden />
                    <span className="truncate">From template</span>
                  </span>
                  <ChevronDown className={summaryChevronClass} aria-hidden />
                </summary>
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-primary/20 dark:border-primary/30 ml-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onCreateNoteFromTemplate(t);
                        onFilterSelect?.();
                      }}
                      className="block w-full text-left px-2 py-1.5 text-sm rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>

          <details className="group" open>
            <summary className={sectionSummaryClass}>
              <span className={summaryLeftClass}>
                <span className="truncate">Notebooks</span>
              </span>
              <ChevronDown className={summaryChevronClass} aria-hidden />
            </summary>
            <div className="mt-1 px-1">
              <NotebooksSidebar
                selectedNotebookId={selectedNotebookId}
                onNotebookSelect={handleNotebookSelect}
                compact
                hideTitle
              />
            </div>
          </details>

          <details className="group mt-1">
            <summary className={sectionSummaryClass}>
              <span className={summaryLeftClass}>
                <span className="truncate">Tags</span>
              </span>
              <ChevronDown className={summaryChevronClass} aria-hidden />
            </summary>
            <div className="mt-1 px-1">
              <TagsList
                selectedTagIds={selectedTagId ? [selectedTagId] : []}
                onTagToggle={handleTagToggle}
                compact
                hideTitle
              />
            </div>
          </details>
        </div>

        <details className="group px-2">
          <summary className={sectionSummaryClass}>
            <span className={summaryLeftClass}>
              <Archive className="w-4 h-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">Archives</span>
            </span>
            <ChevronDown className={summaryChevronClass} aria-hidden />
          </summary>
          <div className="mt-1 space-y-1 px-1" role="group" aria-label="Archives">
            <button
              type="button"
              onClick={() => {
                onViewMyNotes();
                onFilterSelect?.();
              }}
              className={itemButtonClass(isMyNotesActive)}
              aria-pressed={isMyNotesActive}
            >
              <span className="truncate">My Notes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onViewToday();
                onFilterSelect?.();
              }}
              className={itemButtonClass(isTodayActive)}
              aria-pressed={isTodayActive}
            >
              <span className="truncate">Today</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onViewArchived();
                onFilterSelect?.();
              }}
              className={itemButtonClass(isArchiveActive)}
              aria-pressed={isArchiveActive}
            >
              <span className="truncate">Archive</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onViewShared();
                onFilterSelect?.();
              }}
              className={itemButtonClass(isSharedActive)}
              aria-pressed={isSharedActive}
            >
              <span className="truncate">Shared</span>
            </button>
          </div>
        </details>

        <details className="group px-2" open>
          <summary className={sectionSummaryClass}>
            <span className={summaryLeftClass}>
              <Search className="w-4 h-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">Search</span>
            </span>
            <ChevronDown className={summaryChevronClass} aria-hidden />
          </summary>
          <div className="mt-2 space-y-3">
            <div className="px-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search notes..."
                title="Operators: tag:name notebook:name is:archived"
                aria-keyshortcuts="Meta+k Control+k"
                className={`w-full text-sm border border-primary/30 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  compact ? 'px-3 py-2.5 min-h-11 touch-manipulation' : 'px-2 py-1.5'
                }`}
              />
            </div>
            <div className="px-1">
              <SavedSearchesSection
                searchQuery={searchQuery}
                selectedNotebookId={selectedNotebookId}
                selectedTagId={selectedTagId}
                showArchived={showArchived}
                showShared={showShared}
                notebooks={notebooks}
                tags={tags}
                onApplySearch={(query) => {
                  onApplySavedSearch(query);
                  onFilterSelect?.();
                }}
                compact
              />
            </div>
          </div>
        </details>

        <details className="group px-2">
          <summary className={sectionSummaryClass}>
            <span className={summaryLeftClass}>
              <Wrench className="w-4 h-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">Tools</span>
            </span>
            <ChevronDown className={summaryChevronClass} aria-hidden />
          </summary>
          <div className="mt-2 px-1">
            <WebClipperSection compact />
          </div>
        </details>
      </div>
    </div>
  );
};
