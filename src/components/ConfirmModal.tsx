'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useFocusManagement } from '../hooks/useFocusManagement';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  warning?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: 'destructive' | 'confirm';
  icon?: string;
  /** When true, only show confirm button (e.g. for alerts). Default false. */
  hideCancel?: boolean;
  /** Show loading state on confirm button. Default false. */
  isLoading?: boolean;
  /** Error message to display above footer. Optional. */
  errorMessage?: string | null;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant,
  icon,
  hideCancel = false,
  isLoading = false,
  errorMessage = null,
}: ConfirmModalProps): ReactNode {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useFocusManagement({
    isOpen,
    containerRef: modalRef,
    triggerRef: cancelRef,
    trapFocus: true,
    autoFocus: true,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDestructive = variant === 'destructive';
  const primaryBg = isDestructive ? '#C0392B' : '#E05C1A';
  const iconBg = isDestructive ? 'rgba(192,57,43,0.12)' : 'rgba(224,92,26,0.10)';
  const iconBorder = isDestructive ? 'rgba(192,57,43,0.25)' : 'rgba(224,92,26,0.25)';
  const warningColor = isDestructive ? '#C0392B' : '#5C574F';

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,8,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#201D1A',
          border: '1px solid rgba(255,255,255,0.11)',
          borderTop: '2px solid #E05C1A',
          width: '420px',
          maxWidth: '90vw',
          borderRadius: 0,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            id="confirm-modal-title"
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
            {title}
          </div>
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

        {/* Body */}
        <div style={{ padding: '22px' }}>
          {icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                background: iconBg,
                border: `1px solid ${iconBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                fontSize: '16px',
                borderRadius: 0,
              }}
            >
              {icon}
            </div>
          )}

          <div
            id="confirm-modal-desc"
            style={{
              fontSize: '13px',
              color: '#A8A39A',
              lineHeight: 1.7,
            }}
          >
            {message}
          </div>

          {errorMessage && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                background: 'rgba(192,57,43,0.12)',
                border: '1px solid rgba(192,57,43,0.25)',
                color: '#C0392B',
                fontSize: '12px',
                lineHeight: 1.5,
                borderRadius: 0,
              }}
            >
              {errorMessage}
            </div>
          )}

          {warning && (
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: warningColor,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '12px',
              }}
            >
              <div style={{ width: '10px', height: '1px', background: warningColor }} />
              {warning}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#1A1714',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {!hideCancel && (
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
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
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: primaryBg,
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
            {isLoading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
