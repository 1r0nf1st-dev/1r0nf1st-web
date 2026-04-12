'use client';

import type { JSX } from 'react';
import { useMemo } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSharedNotesCount } from '../../hooks/useSharedNotesCount';
import { useClientReady } from '../../hooks/useClientReady';
import { SidebarNav } from './SidebarNav';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = (): JSX.Element => {
  const { toggleCollapsed } = useSidebar();
  const sharedUnreadCount = useSharedNotesCount();
  const { user } = useAuth();
  const clientReady = useClientReady();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '';
  const initials = useMemo(() => {
    if (!clientReady) return '??';
    return (
      user?.username?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? '??'
    );
  }, [clientReady, user]);

  return (
    <div className="sidebar" aria-label="Notes sidebar navigation">
      <div className="sidebar-top">
        <span className="sidebar-top-label">Navigation</span>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={toggleCollapsed}
          aria-label="Toggle sidebar"
        >
          «
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        <SidebarNav sharedUnreadCount={sharedUnreadCount} />
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar" aria-label="User">
          {initials}
        </div>
        <div className="sidebar-footer-version">{appVersion ? `v${appVersion}` : ''}</div>
      </div>
    </div>
  );
};
