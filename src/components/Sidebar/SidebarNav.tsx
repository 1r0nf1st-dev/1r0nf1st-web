'use client';

import type { JSX } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { SavedSearchesSection } from './SavedSearchesSection';
import { SidebarWidgets } from './SidebarWidgets';

function navHrefActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/brain') return pathname.startsWith('/brain');
  if (href === '/notes') return pathname.startsWith('/notes');
  return pathname === href;
}

interface SidebarNavRowProps {
  pathname: string | null;
  href?: string;
  icon: string;
  label: string;
  chevron?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

function SidebarNavRow({
  pathname,
  href,
  icon,
  label,
  chevron,
  badge,
  onClick,
  ariaLabel,
}: SidebarNavRowProps): JSX.Element {
  const { setCollapsed } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const closeOnSelect = (): void => {
    if (isMobile) setCollapsed(true);
  };

  const active = href ? navHrefActive(pathname, href) : false;
  const className = `nav-item${active ? ' active' : ''}`;

  const contents = (
    <>
      <span className="nav-item-icon" aria-hidden>
        {icon}
      </span>
      <span className="nav-item-label">{label}</span>
      {badge ? <span className="nav-item-badge">{badge}</span> : null}
      {chevron ? (
        <span className="nav-item-chevron" aria-hidden>
          ›
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        aria-current={active ? 'page' : undefined}
        onClick={closeOnSelect}
      >
        {contents}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        closeOnSelect();
      }}
      aria-label={ariaLabel ?? label}
    >
      {contents}
    </button>
  );
}

export const SidebarNav = ({ sharedUnreadCount }: { sharedUnreadCount?: number }): JSX.Element => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { createNote, openSearch, openWebClipper } = useNotesActions();

  const sharedAriaLabel =
    typeof sharedUnreadCount === 'number' && sharedUnreadCount > 0
      ? `Shared notes, ${sharedUnreadCount} unread`
      : 'Shared notes';

  return (
    <div>
      <SidebarNavRow
        pathname={pathname}
        icon="+"
        label="New Note"
        onClick={() => {
          if (!pathname?.startsWith('/notes')) {
            router.push('/notes?create=1');
            return;
          }
          void createNote();
        }}
      />

      <SidebarNavRow
        pathname={pathname}
        icon="⊞"
        label="From Template"
        chevron
        onClick={() => router.push('/notes/templates')}
      />
      <SidebarNavRow pathname={pathname} icon="◫" label="Templates" href="/notes/templates" />

      <div className="sidebar-section-label">Library</div>
      <SidebarNavRow
        pathname={pathname}
        icon="≡"
        label="All Notes"
        href="/notes"
        badge={searchParams.get('count') ?? undefined}
      />
      <SidebarNavRow pathname={pathname} icon="⊟" label="Notebooks" chevron href="/notes" />
      <SidebarNavRow pathname={pathname} icon="◇" label="Tags" chevron href="/notes" />
      <SidebarNavRow pathname={pathname} icon="⊡" label="Archives" href="/archive" />
      <SidebarNavRow
        pathname={pathname}
        icon="○"
        label="Shared"
        href="/notes/shared"
        badge={
          typeof sharedUnreadCount === 'number' && sharedUnreadCount > 0
            ? sharedUnreadCount
            : undefined
        }
        ariaLabel={sharedAriaLabel}
      />

      <div className="sidebar-section-label">Saved searches</div>
      <SavedSearchesSection />

      <div className="sidebar-section-label">Intelligence</div>
      <SidebarNavRow
        pathname={pathname}
        icon="◉"
        label="Second Brain"
        href="/projects/second-brain"
      />
      <SidebarNavRow pathname={pathname} icon="⚙" label="Open Brain" href="/brain" />
      <SidebarNavRow pathname={pathname} icon="◈" label="Explore" href="/explore" />
      <SidebarNavRow pathname={pathname} icon="⊙" label="Search" chevron onClick={openSearch} />

      <div className="sidebar-section-label">Tools</div>
      <SidebarNavRow pathname={pathname} icon="⊕" label="Web Clipper" onClick={openWebClipper} />
      <SidebarNavRow pathname={pathname} icon="◎" label="Settings" href="/settings" />

      <div className="sidebar-tools-extras">
        <div className="sidebar-section-label">Widgets</div>
        <SidebarWidgets />
      </div>
    </div>
  );
};
