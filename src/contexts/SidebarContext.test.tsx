import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { SidebarProvider, useSidebar } from './SidebarContext';

describe('SidebarContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <SidebarProvider>{children}</SidebarProvider>
  );

  it('defaults to expanded when no stored value exists', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isCollapsed).toBe(false);
  });

  it('loads collapsed state from localStorage', () => {
    localStorage.setItem('sidebar_collapsed', '1');
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggleCollapsed updates state and localStorage', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(localStorage.getItem('sidebar_collapsed')).toBe('1');
  });
});
