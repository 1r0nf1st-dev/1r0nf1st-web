'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (next: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved === '1') setIsCollapsed(true);
      if (saved === '0') setIsCollapsed(false);
    } catch {
      // Ignore storage access issues in private mode.
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setIsCollapsed(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Ignore storage access issues in private mode.
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const value = useMemo(
    () => ({ isCollapsed, toggleCollapsed, setCollapsed }),
    [isCollapsed, toggleCollapsed, setCollapsed],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
