import { test, expect } from '@playwright/test';

test.describe('Corporate theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', JSON.stringify({ colorMode: 'dark' }));
    });
  });

  test('homepage shows corporate layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/1r0nf1st/);
    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /02 project/i })).toBeVisible();
  });

  test('projects listing shows corporate layout', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /1r0nf1st/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
  });

  test('project sub-page shows corporate nav and footer', async ({ page }) => {
    await page.goto('/projects/health-tracker', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /health|strava/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to projects/i })).toBeVisible();
  });

  test('login page shows corporate layout', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /login|create account/i })).toBeVisible();
  });

  test('forgot password page shows corporate layout', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  });

  test('change password page shows corporate layout', async ({ page }) => {
    await page.goto('/change-password', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /set new password|change password/i }),
    ).toBeVisible();
  });

  test('corporate theme persists across navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /02 project/i })).toBeVisible();

    await page.getByRole('link', { name: /02 project/i }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();

    await page.locator('a[href="/notes"]').first().click();
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByRole('link', { name: /01 about/i })).toBeVisible();
  });
});
