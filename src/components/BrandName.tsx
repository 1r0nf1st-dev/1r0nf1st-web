'use client';

import type { JSX } from 'react';
import { BRAND_NAME } from '../config';

export interface BrandNameProps {
  /** Optional className for the wrapper span */
  className?: string;
  /**
   * Optional mark tint for the inline logo.
   * - auto: keep existing invert behavior (black on light, white on dark)
   * - orange: tint mark to brand orange (opt-in)
   */
  markTint?: 'auto' | 'orange';
}

/**
 * Renders the brand name as 1r + logo + nf1st for consistent branding across the site.
 * Uses a higher-resolution logo for clarity at inline sizes.
 */
export const BrandName = ({ className = '', markTint = 'auto' }: BrandNameProps): JSX.Element => (
  <span className={`inline-flex items-center ${className}`.trim()} aria-label={BRAND_NAME}>
    1r
    {markTint === 'orange' ? (
      <span
        aria-hidden
        data-testid="brand-mark"
        className="h-[1em] w-[1em] mx-0.5 inline-block align-middle"
        style={{
          backgroundColor: 'var(--color-orange)',
          WebkitMaskImage: 'url(/images/1rd0nf2st-lg-tr.png)',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: 'url(/images/1rd0nf2st-lg-tr.png)',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
        }}
      />
    ) : (
      <img
        src="/images/1rd0nf2st-lg-tr.png"
        alt=""
        data-testid="brand-mark"
        className="h-[1em] w-auto mx-0.5 inline-block align-middle invert dark:invert-0"
        aria-hidden
      />
    )}
    nf1st
  </span>
);
