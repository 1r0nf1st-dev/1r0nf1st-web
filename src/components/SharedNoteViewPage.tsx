'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSharedNoteByToken } from '../useNoteSharing';
import type { Note } from '../useNotes';
import { NoteEditor } from './NoteEditor';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';

export interface SharedNoteViewPageProps {
  token: string;
}

/** Minimal shared note view: no nav, view-only. Per Sally: clear "Shared" label, friendly 404. */
export const SharedNoteViewPage = ({ token }: SharedNoteViewPageProps): JSX.Element => {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getSharedNoteByToken(token);
        if (cancelled) return;
        if (data && typeof data === 'object' && 'id' in data) {
          setNote(data as Note);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="text-muted">Loading shared note...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <article className={`${cardClasses} max-w-md w-full text-center`}>

          <div className="relative z-10">
            <h1 className={cardTitle}>Link not available</h1>
            <p className={cardBody}>
              This link has expired or is invalid. It may have been removed or the share settings
              may have changed.
            </p>
            <Link href="/" className={`${btnBase} ${btnGhost} mt-4 inline-block`}>
              Go to home
            </Link>
          </div>
        </article>
      </div>
    );
  }

  const content =
    note.content &&
    typeof note.content === 'object' &&
    Object.keys(note.content).length > 0 &&
    (note.content as { type?: string; content?: unknown[] }).type === 'doc'
      ? (note.content as Record<string, unknown>)
      : { type: 'doc', content: [] };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-primary/20 dark:border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Shared note</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary-strong dark:text-primary">
            View only
          </span>
        </div>
        <Link href="/" className={`${btnBase} ${btnGhost} text-sm`}>
          ← Home
        </Link>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <article className={cardClasses}>

          <div className="relative z-10">
            <h1 className={`${cardTitle} text-xl mb-4`}>{note.title || 'Untitled'}</h1>
            <div className="prose dark:prose-invert max-w-none">
              <NoteEditor content={content} onChange={() => {}} editable={false} />
            </div>
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-primary/20 dark:border-border">
                <h3 className="text-sm font-medium mb-2 text-foreground">Attachments</h3>
                <ul className="space-y-1 text-sm text-muted">
                  {note.attachments.map((a) => (
                    <li key={a.id}>
                      {a.file_name} ({formatBytes(a.file_size)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
