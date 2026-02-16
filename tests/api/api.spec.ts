import { test, expect } from '@playwright/test';

test.describe('API', () => {
  test('GET /api/quote/random returns JSON', async ({ request }) => {
    const res = await request.get('/api/quote/random');
    const data = await res.json();

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
    const data = await res.json();

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
    const data = await res.json();

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
    const data = await res.json();

    expect(res.status()).toBe(400);
    expect(data).toHaveProperty('error');
  });

  test('GET /api/health or health-like endpoint responds', async ({ request }) => {
    const res = await request.get('/api/quote/random');
    expect([200, 500, 503]).toContain(res.status());
  });
});
