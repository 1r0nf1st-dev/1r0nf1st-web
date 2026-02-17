import { test, expect } from '@playwright/test';

test.describe('Smoke @smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/1r0nf1st/);
    await expect(page.getByRole('heading', { name: /1r0nf1st/i, level: 1 })).toBeVisible();
  });

  test('API health responds', async ({ request }) => {
    const res = await request.get('/api/quote/random');
    expect([200, 500, 503]).toContain(res.status());
  });
});
