'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { Sidebar } from '../../components/Sidebar';
import { CorporateNav } from '../../components/corporate/CorporateNav';

export const dynamic = 'force-dynamic';

function SidebarSkeleton(): ReactNode {
  return (
    <div className="hidden md:flex w-16 flex-shrink-0 flex-col bg-muted/20 animate-pulse" />
  );
}

export default function NotesLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading...</div>}>
      <NotesActionsProvider>
        <SidebarProvider>
          <div className="flex flex-col min-h-screen">
            <CorporateNav />
            <div className="flex flex-1 min-h-0">
              <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar />
              </Suspense>
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </NotesActionsProvider>
    </Suspense>
  );
}
