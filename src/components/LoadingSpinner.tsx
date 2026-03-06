'use client';

import type { JSX } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * Loading spinner component.
 * Provides consistent loading indicator with accessibility support.
 */
export const LoadingSpinner = ({
  size = 'md',
  className = '',
  label = 'Loading',
}: LoadingSpinnerProps): JSX.Element => {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
};
