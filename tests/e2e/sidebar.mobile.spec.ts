import { expect, test } from '@playwright/test';

test.describe('Sidebar mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows either login gate or collapsed sidebar on mobile', async ({ page }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('heading', { name: /^login$/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByLabel('Notes sidebar navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  });
});
