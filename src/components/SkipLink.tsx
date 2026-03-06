'use client';

import type { JSX } from 'react';

interface SkipLinkProps {
  /** ID of the element to skip to (default: 'main-content') */
  targetId?: string;
  /** Text to display in the skip link (default: 'Skip to main content') */
  label?: string;
}

/**
 * Skip link component for keyboard navigation accessibility.
 * Allows users to skip navigation and jump directly to main content.
 * Only visible when focused via keyboard navigation.
 */
export const SkipLink = ({ targetId = 'main-content', label = 'Skip to main content' }: SkipLinkProps): JSX.Element => {
  return (
    <a
      href={`#${targetId}`}
      className="absolute left-[-9999px] w-[1px] h-[1px] overflow-hidden focus:left-4 focus:top-4 focus:z-[100] focus:w-auto focus:h-auto focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Remove focus after scroll to prevent focus outline on main element
          setTimeout(() => {
            target.blur();
          }, 1000);
        }
      }}
    >
      {label}
    </a>
  );
};
