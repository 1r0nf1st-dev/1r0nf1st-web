'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface UseMobileMenuReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Hook for managing mobile menu state and behavior.
 * Handles keyboard navigation, focus management, and body scroll lock.
 */
export const useMobileMenu = (): UseMobileMenuReturn => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const open = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const toggle = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close menu on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const panel = menuRef.current;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const timeoutId = window.setTimeout(() => {
      first?.focus();
    }, 350);
    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    menuRef,
    triggerRef,
  };
};
