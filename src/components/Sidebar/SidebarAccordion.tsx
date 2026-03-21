'use client';

import type { JSX } from 'react';
import { createContext, useCallback, useContext, useState, useEffect, useRef, useId } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import type { SidebarAccordionProps } from './types';

/** Context for closing the accordion popover from children (e.g. when selecting a note) */
const SidebarAccordionCloseContext = createContext<(() => void) | null>(null);

export const useSidebarAccordionClose = (): (() => void) | null =>
  useContext(SidebarAccordionCloseContext);

// Track which accordion is open on mobile to avoid stacking multiple inline panels
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Listen for other accordions opening/closing when multiple can be open (mobile inline panels)
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

  // Mobile drawer + collapsed context: close inline panel when tapping main content / overlay
  useEffect(() => {
    if (!isMobile || !isCollapsed || !isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      const panelElement = document.getElementById(panelId);

      if (panelElement?.contains(target)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
      notifyAccordionChange(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isCollapsed, isOpen, panelId]);

  const closePopover = useCallback(() => {
    setIsOpen(false);
    notifyAccordionChange(null);
  }, []);

  const showTooltip = isCollapsed && !isMobile;

  const panelContent = (
    <SidebarAccordionCloseContext.Provider value={closePopover}>
      {children}
    </SidebarAccordionCloseContext.Provider>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={`group flex w-full min-h-[44px] items-center rounded-xl px-2 py-2 text-sm font-medium hover:bg-primary/5 dark:hover:bg-primary/10 touch-manipulation ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={showTooltip ? tooltipId : undefined}
        onClick={() => {
          // Desktop collapsed rail: first click expands the sidebar (popover was unusably narrow).
          // Mobile drawer: sidebar stays "collapsed" in context but drawer is wide — expand inline.
          if (isCollapsed) {
            if (!isMobile) {
              setCollapsed(false);
              return;
            }
            const newState = !isOpen;
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
      {/* Inline panel only: portaled flyouts at z-9999 sat over notes/templates on mobile. */}
      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-label={label}
          className={`space-y-1 ${isCollapsed && !isMobile ? 'hidden' : 'mt-1 pl-3'}`}
        >
          {panelContent}
        </div>
      ) : null}
    </div>
  );
};
