import type { JSX } from 'react';
import { useState } from 'react';
import {
  useNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
  type NoteVersion,
} from '../useNoteVersions';
import { Skeleton } from './Skeleton';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import { RestoreVersionModal } from './RestoreVersionModal';
import { useAlert } from '../contexts/AlertContext';
import { VersionPreview } from './VersionPreview';

export interface NoteVersionHistoryProps {
  noteId: string;
  onVersionRestored?: () => void;
  onClose?: () => void;
}

export const NoteVersionHistory = ({
  noteId,
  onVersionRestored,
  onClose,
}: NoteVersionHistoryProps): JSX.Element => {
  const { versions, isLoading, error, refetch } = useNoteVersions(noteId);
  const { showAlert } = useAlert();
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [previewVersion, setPreviewVersion] = useState<NoteVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePreviewVersion = async (versionNumber: number) => {
    try {
      const version = await getNoteVersion(noteId, versionNumber);
      setPreviewVersion(version);
    } catch (error) {
      console.error('Failed to load version:', error);
      showAlert(
        error instanceof Error ? error.message : 'Failed to load version',
        'Error',
      );
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    setIsRestoring(true);
    try {
      await restoreNoteVersion(noteId, versionNumber);
      await refetch();
      setSelectedVersion(null);
      onVersionRestored?.();
    } catch (error) {
      console.error('Failed to restore version:', error);
      showAlert(
        error instanceof Error ? error.message : 'Failed to restore version',
        'Error',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (previewVersion) {
    return (
      <VersionPreview
        version={previewVersion}
        onClose={() => setPreviewVersion(null)}
        onRestore={() => {
          setPreviewVersion(null);
          setSelectedVersion(previewVersion);
        }}
      />
    );
  }

  return (
    <article className={cardClasses}>

      <div className="relative z-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className={`${cardTitle} truncate min-w-0`}>Version History</h2>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`${btnBase} ${btnGhost} text-sm min-h-[44px] touch-manipulation`}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className={`${btnBase} ${btnGhost} text-sm min-h-[44px] touch-manipulation`}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={cardBody} aria-busy>
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-3 h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        ) : !versions || versions.length === 0 ? (
          <p className={cardBody}>
            No versions available. Versions are created when you edit a note or share it.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => {
              const isShareEvent = version.content_text?.trim().startsWith('Shared with ');
              return (
                <div
                  key={version.id}
                  className="p-3 border-2 border-primary/20 dark:border-border rounded-xl bg-surface-soft/50 hover:bg-surface-soft transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {isShareEvent ? 'Share' : `Version ${version.version_number}`}
                        </span>
                        <span className="text-xs text-muted">{formatDate(version.created_at)}</span>
                      </div>
                      {version.content_text && (
                        <p className="text-sm text-muted line-clamp-2">
                          {version.content_text.slice(0, 100)}
                          {version.content_text.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewVersion(version.version_number)}
                        className={`${btnBase} ${btnGhost} text-sm py-2 px-3 min-h-[44px] touch-manipulation`}
                      >
                        Preview
                      </button>
                      {!isShareEvent && (
                        <button
                          type="button"
                          onClick={() => setSelectedVersion(version)}
                          className={`${btnBase} ${btnPrimary} text-sm py-2 px-3 min-h-[44px] touch-manipulation`}
                          disabled={isRestoring}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedVersion && (
        <RestoreVersionModal
          version={selectedVersion}
          onConfirm={() => handleRestoreVersion(selectedVersion.version_number)}
          onCancel={() => setSelectedVersion(null)}
        />
      )}
    </article>
  );
};
