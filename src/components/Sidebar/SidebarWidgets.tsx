'use client';

import type { JSX } from 'react';
import { useMemo, useCallback } from 'react';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useClientReady } from '../../hooks/useClientReady';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export type WidgetType = 'goals' | 'tasks' | 'strava';

interface WidgetItem {
  id: WidgetType;
  label: string;
  /** Same glyph style as SidebarNavRow (nav-item-icon, not SVG). */
  icon: string;
}

const ALL_WIDGETS: WidgetItem[] = [
  { id: 'goals', label: 'Goals', icon: '⌖' },
  { id: 'tasks', label: 'Tasks', icon: '▣' },
  { id: 'strava', label: 'Strava', icon: '⌁' },
];

export const SidebarWidgets = (): JSX.Element => {
  const { user } = useAuth();
  const { toggleWidget } = useNotesActions();
  const { setCollapsed } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const clientReady = useClientReady();

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const widgets = useMemo(() => {
    const showStrava = clientReady && isAdmin;
    return showStrava ? ALL_WIDGETS : ALL_WIDGETS.filter((w) => w.id !== 'strava');
  }, [clientReady, isAdmin]);

  const closeOnSelect = useCallback(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile, setCollapsed]);

  return (
    <div className="flex flex-col">
      {widgets.map((widget) => (
        <button
          key={widget.id}
          type="button"
          onClick={() => {
            toggleWidget(widget.id);
            closeOnSelect();
          }}
          className="nav-item group relative"
          aria-label={`Toggle ${widget.label} widget`}
        >
          <span className="nav-item-icon" aria-hidden>
            {widget.icon}
          </span>
          <span className="nav-item-label">{widget.label}</span>
        </button>
      ))}
    </div>
  );
};
