'use client';

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { btnBase, btnGhost, btnDanger } from '../styles/buttons';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isLoading = false,
  errorMessage = null,
}: ConfirmDeleteModalProps): JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useFocusManagement({
    isOpen,
    containerRef: modalRef,
    triggerRef: cancelRef,
    trapFocus: true,
    autoFocus: true,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl border-2 border-primary/40 dark:border-border bg-white dark:bg-surface shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-delete-title"
          className="text-lg font-semibold text-foreground mb-2"
        >
          {title}
        </h2>
        <p id="confirm-delete-desc" className="text-muted text-sm mb-4">
          {message}
        </p>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {errorMessage}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`${btnBase} ${btnGhost}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${btnBase} ${btnDanger}`}
          >
            {isLoading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
