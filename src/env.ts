/**
 * Environment helper - works with both Vite (tests) and Next.js (app).
 * Next.js uses process.env; Vite uses import.meta.env.
 */
export const isDev =
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean; MODE?: string } }).env?.DEV);

export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }
  const meta = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env : undefined;
  return meta?.[key];
}
