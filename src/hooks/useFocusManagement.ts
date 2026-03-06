'use client';

import { useEffect, useRef, RefObject } from 'react';

interface UseFocusManagementOptions {
  /** Whether the modal/dialog is open */
  isOpen: boolean;
  /** Ref to the modal container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Ref to the element that triggered the modal (for returning focus) */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Whether to trap focus within the modal */
  trapFocus?: boolean;
  /** Whether to focus the first element on open */
  autoFocus?: boolean;
}

/**
 * Hook for managing focus in modals and dialogs.
 * Handles focus trapping, initial focus, and returning focus to trigger.
 */
export const useFocusManagement = ({
  isOpen,
  containerRef,
  triggerRef,
  trapFocus = true,
  autoFocus = true,
}: UseFocusManagementOptions): void => {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when opening
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;

    // Focus first focusable element
    if (autoFocus) {
      const focusables = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusables[0];
      if (firstFocusable) {
        // Use setTimeout to ensure the element is rendered
        const timeoutId = setTimeout(() => {
          firstFocusable.focus();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen, containerRef, autoFocus]);

  // Return focus to trigger when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      const elementToFocus = triggerRef?.current || previousActiveElementRef.current;
      // Use setTimeout to ensure modal is fully closed
      const timeoutId = setTimeout(() => {
        elementToFocus?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, triggerRef]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusables = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, trapFocus, containerRef]);
};
