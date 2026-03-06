'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { Target, CheckSquare, Activity } from 'lucide-react';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useId } from 'react';

export type WidgetType = 'goals' | 'tasks' | 'strava';

interface WidgetItem {
  id: WidgetType;
  label: string;
  icon: typeof Target;
}

const widgets: WidgetItem[] = [
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'strava', label: 'Strava', icon: Activity },
];

export const SidebarWidgets = (): JSX.Element => {
  const { toggleWidget } = useNotesActions();
  const { isCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show labels if not collapsed OR if on mobile (for popovers)
  const shouldShowLabel = !isCollapsed || isMobile;

  return (
    <div className="space-y-1">
      {widgets.map((widget) => {
        const tooltipId = useId();
        return (
          <button
            key={widget.id}
            type="button"
            onClick={() => toggleWidget(widget.id)}
            className={`group relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors ${
              isCollapsed && !isMobile ? 'justify-center' : ''
            } text-foreground hover:bg-primary/5 dark:hover:bg-primary/10`}
            aria-label={`Toggle ${widget.label} widget`}
            aria-describedby={isCollapsed && !isMobile ? tooltipId : undefined}
          >
            <widget.icon className="h-4 w-4 shrink-0" aria-hidden />
            {shouldShowLabel ? (
              <span className="truncate">{widget.label}</span>
            ) : (
              <span
                id={tooltipId}
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-xl bg-surface px-2 py-1 text-xs text-foreground shadow group-hover:block group-focus-visible:block"
              >
                {widget.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
