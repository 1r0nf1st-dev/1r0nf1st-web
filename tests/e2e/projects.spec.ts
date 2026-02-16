import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  test('loads and displays projects content', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { name: /1r0nf1st/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('shows Goal Tracker and Notes project cards', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { name: /goal tracker/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });

  test('navigates to project sub-routes', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: /goal tracker/i }).first().click();

    await expect(page).toHaveURL(/\/projects\/goal-tracker/);
    await expect(page.getByRole('heading', { name: /goal tracker/i })).toBeVisible();
  });
});
