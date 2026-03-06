'use client';

import type { JSX } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ProjectsPage } from './ProjectsPage';
import { CorporateProjectsPage } from './corporate/CorporateProjectsPage';

export const ProjectsPageWrapper = (): JSX.Element => {
  const { styleTheme } = useTheme();

  if (styleTheme === 'corporate') {
    return <CorporateProjectsPage />;
  }

  return <ProjectsPage />;
};
