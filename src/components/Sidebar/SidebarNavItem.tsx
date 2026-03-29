'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useId } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { SidebarNavItemProps } from './types';

export const SidebarNavItem = ({
  href,
  label,
  icon: Icon,
  isActive = false,
  onClick,
  badge,
  ariaLabel,
  forceShowLabel = false,
}: SidebarNavItemProps): JSX.Element => {
  const { isCollapsed, setCollapsed } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const tooltipId = useId();

  const closeOnSelect = (): void => {
    if (isMobile) setCollapsed(true);
  };
  const displayBadge =
    typeof badge === 'number' && badge > 0 ? (badge > 99 ? '99+' : String(badge)) : null;

  const shouldShowLabel = !isCollapsed || forceShowLabel;
  const iconOnly = isCollapsed && !forceShowLabel;

  const content = (
    <>
      <span className="nav-item-icon nav-item-icon--svg" aria-hidden>
        <Icon />
      </span>
      {shouldShowLabel ? <span className="nav-item-label">{label}</span> : null}
      {displayBadge && shouldShowLabel ? (
        <span className="nav-item-badge shrink-0">{displayBadge}</span>
      ) : null}
      {iconOnly ? (
        <span id={tooltipId} role="tooltip" className="sidebar-flyout-tooltip">
          {label}
        </span>
      ) : null}
    </>
  );

  const className = [
    'nav-item',
    'group',
    'relative',
    iconOnly ? 'sidebar-nav-item--icon-only' : '',
    isActive ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        aria-current={isActive ? 'page' : undefined}
        aria-label={ariaLabel ?? label}
        aria-describedby={iconOnly ? tooltipId : undefined}
        onClick={closeOnSelect}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        closeOnSelect();
      }}
      className={className}
      aria-label={ariaLabel ?? label}
      aria-describedby={iconOnly ? tooltipId : undefined}
    >
      {content}
    </button>
  );
};
