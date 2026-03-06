'use client';

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { btnBase, btnPrimary } from '../styles/buttons';

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  title,
  message,
  onClose,
}: AlertModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management
  useFocusManagement({
    isOpen,
    containerRef,
    triggerRef: okRef,
    trapFocus: true,
    autoFocus: true,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event): void => {
      e.preventDefault();
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-desc"
      className="w-full max-w-md rounded-xl border-2 border-primary/40 dark:border-border bg-white dark:bg-surface shadow-xl p-0 overflow-hidden backdrop:bg-black/50"
    >
      <div ref={containerRef} className="p-6">
        <h2
          id="alert-modal-title"
          className="text-lg font-semibold text-foreground mb-2"
        >
          {title}
        </h2>
        <p id="alert-modal-desc" className="text-muted text-sm mb-6">
          {message}
        </p>
        <div className="flex justify-end">
          <button
            ref={okRef}
            type="button"
            onClick={onClose}
            className={`${btnBase} ${btnPrimary}`}
          >
            OK
          </button>
        </div>
      </div>
    </dialog>
  );
}
