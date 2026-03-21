'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { useEffect } from 'react';

import { useSidebar } from '../contexts/SidebarContext';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { MobileSidebarToggle } from './Sidebar/MobileSidebarToggle';

export interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export const AppShell = ({ sidebar, children }: AppShellProps): JSX.Element => {
  const hasSidebar = Boolean(sidebar);
  const { isCollapsed, setCollapsed } = useSidebar();

  const closeSidebar = (): void => setCollapsed(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && hasSidebar && !isCollapsed) setCollapsed(true);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [hasSidebar, isCollapsed, setCollapsed]);

  return (
    <div className="app-shell pt-14">
      <Nav />
      <div className={hasSidebar ? 'app-body' : 'app-body app-body--no-sidebar'}>
        {hasSidebar && (
          <div
            className={`sidebar-overlay ${!isCollapsed ? 'active' : ''}`}
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        {hasSidebar ? (
          <aside className={`sidebar ${!isCollapsed ? 'mobile-open' : ''}`}>{sidebar}</aside>
        ) : null}
        <div className="main">
          {hasSidebar && <MobileSidebarToggle />}
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
};
