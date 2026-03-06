'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { AlertProvider } from '../contexts/AlertContext';
import { LiveRegionProvider } from '../contexts/LiveRegionContext';
import { FaviconSwitcher } from '../components/FaviconSwitcher';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { InstallPrompt } from '../components/InstallPrompt';
import { setupGlobalErrorHandlers } from '../utils/errorReporter';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ThemeProvider>
      <FaviconSwitcher />
      <OfflineIndicator />
      <InstallPrompt />
      <AuthProvider>
        <LiveRegionProvider>
          <AlertProvider>{children}</AlertProvider>
        </LiveRegionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
