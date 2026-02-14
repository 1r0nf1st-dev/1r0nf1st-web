import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { contactRouter } from './contact.js';
import * as contactService from '../services/contactService.js';
import { config } from '../config.js';

vi.mock('../config.js', () => ({
  config: {
    brevoApiKey: 'test-key',
  },
}));

vi.mock('../services/contactService.js', () => ({
  parseContactBody: vi.fn(),
  submitContact: vi.fn(),
}));

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', contactRouter);
  return app;
}

function mockRequest(
  method: string,
  path: string,
  body?: unknown,
): express.Request {
  const pathNormalized = path.replace(/^\/api\/contact/, '') || '/';
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const req = {
    method,
    path: pathNormalized,
    url: path,
    headers,
    body: body ?? {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    get(name: string): string | undefined {
      return headers[name.toLowerCase()];
    },
  } as unknown as express.Request;
  return req;
}

function mockResponse(): express.Response & { statusCode: number; body?: unknown } {
  const res: express.Response & { statusCode: number; body?: unknown } = {
    statusCode: 200,
    body: undefined,
    status(this: express.Response, code: number) {
      this.statusCode = code;
      return this;
    },
    json(this: express.Response, obj: unknown) {
      (res as { body?: unknown }).body = obj;
      return this;
    },
    setHeader: vi.fn(),
    end: vi.fn(),
  } as unknown as express.Response & { statusCode: number; body?: unknown };
  return res;
}

function request(
  app: express.Application,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ statusCode: number; body?: unknown }> {
  return new Promise((resolve) => {
    const req = mockRequest(method, path, body);
    const res = mockResponse();
    const capture = () => {
      resolve({ statusCode: res.statusCode, body: (res as { body?: unknown }).body });
    };
    const originalJson = res.json.bind(res);
    res.json = function (this: express.Response, obj: unknown) {
      const out = originalJson(obj);
      setTimeout(capture, 0);
      return out;
    };
    app(req, res, () => {});
  });
}

describe('POST /api/contact', () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(config).brevoApiKey = 'test-key';
    vi.mocked(contactService.parseContactBody).mockReset();
    vi.mocked(contactService.submitContact).mockReset();
  });

  it('returns 503 when Brevo is not configured', async () => {
    vi.mocked(config).brevoApiKey = '';
    const { statusCode, body } = await request(app, 'POST', '/api/contact', {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hi',
    });
    expect(statusCode).toBe(503);
    expect(body).toMatchObject({ error: expect.stringContaining('unavailable') });
  });

  it('returns 400 when parseContactBody throws', async () => {
    vi.mocked(contactService.parseContactBody).mockImplementation(() => {
      throw new Error('name: Name is required.');
    });
    const { statusCode, body } = await request(app, 'POST', '/api/contact', {
      name: '',
      email: 'jane@example.com',
      message: 'Hi',
    });
    expect(statusCode).toBe(400);
    expect(body).toMatchObject({ error: 'name: Name is required.' });
  });

  it('returns 200 and success message when submitContact succeeds', async () => {
    vi.mocked(contactService.parseContactBody).mockReturnValue({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    });
    vi.mocked(contactService.submitContact).mockResolvedValue(undefined);
    const { statusCode, body } = await request(app, 'POST', '/api/contact', {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    });
    expect(statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      message: "Thanks for your message. We'll be in touch soon.",
    });
    expect(contactService.submitContact).toHaveBeenCalledTimes(1);
    const [submission, context] = vi.mocked(contactService.submitContact).mock.calls[0];
    expect(submission).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    });
    expect(context).toMatchObject({ submittedAt: expect.any(String) });
  });

  it('returns 500 when submitContact throws', async () => {
    vi.mocked(contactService.parseContactBody).mockReturnValue({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    });
    vi.mocked(contactService.submitContact).mockRejectedValue(new Error('Database error'));
    const { statusCode, body } = await request(app, 'POST', '/api/contact', {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello',
    });
    expect(statusCode).toBe(500);
    expect(body).toMatchObject({ error: expect.any(String) });
  });
});
