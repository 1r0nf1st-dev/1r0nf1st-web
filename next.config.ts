import type { NextConfig } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

// Build version for footer display (Vercel provides VERCEL_GIT_COMMIT_SHA)
function getBuildVersion(): string {
  let version = '0.1.0';
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
    );
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

export default nextConfig;
