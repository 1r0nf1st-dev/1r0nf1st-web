import { expect, test } from '@playwright/test';

test.describe('Sidebar desktop', () => {
  test('renders notes sidebar navigation on desktop', async ({ page }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByLabel('Notes sidebar navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shared notes' })).toBeVisible();
  });
});
