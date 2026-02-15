import type { JSX } from 'react';

export interface SkeletonProps {
  className?: string;
  /** Inline styles for width/height when needed */
  style?: React.CSSProperties;
}

/** Animated skeleton placeholder. Use instead of "Loading..." text. */
export const Skeleton = ({
  className = '',
  style,
}: SkeletonProps): JSX.Element => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse rounded-md bg-muted/40 dark:bg-muted/30 ${className}`.trim()}
      style={style}
    />
  );
};
