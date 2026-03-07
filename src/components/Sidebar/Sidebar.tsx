'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSharedNotesCount } from '../../hooks/useSharedNotesCount';
import { SidebarNav } from './SidebarNav';
import { SidebarToggle } from './SidebarToggle';

export const Sidebar = (): JSX.Element => {
  const { isCollapsed, setCollapsed } = useSidebar();
  const sharedUnreadCount = useSharedNotesCount();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On mobile, always keep sidebar collapsed (icons only)
      if (mobile) {
        setCollapsed(true);
      } else {
        // On desktop, respect stored preference
        const hasStoredValue = window.localStorage.getItem('sidebar_collapsed');
        if (hasStoredValue === null) {
          // Default to collapsed on small screens
          setCollapsed(window.innerWidth < 1024);
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setCollapsed]);

  // On mobile, always show collapsed (icons only)
  // On desktop, respect user preference
  const displayCollapsed = isMobile ? true : isCollapsed;

  return (
    <aside
      className={`block sticky top-[73px] z-10 h-[calc(100vh-73px)] shrink-0 border-r border-primary/10 bg-white/80 p-2 backdrop-blur dark:bg-surface/80 ${
        displayCollapsed ? 'w-16' : 'w-60'
      } transition-all duration-200 ease-in-out self-start`}
      aria-label="Notes sidebar navigation"
    >
      <div className="flex h-full flex-col gap-2">
        {/* Hide toggle on mobile since sidebar is always collapsed */}
        {!isMobile && <SidebarToggle />}
        <SidebarNav sharedUnreadCount={sharedUnreadCount} />      
      </div>
    </aside>
  );
};
