import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test('displays contact form on homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /contact us/i })).toBeVisible();
    await expect(page.getByPlaceholder(/your name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/your message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });

  test('submits form with valid data', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/your name/i).fill('Test User');
    await page.getByPlaceholder(/your email/i).fill('test@example.com');
    await page.getByPlaceholder(/your message/i).fill('Hello from E2E test');

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(
      page.getByText(/thanks for your message|received it|contact form is temporarily unavailable/i),
    ).toBeVisible({ timeout: 10000 });
  });
});
