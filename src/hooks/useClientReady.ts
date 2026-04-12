import { useSyncExternalStore } from 'react';

const emptySubscribe = (): (() => void) => (): void => undefined;

/**
 * `false` during SSR and the browser’s first hydrated paint; `true` on subsequent client renders.
 * Defer session- or browser-dependent UI so the first client output matches the server HTML.
 */
export function useClientReady(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
