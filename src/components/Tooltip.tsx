import type { JSX } from 'react';
import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: string;
  children: JSX.Element;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether to show tooltip on keyboard focus (default: true) */
  showOnFocus?: boolean;
  /** Delay before showing tooltip in milliseconds (default: 0) */
  delay?: number;
}

/**
 * Accessible tooltip component.
 * Shows on hover and keyboard focus, properly announced to screen readers.
 */
export const Tooltip = ({
  content,
  children,
  position = 'top',
  showOnFocus = true,
  delay = 0,
}: TooltipProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

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

  return (
    <div className="relative inline-block">
      {childWithProps}
      {isVisible && (
        <div
          id={tooltipId.current}
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-xl shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
          role="tooltip"
          aria-live="polite"
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700'
                : position === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700'
                  : position === 'left'
                    ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700'
                    : 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700'
            }`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};
