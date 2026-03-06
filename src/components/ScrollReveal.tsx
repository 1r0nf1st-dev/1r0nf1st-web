'use client';

import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps content and applies fade-in when scrolled into view.
 * Respects prefers-reduced-motion (content shows immediately).
 */
export function ScrollReveal({ children, className = '' }: ScrollRevealProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}
