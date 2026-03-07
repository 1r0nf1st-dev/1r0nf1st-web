'use client';

import type { JSX } from 'react';
import { useId } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

export const SidebarToggle = (): JSX.Element => {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const tooltipId = useId();
  const tooltipLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <button
      type="button"
      className="group relative flex h-10 w-full items-center justify-center rounded-xl border border-primary/20 hover:bg-primary/5"
      onClick={toggleCollapsed}
      aria-label={tooltipLabel}
      aria-describedby={isCollapsed ? tooltipId : undefined}
    >
      {isCollapsed ? (
        <ChevronsRight className="h-4 w-4" aria-hidden />
      ) : (
        <ChevronsLeft className="h-4 w-4" aria-hidden />
      )}
      {isCollapsed ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-xl bg-surface px-2 py-1 text-xs text-foreground shadow group-hover:block group-focus-visible:block whitespace-nowrap"
        >
          {tooltipLabel}
        </span>
      ) : null}
    </button>
  );
};
