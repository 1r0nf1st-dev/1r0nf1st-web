'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { btnBase, btnIcon } from '../styles/buttons';

export interface SlideOutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** 'left' | 'right' - default 'left' */
  side?: 'left' | 'right';
  /** Offset from top of viewport (keeps header/nav visible) */
  topOffset?: number;
}

/**
 * Slide-out panel for Notes tools. Left-side by default, used on both desktop and mobile.
 */
export const SlideOutSidebar = ({
  isOpen,
  onClose,
  children,
  title = 'Tools',
  side = 'left',
  topOffset = 0,
}: SlideOutSidebarProps): JSX.Element => {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useFocusManagement({
    isOpen,
    containerRef: panelRef,
    triggerRef: closeButtonRef,
    trapFocus: true,
    autoFocus: true,
  });

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

  const isLeft = side === 'left';
  const translateClosed = isLeft ? '-translate-x-full' : 'translate-x-full';
  const borderSide = isLeft ? 'border-r' : 'border-l';
  const top = Math.max(0, Math.floor(topOffset));

  return (
    <>
      <div
        className={`fixed left-0 right-0 bottom-0 z-40 bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={`fixed z-50 w-[min(320px,85vw)] lg:w-52 bg-white/80 backdrop-blur dark:bg-surface/80 ${borderSide} border-primary/10 dark:border-border shadow-xl flex flex-col transition-transform duration-200 ease-out ${
          isLeft ? 'left-0' : 'right-0'
        } ${isOpen ? 'translate-x-0' : translateClosed}`}
        style={{ top, height: `calc(100vh - ${top}px)` }}
        aria-modal="true"
        aria-label={title}
        role="dialog"
      >
        <div
          className={`flex items-center justify-between p-4 border-b border-primary/10 dark:border-border shrink-0 ${
            isLeft ? '' : 'flex-row-reverse'
          }`}
        >
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={`${btnBase} ${btnIcon}`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">{children}</div>
      </aside>
    </>
  );
};
