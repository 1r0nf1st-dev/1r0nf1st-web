'use client';

import type { JSX } from 'react';

const VIDEO_SRC = '/ai-artwork.mp4';

export interface RobotWalkRaiseAnimationProps {
  /** Optional CSS class for the root wrapper. */
  className?: string;
  /** Width in pixels (default 140). */
  width?: number;
  /** Height in pixels (optional; video maintains aspect ratio when only width is given). */
  height?: number;
  /** If true, loop the video; otherwise play once. */
  loop?: boolean;
}

export const RobotWalkRaiseAnimation = ({
  className = '',
  width = 140,
  height,
  loop = false,
}: RobotWalkRaiseAnimationProps): JSX.Element => {
  return (
    <div
      className={className.trim()}
      style={{ width, height: height ?? 'auto', maxWidth: '100%' }}
      role="img"
      aria-label="1r0nf1st AI artwork animation"
    >
      <video
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        loop={loop}
        className="block w-full h-auto rounded-lg object-cover"
        aria-hidden
      />
    </div>
  );
};
