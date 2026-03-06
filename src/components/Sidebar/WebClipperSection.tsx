'use client';

import type { JSX } from 'react';
import { Scissors } from 'lucide-react';
import { SidebarNavItem } from './SidebarNavItem';
import { useNotesActions } from '../../contexts/NotesActionsContext';

export const WebClipperSection = (): JSX.Element => {
  const { openWebClipper } = useNotesActions();

  return (
    <SidebarNavItem
      label="Web Clipper"
      icon={Scissors}
      onClick={openWebClipper}
    />
  );
};
