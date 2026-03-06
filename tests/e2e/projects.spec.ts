import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  test('loads and displays projects content', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /1r0nf1st/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i }).first()).toBeVisible();
  });

  test('shows Notes project card', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });

  test('navigates to Notes from projects', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="/notes"]').first().click();

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });

  test('goal-tracker redirects to notes', async ({ page }) => {
    await page.goto('/projects/goal-tracker', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/notes/);
  });
});
