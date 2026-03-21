import type { JSX } from 'react';
import { useEffect, useRef } from 'react';

export interface SaveConfirmationModalProps {
  isOpen: boolean;
  onReturnToDashboard: () => void;
  onContinueEditing: () => void;
}

export const SaveConfirmationModal = ({
  isOpen,
  onReturnToDashboard,
  onContinueEditing,
}: SaveConfirmationModalProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4 overscroll-contain"
      style={{ background: 'rgba(10,10,8,0.82)' }}
      onClick={onReturnToDashboard}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-confirmation-title"
    >
      <div
        ref={modalRef}
        className="max-w-md w-full mx-4"
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
            padding: '22px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2
            id="save-confirmation-title"
            style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: '13px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#F4F2EE',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '14px', height: '1px', background: '#E05C1A' }} />
            Note Saved Successfully
          </h2>
          <p style={{ fontSize: '13px', color: '#A8A39A', lineHeight: 1.7, margin: 0 }}>
            What would you like to do next?
          </p>
        </div>
        <div
          style={{
            padding: '14px 22px',
            background: '#1A1714',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onReturnToDashboard}
            style={{
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
            Return to Dashboard
          </button>
          <button
            type="button"
            onClick={onContinueEditing}
            style={{
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
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
};
