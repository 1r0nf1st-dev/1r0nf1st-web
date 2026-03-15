'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Archive,
  BookOpen,
  Brain,
  FilePlus,
  Library,
  LogOut,
  Search,
  Settings,
  Tag,
  Users,
  LayoutTemplate,
  FileText,
  CalendarDays,
  Cog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { SidebarAccordion } from './SidebarAccordion';
import { SidebarNavItem } from './SidebarNavItem';
import { NotebooksSidebar } from './NotebooksSidebar';
import { TagsList } from './TagsList';
import { SavedSearchesSection } from './SavedSearchesSection';
import { WebClipperSection } from './WebClipperSection';
import { TemplatesAccordion } from './TemplatesAccordion';
import { NotesListSection } from './NotesListSection';
import { SidebarWidgets } from './SidebarWidgets';
import { SidebarProfile } from './SidebarProfile';

export const SidebarNav = ({ sharedUnreadCount }: { sharedUnreadCount?: number }): JSX.Element => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuth();
  const { createNote, openSearch } = useNotesActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sharedAriaLabel =
    typeof sharedUnreadCount === 'number' && sharedUnreadCount > 0
      ? `Shared notes, ${sharedUnreadCount} unread`
      : 'Shared notes';

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1">
        <SidebarNavItem
          label="New Note"
          icon={FilePlus}
          onClick={async () => {
            if (!pathname?.startsWith('/notes')) {
              router.push('/notes?create=1');
              return;
            }
            await createNote();
          }}
        />
        <SidebarAccordion id="templates" label="From Template" icon={LayoutTemplate}>
          <TemplatesAccordion />
        </SidebarAccordion>
        <SidebarNavItem href="/notes/templates" label="Templates" icon={Library} />
      </div>

      <div className="mt-3 space-y-1">
        <SidebarAccordion id="notes" label="All Notes" icon={FileText} defaultOpen>
          <NotesListSection />
        </SidebarAccordion>
        <SidebarAccordion id="notebooks" label="Notebooks" icon={BookOpen} defaultOpen>
          <NotebooksSidebar />
        </SidebarAccordion>
        <SidebarAccordion id="tags" label="Tags" icon={Tag} defaultOpen>
          <TagsList />
        </SidebarAccordion>
        <SidebarAccordion id="archives" label="Archives" icon={Archive}>
          <SidebarNavItem
            href="/archive"
            label="My Notes"
            icon={FileText}
            isActive={pathname === '/archive'}
            forceShowLabel={true}
          />
          <SidebarNavItem
            href="/archive?filter=today"
            label="Today"
            icon={CalendarDays}
            isActive={pathname === '/archive' && searchParams.get('filter') === 'today'}
            forceShowLabel={true}
          />
        </SidebarAccordion>
        <SidebarNavItem
          href="/notes/shared"
          label="Shared"
          icon={Users}
          isActive={pathname === '/notes/shared'}
          badge={sharedUnreadCount}
          ariaLabel={sharedAriaLabel}
        />
        <SidebarNavItem
          href="/projects/second-brain"
          label="Second Brain"
          icon={Brain}
          isActive={pathname === '/projects/second-brain'}
        />
        <SidebarAccordion id="search" label="Search" icon={Search} defaultOpen onClick={openSearch}>
          <SavedSearchesSection />
        </SidebarAccordion>
        <SidebarAccordion id="widgets" label="Widgets" icon={Cog} defaultOpen>
          <SidebarWidgets />
        </SidebarAccordion>
      </div>

      <div className="mt-3">
        <WebClipperSection />
      </div>

      <div className="mt-auto space-y-1 pt-3">
        <SidebarNavItem href="/notes/change-password" label="Settings" icon={Settings} />
        <SidebarNavItem
          label={isLoggingOut ? 'Logging out...' : 'Log Out'}
          icon={LogOut}
          onClick={() => {
            setIsLoggingOut(true);
            Promise.resolve(logout())
              .then(() => {
                router.push('/login');
              })
              .finally(() => setIsLoggingOut(false));
          }}
        />
        <SidebarProfile />
      </div>
    </div>
  );
};
