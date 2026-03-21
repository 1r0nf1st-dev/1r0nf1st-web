import { test, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';

/**
 * Authenticated Open Brain E2E tests.
 * Run only when E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD are set (e.g. local or CI with secrets).
 * Skips entirely when credentials are missing so CI without secrets stays green.
 */
const hasAuth = !!process.env.E2E_LOGIN_EMAIL && !!process.env.E2E_LOGIN_PASSWORD;

test.describe('Open Brain (authenticated)', () => {
  test.skip(!hasAuth, 'E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD must be set');

  let sharedPage: Page;
  let sharedContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();

    await sharedPage.goto('/login', { waitUntil: 'domcontentloaded' });
    await sharedPage.getByLabel(/email/i).fill(process.env.E2E_LOGIN_EMAIL!);
    await sharedPage.getByLabel(/password/i).fill(process.env.E2E_LOGIN_PASSWORD!);
    await sharedPage.getByRole('button', { name: /^login$/i }).click();
    await expect(sharedPage).toHaveURL(/\/(?!login)/, { timeout: 15000 });
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test('brain page shows Open Brain content after login', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    await expect(sharedPage).toHaveURL(/\/brain/);
    await expect(sharedPage.getByRole('heading', { name: /open brain/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('brain page shows New node or admin placeholder', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    const newNodeButton = sharedPage.getByRole('button', { name: /new node/i });
    const adminPlaceholder = sharedPage.getByText(/logged in as admin to access this/i);
    await expect(newNodeButton.or(adminPlaceholder)).toBeVisible({ timeout: 10000 });
  });

  test('clicking New node shows node editor', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    const newBtn = sharedPage.getByTestId('new-node-btn');
    if (!(await newBtn.isVisible())) {
      test.skip(true, 'New node button not visible (e.g. not admin)');
      return;
    }
    await newBtn.click();

    await expect(sharedPage.getByTestId('node-title')).toBeVisible({ timeout: 5000 });
    await expect(sharedPage.getByTestId('save-node-btn')).toBeVisible({ timeout: 5000 });
  });

  test('can create a node and see it', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    const newBtn = sharedPage.getByTestId('new-node-btn');
    if (!(await newBtn.isVisible())) {
      test.skip(true, 'New node button not visible (e.g. not admin)');
      return;
    }
    await newBtn.click();

    const title = `E2E node ${Date.now()}`;
    await sharedPage.getByTestId('node-title').fill(title);
    await sharedPage.getByTestId('save-node-btn').click();

    await expect(
      sharedPage.getByText(title).or(sharedPage.getByRole('button', { name: new RegExp(title) })),
    ).toBeVisible({ timeout: 15000 });
  });

  test('can switch to graph view', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    const graphBtn = sharedPage.getByRole('button', { name: /^graph$/i });
    if (!(await graphBtn.isVisible())) {
      test.skip(true, 'Graph button not visible (e.g. not admin)');
      return;
    }
    await graphBtn.click();

    await expect(
      sharedPage.getByTestId('brain-graph').or(sharedPage.getByText(/no nodes to show in graph/i)),
    ).toBeVisible({ timeout: 5000 });
  });

  test('ChatPanel can send a question and show response or error', async () => {
    await sharedPage.goto('/brain', { waitUntil: 'domcontentloaded' });

    const chatInput = sharedPage.getByTestId('chat-input');
    const chatSend = sharedPage.getByTestId('chat-send');

    await chatInput.fill(`Test chat ${Date.now()}`);
    await chatSend.click();

    await expect(
      sharedPage.getByTestId('chat-response').or(sharedPage.getByRole('alert')),
    ).toBeVisible({ timeout: 30000 });
  });
});
