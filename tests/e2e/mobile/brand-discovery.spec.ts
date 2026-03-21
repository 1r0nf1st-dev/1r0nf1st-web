import { test, expect } from '@playwright/test';
import { scanNearWhiteControlsInDarkRoots } from '../helpers/darkChromeScan';

/**
 * Mobile “discovery” checks: catch light-mode Tailwind leaking into dark chrome
 * (white toolbar blocks, etc.) without manually visiting every screen.
 *
 * Run: pnpm test:e2e tests/e2e/mobile/brand-discovery.spec.ts
 * Tag: @discovery (optional filter in CI)
 */
test.describe('Mobile brand discovery @discovery', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  const interiorPaths = ['/login', '/notes', '/projects/second-brain', '/brain', '/explore'] as const;

  test('dark chrome: no near-white control backgrounds on key interior routes', async ({ page }) => {
    const allIssues: Awaited<ReturnType<typeof scanNearWhiteControlsInDarkRoots>> = [];

    for (const path of interiorPaths) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      // Allow layout / media queries to settle
      await page.waitForTimeout(400);
      const issues = await scanNearWhiteControlsInDarkRoots(page, path);
      allIssues.push(...issues);
    }

    expect(
      allIssues,
      `Near-white buttons in dark roots (likely bg-white / light Tailwind without .dark):\n${JSON.stringify(allIssues, null, 2)}`,
    ).toEqual([]);
  });

  test('note editor: at most one visible editor toolbar row on mobile when modal is open', async ({
    page,
  }) => {
    await page.goto('/notes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible().catch(() => false)) {
      test.skip(true, 'Requires authenticated session');
      return;
    }

    const createBtn = page.getByRole('button', { name: /new note|create new note/i }).first();
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'New note control not found');
      return;
    }

    await createBtn.click();
    await page.waitForSelector('.note-modal .editor-wrapper', { timeout: 15000 });

    const visibleToolbarCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('.editor-wrapper .editor-toolbar');
      return [...rows].filter((el) => {
        const rect = el.getBoundingClientRect();
        const hidden =
          getComputedStyle(el).display === 'none' ||
          getComputedStyle(el).visibility === 'hidden' ||
          rect.width < 2 ||
          rect.height < 2;
        return !hidden;
      }).length;
    });

    expect(
      visibleToolbarCount,
      'Desktop + mobile toolbars must not show at once (check .editor-toolbar.hidden vs display:flex specificity)',
    ).toBe(1);
  });
});
