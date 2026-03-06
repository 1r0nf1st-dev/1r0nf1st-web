import type { NextConfig } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import withPWAInit from '@ducanh2912/next-pwa';

// Build version for footer display (Vercel provides VERCEL_GIT_COMMIT_SHA)
function getBuildVersion(): string {
  let version = '0.1.0';
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    version = pkg.version || version;
  } catch {
    // ignore
  }
  const build = process.env.VERCEL_GIT_COMMIT_SHA
    ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    : process.env.NODE_ENV === 'development'
      ? 'dev'
      : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${version}+${build}`;
}

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  env: {
    NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
    // Expose Supabase public vars to the browser so the client SDK can call
    // Supabase auth directly. The anon key is designed to be public.
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
  },
  async rewrites() {
    // In dev, proxy /api to Express server (localhost:3001)
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    }
    return [];
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  disable:
    process.env.NODE_ENV === 'development' ||
    process.env.DISABLE_PWA === '1',
  cacheOnFrontEndNav: true,
  fallbacks: { document: '/offline' },
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/[^/]*\/api\/notes(\/.*)?(\?.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-notes-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

export default withPWA(nextConfig);
