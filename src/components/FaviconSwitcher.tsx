'use client';

import { useEffect } from 'react';

const FAVICON = '/favicon.ico';
const CACHE_BUST = '?v=5';

/**
 * Ensures the document favicon is set.
 * Call this from within ThemeProvider.
 */
export function FaviconSwitcher(): null {
  useEffect(() => {
    const href = `${FAVICON}${CACHE_BUST}`;

    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]'
    );

    if (links.length > 0) {
      links.forEach((link) => {
        link.href = href;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  return null;
}
