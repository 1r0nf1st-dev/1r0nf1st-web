'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { btnBase, btnIcon } from '../styles/buttons';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/**
 * Slide-over drawer for filters on mobile. Evernote-style: filters in drawer, content full screen.
 */
export const FilterDrawer = ({
  isOpen,
  onClose,
  children,
  title = 'Filter',
}: FilterDrawerProps): JSX.Element => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[min(320px,85vw)] bg-background dark:bg-surface border-l border-primary/20 dark:border-border shadow-xl flex flex-col transition-transform duration-200 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-modal="true"
        aria-label={title}
        role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-primary/20 dark:border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${btnBase} ${btnIcon}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
};
