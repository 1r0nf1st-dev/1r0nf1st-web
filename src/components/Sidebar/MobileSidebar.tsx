'use client';

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSharedNotesCount } from '../../hooks/useSharedNotesCount';
import { SidebarNav } from './SidebarNav';
import { btnBase, btnIcon } from '../../styles/buttons';

/**
 * Mobile sidebar drawer that slides in from the left on mobile devices.
 * Hidden on desktop (md and above).
 */
export const MobileSidebar = (): JSX.Element => {
  const { isCollapsed, setCollapsed } = useSidebar();
  const sharedUnreadCount = useSharedNotesCount();
  const isOpen = !isCollapsed;
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setCollapsed(true);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, setCollapsed]);

  // Focus management
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />
      {/* Sidebar panel */}
      <aside
        ref={panelRef}
        className={`md:hidden fixed z-50 w-[min(320px,85vw)] bg-white/80 backdrop-blur dark:bg-surface/80 border-r border-primary/10 dark:border-border shadow-xl flex flex-col transition-transform duration-200 ease-out left-0 top-[73px] h-[calc(100vh-73px)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-modal="true"
        aria-label="Notes sidebar navigation"
        role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-primary/10 dark:border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className={`${btnBase} ${btnIcon}`}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarNav sharedUnreadCount={sharedUnreadCount} />
        </div>
      </aside>
    </>
  );
};
