'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const STORAGE_KEY = 'pwa-install-dismissed';

export function InstallPrompt(): JSX.Element {
  const isOnline = useOnlineStatus();
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async (): Promise<void> => {
    if (!installPrompt) return;
    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
        setInstallPrompt(null);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = (): void => {
    setCanInstall(false);
    setInstallPrompt(null);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  if (!canInstall || !isOnline) return <></>;

  return (
    <div
      role="dialog"
      aria-label="Install app"
      className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Install this app for quick access and offline use.
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {isInstalling ? 'Installing…' : 'Install'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded-xl px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
