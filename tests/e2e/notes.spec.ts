import { test, expect } from '@playwright/test';

test.describe('Notes page', () => {
  test('loads and shows login prompt when unauthenticated', async ({ page }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByRole('heading', { name: /^notes$/i })).toBeVisible();
    await expect(
      page.getByText(/please log in to access your notes/i),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
  });

  test('log in link has returnTo query for notes', async ({ page }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });

    const loginLink = page.getByRole('link', { name: /log in/i });
    await expect(loginLink).toHaveAttribute('href', '/login?returnTo=/notes');
  });

  test('navigates to notes from projects', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="/notes"]').first().click();

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
  });
});
