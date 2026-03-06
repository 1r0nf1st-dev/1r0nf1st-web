'use client';

import type { JSX } from 'react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import type { SidebarAccordionProps } from './types';

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
      const target = (event instanceof TouchEvent 
        ? (event.touches?.[0]?.target || event.target)
        : (event as MouseEvent).target) as Node;
      
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

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`flex w-full items-center rounded-xl px-2 py-2 text-sm font-medium hover:bg-primary/5 dark:hover:bg-primary/10 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
        aria-expanded={isOpen}
        aria-controls={panelId}
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
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {!isCollapsed ? <span className="truncate">{label}</span> : null}
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
        <>
          {/* Backdrop for mobile popover */}
          {isCollapsed && isMobile && (
            <div
              className="fixed inset-0 z-[99] bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                notifyAccordionChange(null);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                notifyAccordionChange(null);
              }}
              aria-hidden="true"
            />
          )}
          <div 
            id={panelId} 
            role="region" 
            className={`space-y-1 ${
              isCollapsed && isMobile
                ? 'fixed left-[64px] z-[100] bg-white/95 dark:bg-surface/95 backdrop-blur-md rounded-xl shadow-xl p-3 min-w-[240px] max-w-[280px] max-h-[60vh] overflow-y-auto border border-primary/10 dark:border-border pointer-events-auto'
                : isCollapsed
                ? 'hidden'
                : 'mt-1 pl-3'
            }`}
            style={
              isCollapsed && isMobile && popoverTop !== undefined
                ? {
                    top: `${popoverTop}px`,
                  }
                : undefined
            }
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
};
