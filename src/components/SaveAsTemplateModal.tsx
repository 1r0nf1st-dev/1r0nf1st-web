'use client';

import type { JSX } from 'react';
import { useState, useEffect, useRef } from 'react';
import { cardClasses, cardTitle } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export interface SaveAsTemplateModalProps {
  isOpen: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const SaveAsTemplateModal = ({
  isOpen,
  defaultName,
  onSave,
  onCancel,
  isSaving = false,
}: SaveAsTemplateModalProps): JSX.Element | null => {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      const t = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(t);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/50 dark:bg-black/70 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-as-template-title"
    >
      <div
        ref={modalRef}
        className={`${cardClasses} max-w-md w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-as-template-title" className={cardTitle}>
          Save as template
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label htmlFor="template-name" className="block text-sm font-medium text-foreground">
            Template name
          </label>
          <input
            ref={inputRef}
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meeting notes"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            disabled={isSaving}
          />
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className={`${btnBase} ${btnGhost} min-h-[44px] touch-manipulation`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className={`${btnBase} ${btnPrimary} min-h-[44px] touch-manipulation`}
            >
              {isSaving ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
