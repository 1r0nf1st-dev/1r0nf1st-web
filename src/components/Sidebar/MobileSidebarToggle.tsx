'use client';

import type { JSX } from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { btnGhost } from '../../styles/buttons';

/**
 * Mobile sidebar toggle button. Only visible on mobile devices.
 * Opens the mobile sidebar drawer.
 */
export const MobileSidebarToggle = (): JSX.Element => {
  const { isCollapsed, setCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setCollapsed(false)}
      className={`sidebar-toggle md:hidden ${btnGhost} flex min-h-[44px] items-center justify-start gap-2`}
      aria-label="Open notes sidebar"
      aria-expanded={!isCollapsed}
    >
      <Menu className="w-5 h-5 shrink-0" aria-hidden />
      <span>Menu</span>
    </button>
  );
};
