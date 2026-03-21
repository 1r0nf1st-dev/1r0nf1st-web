'use client';

import type { JSX } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { SavedSearchesSection } from './SavedSearchesSection';
import { WebClipperSection } from './WebClipperSection';
import { TemplatesAccordion } from './TemplatesAccordion';
import { SidebarWidgets } from './SidebarWidgets';

export const SidebarNav = ({ sharedUnreadCount }: { sharedUnreadCount?: number }): JSX.Element => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { createNote, openSearch, openWebClipper, toggleWidget } = useNotesActions();

  const sharedAriaLabel =
    typeof sharedUnreadCount === 'number' && sharedUnreadCount > 0
      ? `Shared notes, ${sharedUnreadCount} unread`
      : 'Shared notes';

  const isActive = (href: string): boolean => {
    if (!pathname) return false;
    if (href === '/brain') return pathname.startsWith('/brain');
    if (href === '/notes') return pathname.startsWith('/notes');
    return pathname === href;
  };

  const Item = ({
    href,
    icon,
    label,
    chevron,
    badge,
    onClick,
    ariaLabel,
  }: {
    href?: string;
    icon: string;
    label: string;
    chevron?: boolean;
    badge?: ReactNode;
    onClick?: () => void;
    ariaLabel?: string;
  }): JSX.Element => {
    const active = href ? isActive(href) : false;
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
        <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
          {contents}
        </Link>
      );
    }

    return (
      <button type="button" className={className} onClick={onClick} aria-label={ariaLabel ?? label}>
        {contents}
      </button>
    );
  };

  return (
    <div>
      <Item
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

      <Item
        icon="⊞"
        label="From Template"
        chevron
        onClick={() => router.push('/notes/templates')}
      />
      <Item icon="◫" label="Templates" href="/notes/templates" />

      <div className="sidebar-section-label">Library</div>
      <Item
        icon="≡"
        label="All Notes"
        href="/notes"
        badge={searchParams.get('count') ?? undefined}
      />
      <Item icon="⊟" label="Notebooks" chevron href="/notes" />
      <Item icon="◇" label="Tags" chevron href="/notes" />
      <Item icon="⊡" label="Archives" href="/archive" />
      <Item
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

      <div className="sidebar-section-label">Intelligence</div>
      <Item icon="◉" label="Second Brain" href="/projects/second-brain" />
      <Item icon="⚙" label="Open Brain" href="/brain" />
      <Item icon="◈" label="Explore" href="/explore" />
      <Item icon="⊙" label="Search" chevron onClick={openSearch} />

      <div className="sidebar-section-label">Tools</div>
      <Item
        icon="▣"
        label="Widgets"
        chevron
        onClick={() => {
          toggleWidget('tasks');
        }}
      />
      <Item icon="⊕" label="Web Clipper" onClick={openWebClipper} />
      <Item icon="◎" label="Settings" href="/settings" />

      <div className="mt-3">
        <SavedSearchesSection />
        <SidebarWidgets />
        <WebClipperSection />
        <TemplatesAccordion />
      </div>
    </div>
  );
};
