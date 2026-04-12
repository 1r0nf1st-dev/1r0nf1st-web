'use client';

import type { JSX } from 'react';
import { BRAND_NAME } from '../config';
import { LogoAnimated } from './LogoAnimated';

/** Large cap so `100cqmin` in the 1em slot picks the slot size, not this value. */
const INLINE_MARK_MAX_PX = 512;

export interface BrandNameProps {
  /** Optional className for the wrapper span */
  className?: string;
  /**
   * `orange` (default): CSS-filtered orange mark (white PNG layers), transparent slot — matches nav/footer.
   * `auto`: ink square + screen blend (neutral white mark); use on light layouts if orange clashes.
   */
  markTint?: 'auto' | 'orange';
}

/**
 * Renders the brand name as 1r + animated mark + nf1st for consistent branding across the site.
 */
export const BrandName = ({ className = '', markTint = 'orange' }: BrandNameProps): JSX.Element => (
  <span className={`inline-flex items-center ${className}`.trim()} aria-label={BRAND_NAME}>
    1r
    <span
      data-testid="brand-mark"
      className="mx-0.5 inline-grid h-[1em] w-[1em] shrink-0 place-items-stretch align-middle overflow-hidden"
      aria-hidden
    >
      <LogoAnimated
        aria-hidden
        size={INLINE_MARK_MAX_PX}
        variant={markTint === 'orange' ? 'brand-orange' : 'default'}
      />
    </span>
    nf1st
  </span>
);
