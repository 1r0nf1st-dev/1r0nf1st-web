'use client';

import type { ReactNode } from 'react';
import type { JSX } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

interface LiveRegionContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  clear: () => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | undefined>(undefined);

interface LiveRegionProviderProps {
  children: ReactNode;
}

/**
 * Context provider for managing live region announcements for screen readers.
 * Provides a centralized way to announce dynamic content updates.
 */
export const LiveRegionProvider = ({ children }: LiveRegionProviderProps): JSX.Element => {
  const [message, setMessage] = useState<string>('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((msg: string, pol: 'polite' | 'assertive' = 'polite') => {
    setMessage('');
    // Use setTimeout to ensure the message is cleared before setting a new one
    // This ensures screen readers will announce the new message
    setTimeout(() => {
      setPoliteness(pol);
      setMessage(msg);
    }, 100);
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce, clear }}>
      {children}
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="absolute left-[-9999px] w-[1px] h-[1px] overflow-hidden"
        aria-relevant="additions text"
      >
        {message}
      </div>
    </LiveRegionContext.Provider>
  );
};

/**
 * Hook to access live region context.
 * @throws Error if used outside LiveRegionProvider
 */
export const useLiveRegion = (): LiveRegionContextValue => {
  const context = useContext(LiveRegionContext);
  if (context === undefined) {
    throw new Error('useLiveRegion must be used within a LiveRegionProvider');
  }
  return context;
};
