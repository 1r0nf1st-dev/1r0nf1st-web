import { test, expect } from '@playwright/test';

test.describe('Open Brain page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/brain', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('returnTo=');
    expect(page.url()).toContain('/brain');
  });

  test('login link preserves returnTo for brain', async ({ page }) => {
    await page.goto('/brain', { waitUntil: 'domcontentloaded' });

    const loginLink = page.getByRole('link', { name: /log in/i });
    await expect(loginLink).toHaveAttribute('href', /\/login\?returnTo=.*brain/);
  });

  test('open brain nav link goes to brain page', async ({ page }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });

    const brainLink = page.getByRole('link', { name: /open brain/i });
    await expect(brainLink).toBeVisible();
    await brainLink.click();

    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('returnTo=');
  });
});

test.describe('Public brain by slug', () => {
  test('redirects to login when unauthenticated (admin-only)', async ({ page }) => {
    await page.goto('/brain/some-slug', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('returnTo=');
    expect(page.url()).toContain('/brain');
  });
});

test.describe('Explore page', () => {
  test('shows explore heading and login prompt when unauthenticated', async ({ page }) => {
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByRole('heading', { name: /explore brains/i })).toBeVisible();
    await expect(page.getByText(/log in.*to search across public brains/i)).toBeVisible();
  });

  test('login link preserves returnTo for explore', async ({ page }) => {
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    const loginLink = page.getByRole('link', { name: /log in/i });
    await expect(loginLink).toHaveAttribute('href', /\/login\?returnTo=.*%2Fexplore/);
  });
});
