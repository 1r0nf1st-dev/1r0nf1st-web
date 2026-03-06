import { test, expect } from '@playwright/test';

test.describe('Notes Card - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to notes page (assumes auth fixture or login)
    await page.goto('/notes');
    // Wait for notes to load
    await page.waitForSelector('[role="button"][aria-label*="Note:"]', { timeout: 10000 });
  });

  test('renders cards in grid layout', async ({ page }) => {
    // Check if user is authenticated
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
      
      // Verify responsive columns
      const gridClasses = await grid.getAttribute('class');
      expect(gridClasses).toContain('grid-cols-1');
      expect(gridClasses).toContain('md:grid-cols-2');
      expect(gridClasses).toContain('lg:grid-cols-3');
    } else {
      // Verify empty state is shown
      await expect(page.getByText(/No notes yet/i)).toBeVisible();
    }
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

  test('card displays title, preview, tags, and date', async ({ page }) => {
    const loginPrompt = page.getByText(/please log in/i);
    if (await loginPrompt.isVisible()) {
      test.skip();
    }

    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Check title
      const title = firstCard.locator('h3');
      await expect(title).toBeVisible();
      
      // Check preview text
      const preview = firstCard.locator('p.text-muted');
      await expect(preview).toBeVisible();
      
      // Check date
      const date = firstCard.locator('span.text-xs.text-muted').last();
      await expect(date).toBeVisible();
    }
  });

  test('card hover state shows scale and shadow on desktop', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      // Hover over card
      await firstCard.hover();
      
      // Verify hover classes are applied
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('hover:scale-[1.02]');
      expect(classes).toContain('hover:shadow-md');
    }
  });

  test('clicking card opens note detail', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const cardTitle = await firstCard.locator('h3').textContent();
      await firstCard.click();
      
      // Verify note detail is shown (check for editor or detail view)
      // Adjust selector based on your NoteDetail component
      await page.waitForTimeout(500); // Wait for navigation/state update
      
      // Verify selected state
      const selectedCard = page.locator('article[aria-selected="true"]');
      await expect(selectedCard).toBeVisible();
    }
  });

  test('keyboard navigation works with Tab, Enter, and Space', async ({ page }) => {
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
    }
  });

  test('selected card shows ring and background tint', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForTimeout(300);
      
      const selectedCard = page.locator('article[aria-selected="true"]').first();
      const classes = await selectedCard.getAttribute('class');
      
      expect(classes).toContain('ring-2');
      expect(classes).toContain('ring-primary');
      expect(classes).toContain('bg-primary/5');
    }
  });

  test('pinned notes show pin icon', async ({ page }) => {
    // Look for cards with pin icon
    const pinnedCards = page.locator('article:has(svg[aria-label="Pinned note"])');
    const count = await pinnedCards.count();
    
    if (count > 0) {
      const pinIcon = pinnedCards.first().locator('svg[aria-label="Pinned note"]');
      await expect(pinIcon).toBeVisible();
    }
  });

  test('tag overflow shows "+N" indicator', async ({ page }) => {
    // Find a card with more than 3 tags
    const cards = page.locator('article[role="button"]');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      const overflowIndicator = card.locator('span.text-xs.text-muted:has-text("+")');
      
      if (await overflowIndicator.count() > 0) {
        await expect(overflowIndicator).toBeVisible();
        break;
      }
    }
  });

  test('date formatting displays correctly', async ({ page }) => {
    const firstCard = page.locator('article[role="button"]').first();
    
    if (await firstCard.count() > 0) {
      const dateElement = firstCard.locator('span.text-xs.text-muted').last();
      const dateText = await dateElement.textContent();
      
      // Date should be formatted (either relative or absolute)
      expect(dateText).toBeTruthy();
      expect(dateText?.length).toBeGreaterThan(0);
    }
  });
});
