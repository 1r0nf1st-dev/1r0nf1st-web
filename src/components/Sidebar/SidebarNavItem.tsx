'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useId } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
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
  const { isCollapsed } = useSidebar();
  const tooltipId = useId();
  const displayBadge =
    typeof badge === 'number' && badge > 0 ? (badge > 99 ? '99+' : String(badge)) : null;
  
  // Show label if not collapsed OR if forceShowLabel is true (for mobile popovers)
  const shouldShowLabel = !isCollapsed || forceShowLabel;

  const content = (
    <>
      <span className="relative inline-flex">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {displayBadge ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-white">
            {displayBadge}
          </span>
        ) : null}
      </span>
      {shouldShowLabel ? <span className="truncate">{label}</span> : null}
      {isCollapsed && !forceShowLabel ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-xl bg-surface px-2 py-1 text-xs text-foreground shadow group-hover:block group-focus-visible:block"
        >
          {label}
        </span>
      ) : null}
    </>
  );

  const className = `group relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors ${
    isCollapsed && !forceShowLabel ? 'justify-center' : ''
  } ${
    isActive
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-foreground hover:bg-primary/5 dark:hover:bg-primary/10'
  }`;

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        aria-current={isActive ? 'page' : undefined}
        aria-label={ariaLabel ?? label}
        aria-describedby={isCollapsed && !forceShowLabel ? tooltipId : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel ?? label}
      aria-describedby={isCollapsed && !forceShowLabel ? tooltipId : undefined}
    >
      {content}
    </button>
  );
};
