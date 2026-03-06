'use client';

import type { ReactNode } from 'react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { Sidebar } from '../../components/Sidebar';
import { MobileSidebar } from '../../components/Sidebar/MobileSidebar';
import { CorporateNav } from '../../components/corporate/CorporateNav';

export const dynamic = 'force-dynamic';

export default function NotesLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <NotesActionsProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen">
          <CorporateNav />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            {/* MobileSidebar is now hidden since Sidebar is always visible on mobile */}
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </NotesActionsProvider>
  );
}
