import type { JSX } from 'react';
import { useState, useEffect, useRef } from 'react';
import { shareNote, type ShareNoteInput } from '../useNoteSharing';

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

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

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
              expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
            }
          : {}),
      };

      const share = await shareNote(noteId, input);
      setSuccess(
        shareType === 'public'
          ? "Public share link created! Copy the link from Share Settings. Share added to this note's version history."
          : "Note shared. If they have an account they'll get login instructions; otherwise they'll receive a link to view without signing up. Share added to this note's version history.",
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

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid rgba(255,255,255,0.11)',
    background: '#2A2520',
    color: '#F4F2EE',
    fontFamily: 'Barlow, sans-serif',
    fontSize: '13px',
    borderRadius: 0,
    boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '9px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#5C574F',
    marginBottom: '8px',
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4 overscroll-contain"
      style={{ background: 'rgba(10,10,8,0.82)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <article
        ref={modalRef}
        className="max-w-md w-full"
        style={{
          background: '#201D1A',
          border: '1px solid rgba(255,255,255,0.11)',
          borderTop: '2px solid #E05C1A',
          borderRadius: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id="share-modal-title"
            style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#F4F2EE',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '14px', height: '1px', background: '#E05C1A' }} />
            Share Note
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '26px',
              height: '26px',
              background: '#2A2520',
              border: '1px solid rgba(255,255,255,0.11)',
              color: '#A8A39A',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              borderRadius: 0,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                marginBottom: '16px',
                background: 'rgba(192,57,43,0.12)',
                border: '1px solid rgba(192,57,43,0.25)',
                color: '#C0392B',
                fontSize: '12px',
                lineHeight: 1.5,
                borderRadius: 0,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: '12px 14px',
                marginBottom: '16px',
                background: 'rgba(34,139,34,0.12)',
                border: '1px solid rgba(34,139,34,0.25)',
                color: '#2E8B2E',
                fontSize: '12px',
                lineHeight: 1.5,
                borderRadius: 0,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Share Type</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shareType"
                  value="user"
                  checked={shareType === 'user'}
                  onChange={(e) => setShareType(e.target.value as 'user' | 'public')}
                />
                <span style={{ fontSize: '13px', color: '#F4F2EE' }}>With User</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shareType"
                  value="public"
                  checked={shareType === 'public'}
                  onChange={(e) => setShareType(e.target.value as 'user' | 'public')}
                />
                <span style={{ fontSize: '13px', color: '#F4F2EE' }}>Public Link</span>
              </label>
            </div>
          </div>

          {shareType === 'user' && (
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="user-email" style={labelStyle}>
                User Email
              </label>
              <input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@example.com"
                style={inputStyle}
              />
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#A8A39A', lineHeight: 1.5 }}>
                Enter the email address of the user to share with
              </p>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Permission</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              style={inputStyle}
            >
              <option value="view">View Only</option>
              <option value="edit">Can Edit</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="expires" style={labelStyle}>
              Expires In (days, optional)
            </label>
            <input
              id="expires"
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) =>
                setExpiresInDays(e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))
              }
              placeholder="Leave empty for no expiration"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              type="submit"
              disabled={isSharing}
              style={{
                flex: 1,
                minWidth: '120px',
                background: '#E05C1A',
                color: '#fff',
                fontFamily: 'Barlow, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                padding: '8px 22px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSharing}
              style={{
                flex: 1,
                minWidth: '120px',
                background: 'transparent',
                color: '#A8A39A',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 18px',
                border: '1px solid rgba(255,255,255,0.11)',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    </div>
  );
};
