'use client';

import { useEffect, useState, useCallback } from 'react';
import type { RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element enters the viewport.
 * Respects prefers-reduced-motion for accessibility.
 */
export function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  options: UseIntersectionObserverOptions = {},
): boolean {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const prefersReducedMotion = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      queueMicrotask(() => setIsVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (triggerOnce && hasTriggered) return;
        setIsVisible(true);
        if (triggerOnce) setHasTriggered(true);
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, triggerOnce, hasTriggered, prefersReducedMotion]);

  return isVisible;
}
