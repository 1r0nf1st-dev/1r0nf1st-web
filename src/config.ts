export interface EnvConfig {
  apiBaseUrl: string;
}

export const env: EnvConfig = {
  // Use relative URL (same origin); Next.js dev server proxies /api to Express
  apiBaseUrl: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || '',
};

/** API base URL for fetch - works with both Vite and Next.js. */
export function getApiBase(): string {
  const raw =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL?.trim());
  if (!raw) return '/api';
  if (raw.startsWith('http')) {
    const base = raw.endsWith('/') ? raw.slice(0, -1) : raw;
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
