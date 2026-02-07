import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { logsRouter } from './logs.js';

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Build a minimal app and invoke it with mock req/res (no listen)
function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/logs', logsRouter);
  return app;
}

function mockRequest(
  method: string,
  path: string,
  body?: unknown,
): express.Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const req = {
    method,
    path: path.replace(/^\/api\/logs/, '') || '/',
    url: path,
    headers,
    body: body ?? {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    get(name: string): string | undefined {
      const v = headers[name.toLowerCase()];
      return typeof v === 'string' ? v : undefined;
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
  return new Promise((resolve, reject) => {
    const req = mockRequest(method, path, body);
    const res = mockResponse();
    const capture = () => {
      resolve({ statusCode: res.statusCode, body: (res as { body?: unknown }).body });
    };
    // When route calls res.json(), capture and resolve (handles async route handlers)
    const originalJson = res.json.bind(res);
    res.json = function (this: express.Response, obj: unknown) {
      const out = originalJson(obj);
      setTimeout(capture, 0);
      return out;
    };
    app(req, res, (err?: unknown) => {
      if (err) reject(err);
    });
  });
}

describe('POST /api/logs/error', () => {
  const app = createApp();

  it('should return 400 when message is missing', async () => {
    const { statusCode, body } = await request(app, 'POST', '/api/logs/error', {});

    expect(statusCode).toBe(400);
    expect(body).toEqual({ error: 'Invalid error report: message is required' });
  });

  it('should return 400 when message is not a string', async () => {
    const { statusCode, body } = await request(app, 'POST', '/api/logs/error', {
      message: 123,
    });

    expect(statusCode).toBe(400);
    expect(body).toEqual({ error: 'Invalid error report: message is required' });
  });

  it('should accept valid error report and return 200', async () => {
    const { statusCode, body } = await request(app, 'POST', '/api/logs/error', {
      message: 'Test error',
      url: 'https://example.com',
      userAgent: 'Test',
      timestamp: new Date().toISOString(),
    });

    expect(statusCode).toBe(200);
    expect(body).toEqual({ message: 'Error reported successfully' });
  });
});

describe('POST /api/logs/analytics', () => {
  const app = createApp();

  it('should return 403 when analytics is disabled', async () => {
    const { statusCode, body } = await request(app, 'POST', '/api/logs/analytics', {
      event: 'click',
      timestamp: new Date().toISOString(),
    });

    expect(statusCode).toBe(403);
    expect(body).toEqual({ error: 'Analytics is disabled' });
  });
});
