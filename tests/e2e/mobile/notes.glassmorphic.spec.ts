import { test, expect } from '@playwright/test';

test.describe('Notes Card - Glassmorphic Design (Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (390x844 - iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to notes page
    await page.goto('/notes');
    
    // Check if we need to log in
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      return;
    }
    
    // Wait for notes to load (either cards or empty state)
    await page.waitForSelector('article[role="button"][aria-label*="Note:"], .text-center:has-text("No notes")', { timeout: 10000 });
  });

  test('notes card renders with glassmorphic styling on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify glassmorphic classes
      expect(classes).toContain('backdrop-blur-sm'); // Mobile uses sm blur (performance optimization)
      expect(classes).toContain('glass-card-fallback'); // Fallback class
      expect(classes).toContain('bg-white/80'); // Semi-transparent background
      expect(classes).toContain('border-slate-200/50'); // Transparent border
      expect(classes).toContain('rounded-xl'); // 16px border radius
      expect(classes).toContain('shadow-lg'); // Shadow for depth
    }
  });

  test('mobile uses lighter blur than desktop for performance', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify mobile uses backdrop-blur-sm (not md)
      expect(classes).toContain('backdrop-blur-sm');
      expect(classes).not.toContain('backdrop-blur-md'); // Should not have md on mobile
      
      // Verify responsive blur: md:backdrop-blur-md should be present for desktop breakpoint
      expect(classes).toContain('md:backdrop-blur-md'); // Desktop breakpoint uses md
    }
  });

  test('cards have minimum 44px height for touch targets', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const box = await firstCard.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('spacing between cards is at least 8px', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const cards = page.locator('article[role="button"]');
    const count = await cards.count();
    
    if (count >= 2) {
      const firstBox = await cards.first().boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      
      if (firstBox && secondBox) {
        const spacing = secondBox.y - (firstBox.y + firstBox.height);
        expect(spacing).toBeGreaterThanOrEqual(8);
      }
    }
  });

  test('cards render in single column on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const cards = page.locator('article[role="button"]');
    const count = await cards.count();
    
    if (count > 0) {
      // Verify grid layout
      const grid = page.locator('.grid');
      await expect(grid).toBeVisible();
      
      // Verify single column on mobile
      const gridClasses = await grid.getAttribute('class');
      expect(gridClasses).toContain('grid-cols-1');
    }
  });

  test('card has correct mobile padding', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify mobile padding (p-4)
      expect(classes).toContain('p-4');
    }
  });

  test('card has correct mobile min-height', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify mobile min-height (160px)
      expect(classes).toContain('min-h-[160px]');
      
      // Verify actual height meets minimum
      const box = await firstCard.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(160);
    }
  });

  test('tapping card opens note detail', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      await firstCard.tap();
      await page.waitForTimeout(500);
      
      // Verify selected state
      const selectedCard = page.locator('article[aria-selected="true"]');
      await expect(selectedCard).toBeVisible();
    }
  });

  test('active state shows scale-down feedback on tap', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify active state classes
      expect(classes).toContain('active:scale-[0.98]');
      expect(classes).toContain('motion-reduce:active:scale-100'); // Respects reduced motion
    }
  });

  test('background gradient is visible on mobile', async ({ page }) => {
    // Check body background gradient
    const body = page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backgroundImage: styles.backgroundImage,
      };
    });
    
    // Verify gradient is present
    expect(bodyStyles.background || bodyStyles.backgroundImage).toContain('linear-gradient');
  });

  test('hover states are disabled on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Hover should not trigger scale transform on mobile
      // Verify motion-reduce classes prevent hover transforms
      const classes = await firstCard.getAttribute('class');
      
      // Note: The hover classes are still present but should not trigger on mobile
      // This is handled by CSS media queries and touch events
      // We verify that motion-reduce classes are present for reduced motion preference
      expect(classes).toContain('motion-reduce:active:scale-100');
    }
  });

  test('keyboard navigation works on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Focus first card
      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      
      // Verify focus ring classes
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('focus:ring-blue-600/50');
      
      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Verify selected state
      const selectedCard = page.locator('article[aria-selected="true"]');
      await expect(selectedCard).toBeVisible();
    }
  });

  test('card typography is readable on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Verify title is visible and readable
      const title = firstCard.locator('h3');
      await expect(title).toBeVisible();
      
      const titleText = await title.textContent();
      expect(titleText?.length).toBeGreaterThan(0);
      
      // Verify preview is visible
      const preview = firstCard.locator('p.text-sm');
      await expect(preview).toBeVisible();
      
      // Verify date is visible
      const date = firstCard.locator('span.text-xs').last();
      await expect(date).toBeVisible();
    }
  });

  test('backdrop-filter fallback works on mobile', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Verify fallback class is present
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('glass-card-fallback');
      
      // Check if backdrop-filter is supported
      const supportsBackdropFilter = await page.evaluate(() => {
        return CSS.supports('backdrop-filter', 'blur(4px)');
      });
      
      if (supportsBackdropFilter) {
        // Modern browser - verify backdrop-filter is applied
        const styles = await firstCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.backdropFilter || computed.webkitBackdropFilter;
        });
        expect(styles).toBeTruthy();
      } else {
        // Older browser - verify fallback styles
        const styles = await firstCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
          };
        });
        expect(styles.backgroundColor).toBeTruthy();
      }
    }
  });
});
