import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Increase navigation timeout for CI (Vercel preview deployments can be slow)
    navigationTimeout: process.env.CI ? 60000 : 30000,
    // Use domcontentloaded instead of load for faster navigation in CI
    actionTimeout: process.env.CI ? 30000 : 15000,
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        'x-vercel-set-bypass-cookie': 'true',
      },
    }),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: !process.env.BASE_URL
    ? {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 180000,
      }
    : undefined,
  // Increase test timeout for CI (Vercel preview deployments can be slow)
  timeout: process.env.CI ? 60000 : 15000,
});
