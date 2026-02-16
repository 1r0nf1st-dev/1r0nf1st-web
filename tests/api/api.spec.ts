import { test, expect } from '@playwright/test';

async function parseJsonOrFail(
  res: { headers: () => Record<string, string>; status: () => number; text: () => Promise<string> },
): Promise<unknown> {
  const contentType = res.headers()['content-type'] ?? '';
  const text = await res.text();
  if (!contentType.includes('application/json') && text.trimStart().startsWith('<')) {
    throw new Error(
      `Expected JSON but got HTML (status ${res.status()}). ` +
        'If using Vercel Deployment Protection, add VERCEL_AUTOMATION_BYPASS_SECRET to GitHub secrets and enable Protection Bypass for Automation in Vercel.',
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid JSON response (status ${res.status()}): ${text.slice(0, 200)}`);
  }
}

test.describe('API', () => {
  test('GET /api/quote/random returns JSON', async ({ request }) => {
    const res = await request.get('/api/quote/random');
    const data = (await parseJsonOrFail(res)) as Record<string, unknown>;

    if (res.ok()) {
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('author');
    } else {
      expect([500, 503]).toContain(res.status());
      expect(data).toHaveProperty('error');
    }
  });

  test('GET /api/joke/random returns JSON', async ({ request }) => {
    const res = await request.get('/api/joke/random');
    const data = (await parseJsonOrFail(res)) as Record<string, unknown>;

    if (res.ok()) {
      expect(data).toMatchObject({
        type: expect.any(String),
        setup: expect.any(String),
        punchline: expect.any(String),
      });
    } else {
      expect([500, 503]).toContain(res.status());
      expect(data).toHaveProperty('error');
    }
  });

  test('POST /api/contact with valid payload returns 200 or 503', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: {
        name: 'E2E Test User',
        email: 'e2e@example.com',
        message: 'Hello from API test',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await parseJsonOrFail(res)) as Record<string, unknown>;

    expect([200, 503]).toContain(res.status());
    if (res.ok()) {
      expect(data).toHaveProperty('success', true);
    } else {
      expect(data).toHaveProperty('error');
    }
  });

  test('POST /api/contact with invalid payload returns 400', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: '', email: 'invalid', message: '' },
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await parseJsonOrFail(res)) as Record<string, unknown>;

    expect(res.status()).toBe(400);
    expect(data).toHaveProperty('error');
  });

  test('GET /api/health or health-like endpoint responds', async ({ request }) => {
    const res = await request.get('/api/quote/random');
    expect([200, 500, 503]).toContain(res.status());
  });
});
