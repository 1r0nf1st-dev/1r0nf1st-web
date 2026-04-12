'use client';

import type { CSSProperties, JSX } from 'react';
import { BRAND_NAME } from '../config';

/** Raster layers live next to other static images under `public/images/`. */
const LOGO_DIR = '/images';

export const LOGO_ANIMATED_PATHS = {
  outerCog: `${LOGO_DIR}/outercog.png`,
  innerCog: `${LOGO_DIR}/innercog.png`,
  innerCircle: `${LOGO_DIR}/innercircle.png`,
  innerMark: `${LOGO_DIR}/inner1r0nf1st.png`,
} as const;

export type LogoAnimatedVariant = 'default' | 'brand-orange';

export interface LogoAnimatedProps {
  /** Applied to the outer host (fills parent when parent has explicit size). */
  className?: string;
  /**
   * Maximum square side in pixels; actual size is `min(this, host width, host height)`.
   */
  size?: number;
  /**
   * `brand-orange`: white raster layers are CSS-filtered to `--color-orange` (no filled orange square;
   * backgrounds stay transparent over the nav). Default keeps ink + screen stack.
   */
  variant?: LogoAnimatedVariant;
  /** Hide decorative images from assistive tech; host still gets an accessible name when false. */
  'aria-hidden'?: boolean;
}

/**
 * Four PNG layers (screen blend on #1a1714): outer cog 12s CW, inner cog 8s CCW, static circle + mark.
 * Place assets under `public/images/` — see `LOGO_ANIMATED_PATHS`.
 *
 * Parent should be a fixed-size box (e.g. `grid h-8 w-8` or `h-[320px] w-[280px]`) so the logo
 * cannot expand the layout; use `overflow-hidden` on the slot if you clip rotation.
 */
export function LogoAnimated({
  className = '',
  size = 280,
  variant = 'default',
  'aria-hidden': ariaHidden,
}: LogoAnimatedProps): JSX.Element {
  const hostClass = [
    'logo-animated-host',
    variant === 'brand-orange' ? 'logo-animated-host--brand-orange' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const innerStyle = {
    '--logo-animated-max': `${size}px`,
  } as CSSProperties;

  const hidden = ariaHidden === true;

  return (
    <div
      className={hostClass}
      role="img"
      aria-label={hidden ? undefined : `${BRAND_NAME} logo`}
      aria-hidden={hidden ? true : undefined}
    >
      <div className="logo-animated" style={innerStyle}>
        <img
          className="logo-animated__layer logo-animated__outer-cog"
          src={LOGO_ANIMATED_PATHS.outerCog}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
        <img
          className="logo-animated__layer logo-animated__inner-cog"
          src={LOGO_ANIMATED_PATHS.innerCog}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
        <img
          className="logo-animated__layer"
          src={LOGO_ANIMATED_PATHS.innerCircle}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
        <img
          className="logo-animated__layer"
          src={LOGO_ANIMATED_PATHS.innerMark}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </div>
    </div>
  );
}
