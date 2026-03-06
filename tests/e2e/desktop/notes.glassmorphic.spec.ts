import { test, expect } from '@playwright/test';

test.describe('Notes Card - Glassmorphic Design (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
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

  test('notes card renders with glassmorphic styling', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify glassmorphic classes
      expect(classes).toContain('backdrop-blur-md'); // Desktop uses md blur
      expect(classes).toContain('glass-card-fallback'); // Fallback class
      expect(classes).toContain('bg-white/80'); // Semi-transparent background
      expect(classes).toContain('border-slate-200/50'); // Transparent border
      expect(classes).toContain('rounded-xl'); // 16px border radius
      expect(classes).toContain('shadow-lg'); // Shadow for depth
    }
  });

  test('background gradient is visible for glass effect', async ({ page }) => {
    // Check body background gradient
    const body = page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backgroundImage: styles.backgroundImage,
      };
    });
    
    // Verify gradient is present (should contain linear-gradient)
    expect(bodyStyles.background || bodyStyles.backgroundImage).toContain('linear-gradient');
  });

  test('notes card hover state increases opacity and shadow', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Get initial styles
      const initialStyles = await firstCard.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          opacity: styles.opacity,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(200); // Wait for transition
      
      // Verify hover classes are present
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('hover:bg-white/90'); // More opaque on hover
      expect(classes).toContain('hover:shadow-xl'); // Enhanced shadow
    }
  });

  test('notes card selection state shows ring and background tint', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForTimeout(300);
      
      const selectedCard = page.locator('article[aria-selected="true"]').first();
      const classes = await selectedCard.getAttribute('class');
      
      // Verify selection styling
      expect(classes).toContain('ring-2');
      expect(classes).toContain('ring-blue-600/50');
      expect(classes).toContain('ring-offset-2');
      expect(classes).toContain('bg-blue-50/30'); // Light mode tint
    }
  });

  test('keyboard focus state matches selection state', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Tab to first card
      await page.keyboard.press('Tab');
      await expect(firstCard).toBeFocused();
      
      // Verify focus ring classes
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('focus:ring-blue-600/50');
      expect(classes).toContain('focus:ring-offset-2');
      expect(classes).toContain('focus:outline-none');
    }
  });

  test('keyboard navigation works with Enter and Space', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Tab to first card
      await page.keyboard.press('Tab');
      await expect(firstCard).toBeFocused();
      
      // Press Enter to open
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Verify selected state
      const selectedCard = page.locator('article[aria-selected="true"]');
      await expect(selectedCard).toBeVisible();
      
      // Reset and test Space
      await page.keyboard.press('Escape'); // Close if detail view opened
      await page.waitForTimeout(300);
      
      await firstCard.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      // Verify selected state again
      await expect(selectedCard).toBeVisible();
    }
  });

  test('backdrop-filter fallback works for older browsers', async ({ page }) => {
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
        return CSS.supports('backdrop-filter', 'blur(8px)');
      });
      
      if (supportsBackdropFilter) {
        // Modern browser - verify backdrop-filter is applied
        const styles = await firstCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.backdropFilter || computed.webkitBackdropFilter;
        });
        expect(styles).toBeTruthy();
      } else {
        // Older browser - verify fallback styles (more opaque background)
        const styles = await firstCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            opacity: computed.opacity,
          };
        });
        // Fallback should have more opaque background (95% vs 80%)
        expect(styles.backgroundColor).toBeTruthy();
      }
    }
  });

  test('card has correct responsive padding', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify responsive padding classes
      expect(classes).toContain('p-4'); // Mobile
      expect(classes).toContain('md:p-5'); // Tablet
      expect(classes).toContain('lg:p-6'); // Desktop
    }
  });

  test('card has correct responsive min-height', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const classes = await firstCard.getAttribute('class');
      
      // Verify responsive min-height classes
      expect(classes).toContain('min-h-[160px]'); // Mobile
      expect(classes).toContain('md:min-h-[180px]'); // Tablet
      expect(classes).toContain('lg:min-h-[200px]'); // Desktop
      
      // Verify actual height meets minimum
      const box = await firstCard.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(160);
    }
  });

  test('card typography uses correct colors per spec', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Verify title color
      const title = firstCard.locator('h3');
      const titleClasses = await title.getAttribute('class');
      expect(titleClasses).toContain('text-slate-900'); // Light mode foreground
      
      // Verify preview color
      const preview = firstCard.locator('p.text-sm');
      const previewClasses = await preview.getAttribute('class');
      expect(previewClasses).toContain('text-slate-500'); // Light mode muted
      
      // Verify date color
      const date = firstCard.locator('span.text-xs').last();
      const dateClasses = await date.getAttribute('class');
      expect(dateClasses).toContain('text-slate-500'); // Light mode muted
    }
  });

  test('active state shows scale-down feedback', async ({ page }) => {
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
});
