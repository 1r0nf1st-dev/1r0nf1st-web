'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { Skeleton } from './Skeleton';

interface SkeletonLoaderProps {
  /** Number of skeleton lines to show */
  lines?: number;
  /** Whether to show a skeleton for a title */
  showTitle?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Children to render when loading is false */
  children?: ReactNode;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Skeleton loader component for list views and content areas.
 * Shows skeleton placeholders while content is loading.
 */
export const SkeletonLoader = ({
  lines = 3,
  showTitle = false,
  className = '',
  children,
  isLoading,
}: SkeletonLoaderProps): JSX.Element => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={className} aria-busy="true" aria-label="Loading content">
      {showTitle && <Skeleton className="h-6 w-3/4 mb-4" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 w-full ${i < lines - 1 ? 'mb-2' : ''}`} />
      ))}
    </div>
  );
};
