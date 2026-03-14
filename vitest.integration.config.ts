import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Integration tests that hit a real database.
 * Run with: pnpm test:integration
 * Requires: DATABASE_URL or SUPABASE_DB_URL in .env
 * Tests skip when database is not configured.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
