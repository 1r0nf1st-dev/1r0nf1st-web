'use client';

import type { JSX } from 'react';

export interface BrandNameProps {
  /** Optional className for the wrapper span */
  className?: string;
}

/**
 * Renders the brand name as 1r + logo + nf1st for consistent branding across the site.
 * Uses a higher-resolution logo for clarity at inline sizes.
 */
export const BrandName = ({ className = '' }: BrandNameProps): JSX.Element => (
  <span
    className={`inline-flex items-center ${className}`.trim()}
    aria-label="1r0nf1st"
  >
    1r
    <img
      src="/images/1rd0nf2st-lg-tr.png"
      alt=""
      className="h-[1em] w-auto mx-0.5 inline-block align-middle dark:invert-0 invert"
      aria-hidden
    />
    nf1st
  </span>
);
