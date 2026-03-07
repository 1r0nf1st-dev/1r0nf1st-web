'use client';

import type { JSX } from 'react';
import { createContext, useCallback, useContext, useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import type { SidebarAccordionProps } from './types';

/** Context for closing the accordion popover from children (e.g. when selecting a note) */
const SidebarAccordionCloseContext = createContext<(() => void) | null>(null);

export const useSidebarAccordionClose = (): (() => void) | null =>
  useContext(SidebarAccordionCloseContext);

// Track which accordion is open on mobile to prevent multiple popovers
let openAccordionId: string | null = null;
const accordionListeners = new Set<(id: string | null) => void>();

function notifyAccordionChange(id: string | null) {
  openAccordionId = id;
  accordionListeners.forEach((listener) => listener(id));
}

export const SidebarAccordion = ({
  id,
  label,
  icon: Icon,
  defaultOpen = false,
  children,
  onClick,
}: SidebarAccordionProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [popoverTop, setPopoverTop] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const panelId = `${id}-panel`;
  const tooltipId = useId();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize open state - only defaultOpen if not mobile or not collapsed
  useEffect(() => {
    if (defaultOpen && !isMobile && !isCollapsed) {
      setIsOpen(true);
    }
  }, [defaultOpen, isMobile, isCollapsed]);

  // Listen for other accordions opening/closing (mobile only)
  useEffect(() => {
    if (!isMobile || !isCollapsed) return;

    const handleAccordionChange = (openId: string | null) => {
      if (openId !== id && isOpen) {
        setIsOpen(false);
      }
    };

    accordionListeners.add(handleAccordionChange);
    return () => {
      accordionListeners.delete(handleAccordionChange);
    };
  }, [isMobile, isCollapsed, id, isOpen]);

  // Close popover when sidebar state changes or route changes
  useEffect(() => {
    if (!isMobile || !isCollapsed) {
      setIsOpen(false);
      if (openAccordionId === id) {
        notifyAccordionChange(null);
      }
    }
  }, [isMobile, isCollapsed, id]);

  // Close popover on route change
  useEffect(() => {
    setIsOpen(false);
    if (openAccordionId === id) {
      notifyAccordionChange(null);
    }
  }, [pathname, id]);

  // Close popover when clicking outside (mobile only)
  useEffect(() => {
    if (!isMobile || !isCollapsed || !isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      
      // Get the popover panel element
      const panelElement = document.getElementById(panelId);
      
      // Check if click is inside the popover panel or its children
      if (panelElement && panelElement.contains(target)) {
        // Click is inside popover - don't close, let the button/link handle it
        return;
      }
      
      // Check if click is on the sidebar button that opened this popover
      if (containerRef.current && containerRef.current.contains(target)) {
        // Click is on the button - don't close (button handles its own toggle)
        return;
      }
      
      // Click is outside both - close the popover
      setIsOpen(false);
      notifyAccordionChange(null);
    };

    // Use bubble phase (not capture) so clicks inside popover can fire first
    // This ensures button/link onClick handlers execute before this handler
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isCollapsed, isOpen, panelId]);

  const closePopover = useCallback(() => {
    if (isCollapsed && isMobile) {
      setIsOpen(false);
      notifyAccordionChange(null);
    }
  }, [isCollapsed, isMobile]);

  const showTooltip = isCollapsed && !isMobile;

  const panelContent = (
    <SidebarAccordionCloseContext.Provider value={closePopover}>
      {children}
    </SidebarAccordionCloseContext.Provider>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`group flex w-full min-h-[44px] items-center rounded-xl px-2 py-2 text-sm font-medium hover:bg-primary/5 dark:hover:bg-primary/10 touch-manipulation ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={showTooltip ? tooltipId : undefined}
        onClick={() => {
          // On mobile (when collapsed), clicking toggles accordion and shows popover
          // On desktop, normal accordion behavior (expands sidebar if collapsed)
          if (isCollapsed) {
            if (!isMobile) {
              // Desktop: expand sidebar when clicking collapsed accordion
              setCollapsed(false);
              return;
            }
            // Mobile: toggle accordion, content shows in popover
            // Close other accordions when opening this one
            const newState = !isOpen;
            if (newState && buttonRef.current) {
              // Calculate popover position relative to button
              const rect = buttonRef.current.getBoundingClientRect();
              setPopoverTop(rect.top - 73); // 73px is header height
            }
            setIsOpen(newState);
            notifyAccordionChange(newState ? id : null);
            return;
          }
          if (onClick) {
            onClick();
            setIsOpen((prev) => !prev);
            return;
          }
          setIsOpen((prev) => !prev);
        }}
      >
        <span className="relative flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {!isCollapsed ? <span className="truncate">{label}</span> : null}
          {showTooltip ? (
            <span
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 rounded-xl bg-surface px-2 py-1 text-xs text-foreground shadow group-hover:block group-focus-visible:block whitespace-nowrap"
            >
              {label}
            </span>
          ) : null}
        </span>
        {!isCollapsed ? (
          isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          )
        ) : null}
      </button>
      {/* Show content when open */}
      {isOpen ? (
        isCollapsed && isMobile && typeof document !== 'undefined' ? (
          createPortal(
            <>
              {/* Backdrop - pointer-events-none so touches pass through to panel or main */}
              <div
                className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none"
                aria-hidden="true"
              />
              <div
                id={panelId}
                role="region"
                aria-label={label}
                className="fixed left-[64px] z-[9999] space-y-1 bg-white/95 dark:bg-surface/95 backdrop-blur-md rounded-xl shadow-xl p-3 min-w-[240px] max-w-[280px] max-h-[60vh] overflow-y-auto border border-primary/10 dark:border-border touch-manipulation"
                style={
                  popoverTop !== undefined ? { top: `${popoverTop}px` } : undefined
                }
              >
                {panelContent}
              </div>
            </>,
            document.body,
          )
        ) : (
          <div
            id={panelId}
            role="region"
            className={`space-y-1 ${isCollapsed ? 'hidden' : 'mt-1 pl-3'}`}
          >
            {panelContent}
          </div>
        )
      ) : null}
    </div>
  );
};
