import type { JSX } from 'react';
import { useState } from 'react';
import { shareNote, type ShareNoteInput } from '../useNoteSharing';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface ShareNoteModalProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onShareCreated?: () => void;
}

export const ShareNoteModal = ({
  noteId,
  isOpen,
  onClose,
  onShareCreated,
}: ShareNoteModalProps): JSX.Element | null => {
  const [shareType, setShareType] = useState<'user' | 'public'>('user');
  const [userEmail, setUserEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (shareType === 'user' && !userEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsSharing(true);

    try {
      const input: ShareNoteInput = {
        permission,
        ...(shareType === 'public' ? {} : { shared_with_user_email: userEmail.trim() }),
        ...(expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0
          ? {
              expires_at: new Date(
                Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : {}),
      };

      const share = await shareNote(noteId, input);
      setSuccess(
        shareType === 'public'
          ? 'Public share link created! Copy the link from Share Settings. Share added to this note\'s version history.'
          : 'Note shared. If they have an account they\'ll get login instructions; otherwise they\'ll receive a link to view without signing up. Share added to this note\'s version history.',
      );
      setUserEmail('');
      setExpiresInDays('');
      onShareCreated?.();
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share note');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <article
        className={`${cardClasses} max-w-md w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cardOverlay} aria-hidden />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 id="share-modal-title" className={cardTitle}>
              Share Note
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`${btnBase} ${btnGhost} text-sm`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 mb-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-sm">
                {success}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Share Type
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareType"
                    value="user"
                    checked={shareType === 'user'}
                    onChange={(e) => setShareType(e.target.value as 'user' | 'public')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">With User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareType"
                    value="public"
                    checked={shareType === 'public'}
                    onChange={(e) => setShareType(e.target.value as 'user' | 'public')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">Public Link</span>
                </label>
              </div>
            </div>

            {shareType === 'user' && (
              <div className="mb-4">
                <label htmlFor="user-email" className="block text-sm font-medium mb-1 text-foreground">
                  User Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted">
                  Enter the email address of the user to share with
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Permission
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="expires" className="block text-sm font-medium mb-1 text-foreground">
                Expires In (days, optional)
              </label>
              <input
                id="expires"
                type="number"
                min="1"
                value={expiresInDays}
                onChange={(e) =>
                  setExpiresInDays(e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))
                }
                placeholder="Leave empty for no expiration"
                className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className={`${btnBase} ${btnPrimary} flex-1`}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : 'Share'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`${btnBase} ${btnGhost}`}
                disabled={isSharing}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </article>
    </div>
  );
};
