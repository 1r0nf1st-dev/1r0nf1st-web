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
      className={`md:hidden ${btnBase} ${btnGhost} p-2 min-h-[44px] min-w-[44px] flex items-center justify-center`}
      aria-label="Open notes sidebar"
      aria-expanded={!isCollapsed}
    >
      <Menu className="w-6 h-6" aria-hidden />
    </button>
  );
};
