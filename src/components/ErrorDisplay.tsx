'use client';

import type { JSX } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLiveRegion } from '../contexts/LiveRegionContext';

interface ErrorDisplayProps {
  /** Error message to display */
  error: string | null | undefined;
  /** Optional title/heading for the error */
  title?: string;
  /** Whether to announce error to screen readers (default: true) */
  announce?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant: 'inline' for inline display, 'block' for block display */
  variant?: 'inline' | 'block';
}

/**
 * Unified error display component.
 * Provides consistent error styling and screen reader announcements.
 */
export const ErrorDisplay = ({
  error,
  title,
  announce = true,
  className = '',
  variant = 'block',
}: ErrorDisplayProps): JSX.Element => {
  const { announce: announceToScreenReader } = useLiveRegion();

  // Announce error to screen readers when it appears
  if (error && announce) {
    announceToScreenReader(`Error: ${title ? `${title}. ` : ''}${error}`, 'assertive');
  }

  if (!error) {
    return <></>;
  }

  const baseClasses =
    variant === 'inline'
      ? 'flex items-center gap-2 text-sm text-red-600 dark:text-red-400'
      : 'flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300';

  return (
    <div className={`${baseClasses} ${className}`} role="alert" aria-live="assertive">
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div>{error}</div>
      </div>
    </div>
  );
};
