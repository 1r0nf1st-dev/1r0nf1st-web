import { test, expect } from '@playwright/test';

test.describe('Notes Card - Mobile', () => {
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

  test('displays empty state when no notes exist', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const cards = page.locator('article[role="button"]');
    const count = await cards.count();
    
    if (count === 0) {
      await expect(page.getByText(/No notes yet/i)).toBeVisible();
    }
  });

  test('renders cards in single column on mobile', async ({ page }) => {
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

  test('cards have minimum 44px height for touch targets', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const box = await firstCard.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('spacing between cards is at least 8px', async ({ page }) => {
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

  test('tapping card opens note detail', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      await firstCard.tap();
      await page.waitForTimeout(500);
      
      // Verify selected state
      const selectedCard = page.locator('article[aria-selected="true"]');
      await expect(selectedCard).toBeVisible();
    }
  });

  test('no hover states on mobile', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // On mobile, hover states should not be applied
      // Verify motion-reduce classes are present
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('motion-reduce:hover:scale-100');
      expect(classes).toContain('motion-reduce:transition-none');
    }
  });

  test('card displays all required elements', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Check title
      const title = firstCard.locator('h3');
      await expect(title).toBeVisible();
      
      // Check preview
      const preview = firstCard.locator('p.text-muted');
      await expect(preview).toBeVisible();
      
      // Check footer with date
      const footer = firstCard.locator('.border-t');
      await expect(footer).toBeVisible();
    }
  });

  test('list layout renders correctly', async ({ page }) => {
    // Navigate to a view that uses list layout (e.g., sidebar view)
    // This test assumes there's a way to switch to list layout
    // Adjust based on your implementation
    
    const listItems = page.locator('button[aria-label*="Note:"]');
    const count = await listItems.count();
    
    if (count > 0) {
      const firstItem = listItems.first();
      
      // Verify list item structure
      const icon = firstItem.locator('svg');
      await expect(icon.first()).toBeVisible();
      
      const title = firstItem.locator('.text-base.font-medium');
      await expect(title).toBeVisible();
    }
  });

  test('list items have minimum 44px height', async ({ page }) => {
    const listItems = page.locator('button[aria-label*="Note:"]');
    const count = await listItems.count();
    
    if (count > 0) {
      const firstItem = listItems.first();
      const box = await firstItem.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('pinned notes show pin icon in list view', async ({ page }) => {
    const listItems = page.locator('button[aria-label*="Note:"]');
    const count = await listItems.count();
    
    if (count > 0) {
      // Look for pin icons
      const pinIcons = page.locator('svg[aria-label="Pinned note"]');
      const pinCount = await pinIcons.count();
      
      if (pinCount > 0) {
        await expect(pinIcons.first()).toBeVisible();
      }
    }
  });
});
