import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and displays main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/1r0nf1st/);
    await expect(page.getByRole('heading', { name: /1r0nf1st/i, level: 1 })).toBeVisible();
  });

  test('shows hero, footer, and projects link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /view projects/i })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('has About and Tech Stack info cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /tech stack/i })).toBeVisible();
  });
});
