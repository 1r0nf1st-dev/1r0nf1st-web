import type { JSX } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: string;
  children: JSX.Element;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether to show tooltip on keyboard focus (default: true) */
  showOnFocus?: boolean;
  /** Delay before showing tooltip in milliseconds (default: 0) */
  delay?: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

/**
 * Accessible tooltip component.
 * Shows on hover and keyboard focus, properly announced to screen readers.
 * Rendered via portal to escape overflow containers.
 */
export const Tooltip = ({
  content,
  children,
  position = 'top',
  showOnFocus = true,
  delay = 0,
}: TooltipProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth ?? 100;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 30;
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipHeight - gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = triggerRect.left - tooltipWidth - gap + window.scrollX;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = triggerRect.right + gap + window.scrollX;
        break;
    }

    // Ensure tooltip stays within viewport bounds
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, top);

    setTooltipPos({ top, left });
  }, [position]);

  const showTooltip = (): void => {
    if (delay > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = (): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Recalculate position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone child element to add event handlers and ARIA attributes
  const childElement = children as React.ReactElement<{
    'aria-describedby'?: string;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  }>;
  
  const childWithProps = React.cloneElement(childElement, {
    'aria-describedby': isVisible ? tooltipId.current : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      childElement.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      childElement.props.onMouseLeave?.(e);
    },
    onFocus: showOnFocus
      ? (e: React.FocusEvent) => {
          showTooltip();
          childElement.props.onFocus?.(e);
        }
      : childElement.props.onFocus,
    onBlur: showOnFocus
      ? (e: React.FocusEvent) => {
          hideTooltip();
          childElement.props.onBlur?.(e);
        }
      : childElement.props.onBlur,
  });

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
  };

  return (
    <div ref={triggerRef} className="inline-block">
      {childWithProps}
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId.current}
            style={{
              position: 'absolute',
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
            className="z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-xl shadow-lg whitespace-nowrap pointer-events-none"
            role="tooltip"
            aria-live="polite"
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
              aria-hidden="true"
            />
          </div>,
          document.body
        )}
    </div>
  );
};
