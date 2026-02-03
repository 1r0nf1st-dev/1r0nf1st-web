import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwind from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Read version from package.json
function getPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, 'package.json'), 'utf-8'),
    );
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// Generate build number from Git commit SHA (Vercel provides VERCEL_GIT_COMMIT_SHA)
// Falls back to 'dev' in local development or date-based string in other cases
function getBuildNumber(): string {
  // Vercel automatically provides this during builds
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  // Local development
  if (process.env.NODE_ENV === 'development') {
    return 'dev';
  }
  // Fallback: use date as build identifier
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

// Generate full version string: MAJOR.MINOR.PATCH+BUILD
function getFullVersion(): string {
  const version = getPackageVersion();
  const build = getBuildNumber();
  return `${version}+${build}`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  define: {
    __VERSION__: JSON.stringify(getPackageVersion()),
    __BUILD_NUMBER__: JSON.stringify(getBuildNumber()),
    __BUILD_VERSION__: JSON.stringify(getFullVersion()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    open: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
