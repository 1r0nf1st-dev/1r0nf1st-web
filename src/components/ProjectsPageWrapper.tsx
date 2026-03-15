'use client';

import type { JSX } from 'react';
import { CorporateProjectsPage } from './corporate/CorporateProjectsPage';

export const ProjectsPageWrapper = (): JSX.Element => (
  <CorporateProjectsPage embedInLayout />
);
