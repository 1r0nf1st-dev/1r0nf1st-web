'use client';

import type { JSX } from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { btnBase, btnGhost } from '../../styles/buttons';

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
      className={`sidebar-toggle md:hidden ${btnBase} ${btnGhost} p-2 min-h-[44px] min-w-[44px] flex items-center justify-center gap-2`}
      aria-label="Open notes sidebar"
      aria-expanded={!isCollapsed}
    >
      <Menu className="w-5 h-5 shrink-0" aria-hidden />
      <span>Menu</span>
    </button>
  );
};
