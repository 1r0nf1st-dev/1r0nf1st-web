'use client';

import type { JSX } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CorporateAboutPage } from './corporate/CorporateAboutPage';
import { DefaultAboutPage } from './DefaultAboutPage';

export const AboutPageWrapper = (): JSX.Element => {
  const { styleTheme } = useTheme();

  if (styleTheme === 'corporate') {
    return <CorporateAboutPage />;
  }

  return <DefaultAboutPage />;
};
