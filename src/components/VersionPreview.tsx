import type { JSX } from 'react';
import type { NoteVersion } from '../useNoteVersions';
import { NoteEditor } from './NoteEditor';
import { cardClasses, cardOverlay, cardTitle } from '../styles/cards';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';

export interface VersionPreviewProps {
  version: NoteVersion;
  onClose: () => void;
  onRestore: () => void;
}

export const VersionPreview = ({ version, onClose, onRestore }: VersionPreviewProps): JSX.Element => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Normalize content to ensure it's a valid TipTap document
  const normalizedContent =
    version.content && typeof version.content === 'object' && 'type' in version.content
      ? (version.content as Record<string, unknown>)
      : { type: 'doc', content: [] };

  const isShareEvent = version.content_text?.trim().startsWith('Shared with ');

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={cardTitle}>{isShareEvent ? 'Share' : `Version ${version.version_number}`}</h2>
            <p className="text-sm text-muted mt-1">{formatDate(version.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isShareEvent && (
              <button
                type="button"
                onClick={onRestore}
                className={`${btnBase} ${btnPrimary} text-sm`}
              >
                Restore This Version
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`${btnBase} ${btnGhost} text-sm`}
            >
              Close
            </button>
          </div>
        </div>

        {!isShareEvent && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-400 text-sm mb-4">
            <strong>Preview Mode:</strong> You are viewing a previous version. This is read-only. Click &quot;Restore This Version&quot; to restore it.
          </div>
        )}

        <div className="border-2 border-primary/20 dark:border-border rounded-lg p-4 bg-white dark:bg-surface-soft">
          <NoteEditor
            content={normalizedContent}
            onChange={() => {
              // Read-only - do nothing
            }}
            placeholder=""
            editable={false}
          />
        </div>
      </div>
    </article>
  );
};
