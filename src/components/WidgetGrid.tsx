'use client';

import type { JSX, ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useWidgetPreferences, type WidgetId } from '../hooks/useWidgetPreferences';
import { TasksWidget } from './TasksWidget';
import { StravaWidget } from './StravaWidget';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { btnBase, btnGhost } from '../styles/buttons';

const WIDGET_LABELS: Record<WidgetId, string> = {
  tasks: 'Today',
  strava: 'Strava',
  goals: 'Goals',
};

interface WidgetGridProps {
  styleTheme?: 'default' | 'corporate';
  /** When provided, TasksWidget shows "Daily view" link */
  onViewDaily?: () => void;
}

export function WidgetGrid({ styleTheme = 'default', onViewDaily }: WidgetGridProps): JSX.Element {
  const { enabledWidgets, toggleWidget, isEnabled } = useWidgetPreferences();
  const [showCustomize, setShowCustomize] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCustomize(false);
      }
    };
    if (showCustomize) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showCustomize]);

  const renderWidget = (id: WidgetId): ReactNode => {
    switch (id) {
      case 'tasks':
        return <TasksWidget key="tasks" styleTheme={styleTheme} onViewDaily={onViewDaily} />;
      case 'strava':
        return <StravaWidget key="strava" styleTheme={styleTheme} />;
      case 'goals':
        return <GoalTrackerWidget key="goals" styleTheme={styleTheme} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          Widgets
        </span>
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className={`${btnBase} ${btnGhost} p-2 min-h-11 min-w-11 text-muted hover:text-foreground touch-manipulation`}
            aria-label="Customize widgets"
            aria-expanded={showCustomize}
          >
            <Settings className="w-4 h-4" aria-hidden />
          </button>
          {showCustomize && (
            <div
              className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface shadow-lg py-2"
              role="menu"
            >
              <div className="px-3 py-1 text-xs font-semibold text-muted uppercase">
                Show widgets
              </div>
              {(['tasks', 'strava', 'goals'] as const).map((id) => (
                <label
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-primary/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isEnabled(id)}
                    onChange={() => toggleWidget(id)}
                    className="rounded-xl border-primary/50"
                  />
                  <span className="text-sm">{WIDGET_LABELS[id]}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledWidgets.map((id) => renderWidget(id))}
      </div>
    </div>
  );
}
