'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { Sidebar } from '../../components/Sidebar';
import { AppShell } from '../../components/AppShell';

export const dynamic = 'force-dynamic';

function SidebarSkeleton(): ReactNode {
  return <div className="hidden md:flex w-16 flex-shrink-0 flex-col bg-muted/20 animate-pulse" />;
}

/** Routes that show the notes/tools sidebar. Other routes get full-width main. */
function useShowSidebar(): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  if (pathname.startsWith('/notes')) return true;
  if (pathname === '/projects/second-brain') return true;
  if (pathname.startsWith('/brain')) return true;
  if (pathname === '/explore') return true;
  return false;
}

/**
 * Shared app shell for Notes and Projects.
 * Sidebar visible only on /notes and /projects/second-brain.
 * Full-width main on projects list and other project pages.
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  const showSidebar = useShowSidebar();

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading...</div>}>
      <NotesActionsProvider>
        <SidebarProvider>
          <AppShell
            sidebar={
              showSidebar ? (
                <Suspense fallback={<SidebarSkeleton />}>
                  <Sidebar />
                </Suspense>
              ) : undefined
            }
          >
            {children}
          </AppShell>
        </SidebarProvider>
      </NotesActionsProvider>
    </Suspense>
  );
}
