'use client';

import type { JSX } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

export const SidebarToggle = (): JSX.Element => {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <button
      type="button"
      className="flex h-10 w-full items-center justify-center rounded-xl border border-primary/20 hover:bg-primary/5"
      onClick={toggleCollapsed}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <ChevronsRight className="h-4 w-4" aria-hidden />
      ) : (
        <ChevronsLeft className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
};
