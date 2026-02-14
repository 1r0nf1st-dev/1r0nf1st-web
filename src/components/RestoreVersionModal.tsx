import type { JSX } from 'react';
import type { NoteVersion } from '../useNoteVersions';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface RestoreVersionModalProps {
  version: NoteVersion;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RestoreVersionModal = ({
  version,
  onConfirm,
  onCancel,
}: RestoreVersionModalProps): JSX.Element => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-modal-title"
    >
      <article
        className={`${cardClasses} max-w-md w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cardOverlay} aria-hidden />
        <div className="relative z-10">
          <h2 id="restore-modal-title" className={cardTitle}>
            Restore Version {version.version_number}?
          </h2>
          <p className={cardBody}>
            This will restore the note content from{' '}
            <strong>{formatDate(version.created_at)}</strong>. The current version will be saved
            as a new version, so you can always go back.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className={`${btnBase} ${btnPrimary} flex-1`}
            >
              Restore Version
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`${btnBase} ${btnGhost} flex-1`}
            >
              Cancel
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
