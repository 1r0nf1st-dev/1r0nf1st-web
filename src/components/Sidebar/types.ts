import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SidebarNavItemProps {
  href?: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
  ariaLabel?: string;
  /** Force label to be visible even when sidebar is collapsed (useful for mobile popovers) */
  forceShowLabel?: boolean;
}

export interface SidebarAccordionProps {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export interface Notebook {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
}
