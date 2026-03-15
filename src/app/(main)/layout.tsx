'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { Sidebar } from '../../components/Sidebar';
import { CorporateNav } from '../../components/corporate/CorporateNav';
import { CorporateFooter } from '../../components/corporate/CorporateFooter';

export const dynamic = 'force-dynamic';

function SidebarSkeleton(): ReactNode {
  return (
    <div className="hidden md:flex w-16 flex-shrink-0 flex-col bg-muted/20 animate-pulse" />
  );
}

/** Routes that show the notes/tools sidebar. Other routes get full-width main. */
function useShowSidebar(): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  if (pathname.startsWith('/notes')) return true;
  if (pathname === '/projects/second-brain') return true;
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
          <div className="flex flex-col min-h-screen min-w-0 overflow-x-hidden">
            <CorporateNav />
            <div className="flex flex-1 min-h-0">
              {showSidebar && (
                <Suspense fallback={<SidebarSkeleton />}>
                  <Sidebar />
                </Suspense>
              )}
              <main className="min-w-0 flex-1">{children}</main>
            </div>
            <CorporateFooter />
          </div>
        </SidebarProvider>
      </NotesActionsProvider>
    </Suspense>
  );
}
