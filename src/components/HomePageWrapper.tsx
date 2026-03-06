'use client';

import type { JSX } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { HomePage } from '../views/HomePage';
import { CorporateLandingPage } from './corporate/CorporateLandingPage';

export const HomePageWrapper = (): JSX.Element => {
  const { styleTheme } = useTheme();

  if (styleTheme === 'corporate') {
    return <CorporateLandingPage />;
  }

  return <HomePage />;
};
