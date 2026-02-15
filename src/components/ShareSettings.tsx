import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useNoteShares, updateSharePermission, unshareNote, type SharedNote } from '../useNoteSharing';
import { Skeleton } from './Skeleton';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface ShareSettingsProps {
  noteId: string;
  onClose: () => void;
}

export const ShareSettings = ({ noteId, onClose }: ShareSettingsProps): JSX.Element => {
  const { shares, isLoading, error, refetch } = useNoteShares(noteId);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (noteId) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const handlePermissionChange = async (shareId: string, permission: 'view' | 'edit') => {
    setUpdating(shareId);
    try {
      await updateSharePermission(shareId, permission);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setUpdating(null);
    }
  };

  const handleUnshare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) {
      return;
    }

    setDeleting(shareId);
    try {
      await unshareNote(shareId);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove share');
    } finally {
      setDeleting(null);
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/notes/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getShareUrl = (token: string): string => {
    return `${window.location.origin}/notes/shared/${token}`;
  };

  return (
    <div className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cardTitle}>Share Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${btnBase} ${btnGhost} text-sm`}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8" aria-busy>
            <Skeleton className="mx-auto mb-4 h-4 w-full" />
            <Skeleton className="mx-auto mb-4 h-4 w-3/4" />
            <Skeleton className="mx-auto h-4 w-1/2" />
          </div>
        ) : shares && shares.length > 0 ? (
          <div className="space-y-4">
            {shares.map((share: SharedNote) => (
              <div
                key={share.id}
                className="p-4 border-2 border-primary/40 dark:border-border rounded-lg bg-white/50 dark:bg-surface/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {share.shared_with_user_id ? (
                      <div>
                        <p className="font-medium text-foreground">
                          {share.shared_with_user?.email || share.shared_with_user_id}
                        </p>
                        <p className="text-sm text-muted">Shared with user</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">Public Link</p>
                        <p className="text-sm text-muted">Anyone with the link can access</p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={getShareUrl(share.share_token)}
                            className="flex-1 px-2 py-1 text-xs border border-primary/20 dark:border-border rounded bg-white dark:bg-surface text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => copyShareLink(share.share_token)}
                            className={`${btnBase} ${btnGhost} text-xs px-2 py-1`}
                          >
                            {copiedToken === share.share_token ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted">Permission:</span>
                      <select
                        value={share.permission}
                        onChange={(e) =>
                          handlePermissionChange(share.id, e.target.value as 'view' | 'edit')
                        }
                        disabled={updating === share.id}
                        className="px-2 py-1 text-xs border border-primary/20 dark:border-border rounded bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Can Edit</option>
                      </select>
                    </div>

                    {share.expires_at && (
                      <p className="text-xs text-muted mt-1">
                        Expires: {new Date(share.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnshare(share.id)}
                    disabled={deleting === share.id}
                    className={`${btnBase} ${btnGhost} text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20`}
                  >
                    {deleting === share.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            No shares yet. Use the Share button to share this note.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className={`${btnBase} ${btnPrimary}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
