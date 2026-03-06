'use client';

import type { JSX } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CorporateContactPage } from './corporate/CorporateContactPage';
import { DefaultContactPage } from './DefaultContactPage';

export const ContactPageWrapper = (): JSX.Element => {
  const { styleTheme } = useTheme();

  if (styleTheme === 'corporate') {
    return <CorporateContactPage />;
  }

  return <DefaultContactPage />;
};
