'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  StickyNote,
  Search,
  Pin,
  Clock,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { WidgetGrid } from './WidgetGrid';
import type { Note } from '../useNotes';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface NoteTemplate {
  id: string;
  name: string;
  content: Record<string, unknown>;
}

export interface NotesHomeViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onNewNote: () => void;
  onNewNoteFromTemplate?: (template: NoteTemplate) => void;
  templates?: NoteTemplate[];
  onFocusSearch: () => void;
  styleTheme?: 'default' | 'corporate';
  /** When provided, TasksWidget shows "Daily view" link */
  onViewDaily?: () => void;
}

const PINNED_MAX = 6;
const RECENT_MAX = 8;

function TemplateDropdown({
  templates,
  onSelect,
  btnBase,
  btnPrimary,
  isCorporate,
}: {
  templates: NoteTemplate[];
  onSelect: (t: NoteTemplate) => void;
  btnBase: string;
  btnPrimary: string;
  isCorporate: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Create note from a saved template"
        className={`${btnBase} ${btnPrimary} flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 border-l border-primary-strong/30 dark:border-primary/40 shadow-md hover:shadow-lg transition-shadow rounded-r-xl`}
        aria-label="Create note from template"
        aria-expanded={open}
      >
        <FileText className="w-4 h-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">From template</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-h-64 overflow-auto rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface shadow-lg py-2"
          role="menu"
        >
          <div className="px-3 py-1 text-xs font-semibold text-muted uppercase">
            Choose a template
          </div>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(t);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NoteCardCompact({
  note,
  onClick,
  styleTheme,
}: {
  note: Note;
  onClick: () => void;
  styleTheme?: 'default' | 'corporate';
}): JSX.Element {
  const preview = note.content_text
    ? note.content_text.substring(0, 100) + (note.content_text.length > 100 ? '...' : '')
    : '';

  const isCorporate = styleTheme === 'corporate';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface hover:border-primary/40 dark:hover:border-primary/30 hover:shadow-md transition-all duration-200 p-3 md:p-4 active:scale-[0.98] ${
        isCorporate ? 'md:rounded-xl shadow-sm hover:shadow-md' : ''
      }`}
      aria-label={`Open note: ${note.title || 'Untitled'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${
            isCorporate
              ? 'bg-primary/10 dark:bg-primary/20 text-primary'
              : 'bg-primary/15 dark:bg-primary/20 text-primary-strong dark:text-primary'
          }`}
        >
          <StickyNote className="w-4 h-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-foreground truncate text-sm md:text-base ${
              isCorporate ? 'tracking-tight' : ''
            }`}
          >
            {note.title || 'Untitled'}
          </h3>
          {preview && (
            <p className="text-xs md:text-sm text-muted line-clamp-2 mt-0.5">
              {preview}
            </p>
          )}
          <p className="text-xs text-muted mt-2">
            {formatRelativeDate(note.updated_at)}
            {note.tags && note.tags.length > 0 && (
              <span className="ml-2">
                · {note.tags.slice(0, 2).map((t) => t.name).join(', ')}
              </span>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

export const NotesHomeView = ({
  notes,
  onNoteClick,
  onNewNote,
  onNewNoteFromTemplate,
  templates = [],
  onFocusSearch,
  styleTheme = 'default',
  onViewDaily,
}: NotesHomeViewProps): JSX.Element => {
  const pinned = notes.filter((n) => n.is_pinned).slice(0, PINNED_MAX);
  const recent = notes
    .filter((n) => !n.is_pinned)
    .slice(0, RECENT_MAX);

  const hasNotes = notes.length > 0;
  const isCorporate = styleTheme === 'corporate';

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 ${
        isCorporate ? 'md:px-8 lg:px-10' : ''
      }`}
    >
      {/* Quick actions - always visible */}
      <div
        className={`flex flex-wrap gap-3 mb-6 md:mb-8 ${
          isCorporate ? 'gap-4' : ''
        }`}
      >
        <div className="flex">
          <button
            type="button"
            onClick={onNewNote}
            className={`${btnBase} ${btnPrimary} flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base font-medium shadow-md hover:shadow-lg transition-shadow ${
              templates.length > 0 && onNewNoteFromTemplate
                ? isCorporate
                  ? 'rounded-l-xl rounded-r-none'
                  : 'rounded-l-lg rounded-r-none'
                : isCorporate
                  ? 'rounded-xl'
                  : 'rounded-xl'
            }`}
            aria-label="Create new note"
          >
            <StickyNote className="w-4 h-4 shrink-0" aria-hidden />
            New Note
          </button>
          {templates.length > 0 && onNewNoteFromTemplate && (
            <TemplateDropdown
              templates={templates}
              onSelect={onNewNoteFromTemplate}
              btnBase={btnBase}
              btnPrimary={btnPrimary}
              isCorporate={isCorporate}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onFocusSearch}
          className={`${btnBase} ${btnGhost} flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base border border-primary/30 dark:border-border hover:bg-primary/5 transition-colors ${
            isCorporate ? 'rounded-xl' : ''
          }`}
          aria-label="Focus search"
        >
          <Search className="w-4 h-4 shrink-0" aria-hidden />
          Search notes
        </button>
      </div>

      {!hasNotes ? (
        <div className="flex flex-col gap-8">
          <WidgetGrid styleTheme={styleTheme} onViewDaily={onViewDaily} />
          <div
            className={`flex-1 flex flex-col items-center justify-center py-12 md:py-16 ${
              cardClasses
            }`}
            style={{ minHeight: '200px' }}
          >

          <div className="relative z-10 text-center max-w-sm">
            <div
              className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full mb-4 ${
                isCorporate
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                  : 'bg-primary/15 dark:bg-primary/20 text-primary-strong dark:text-primary'
              }`}
            >
              <StickyNote className="w-7 h-7 md:w-8 md:h-8" aria-hidden />
            </div>
            <h2 className={`${cardTitle} text-lg md:text-xl mb-2`}>
              No notes yet
            </h2>
            <p className={cardBody}>
              Create your first note to get started. Notes stay private and
              sync across your devices.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={onNewNote}
                className={`${btnBase} ${btnPrimary} px-6 py-3 ${
                  isCorporate ? 'rounded-xl' : 'rounded-xl'
                }`}
              >
                Create your first note
              </button>
              {templates.length > 0 && onNewNoteFromTemplate && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm text-muted">or use a template:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onNewNoteFromTemplate(t)}
                        className={`${btnBase} ${btnPrimary} px-4 py-2 text-sm ${
                          isCorporate ? 'rounded-xl' : 'rounded-xl'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 md:gap-10">
          <WidgetGrid styleTheme={styleTheme} onViewDaily={onViewDaily} />
          {pinned.length > 0 && (
            <section aria-labelledby="home-pinned-heading">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Pin
                  className="w-4 h-4 text-primary shrink-0"
                  aria-hidden
                />
                <h2
                  id="home-pinned-heading"
                  className={`text-sm font-semibold uppercase tracking-wider text-muted ${
                    isCorporate ? 'tracking-widest' : ''
                  }`}
                >
                  Pinned
                </h2>
              </div>
              <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((note) => (
                  <NoteCardCompact
                    key={note.id}
                    note={note}
                    onClick={() => onNoteClick(note)}
                    styleTheme={styleTheme}
                  />
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section aria-labelledby="home-recent-heading">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Clock
                  className="w-4 h-4 text-primary shrink-0"
                  aria-hidden
                />
                <h2
                  id="home-recent-heading"
                  className={`text-sm font-semibold uppercase tracking-wider text-muted ${
                    isCorporate ? 'tracking-widest' : ''
                  }`}
                >
                  Recent
                </h2>
              </div>
              <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((note) => (
                  <NoteCardCompact
                    key={note.id}
                    note={note}
                    onClick={() => onNoteClick(note)}
                    styleTheme={styleTheme}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
