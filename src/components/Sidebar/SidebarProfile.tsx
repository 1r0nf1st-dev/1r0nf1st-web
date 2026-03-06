'use client';

import type { JSX } from 'react';
import { useId } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';

export const SidebarProfile = (): JSX.Element => {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const tooltipId = useId();

  const displayName = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div
      className={`group relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground transition-colors ${
        isCollapsed ? 'justify-center' : ''
      }`}
      aria-label={`${displayName} profile`}
      aria-describedby={isCollapsed ? tooltipId : undefined}
    >
      <User className="h-4 w-4 shrink-0" aria-hidden />
      {!isCollapsed ? <span className="truncate">{displayName}</span> : null}
      {isCollapsed ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-xl bg-surface px-2 py-1 text-xs text-foreground shadow group-hover:block group-focus-visible:block"
        >
          {displayName}
        </span>
      ) : null}
    </div>
  );
};
