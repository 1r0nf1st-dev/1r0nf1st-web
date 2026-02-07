import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
}));

vi.mock('../config.js', () => ({
  config: {
    enableRequestLogging: true,
  },
}));

import { requestLogger } from './requestLogger.js';
import { logger } from '../utils/logger.js';

describe('requestLogger', () => {
  let mockRequest: Partial<Request> & { requestId?: string; startTime?: number };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      query: {},
      ip: '127.0.0.1',
      get: vi.fn((name: string) => (name === 'user-agent' ? 'TestAgent' : undefined)) as Request['get'],
      socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
    };
    mockResponse = {
      statusCode: 200,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn(function (this: Response, body: unknown) {
        return body;
      }) as unknown as Response['send'],
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('should skip logging for /health and call next()', () => {
    const healthRequest = { ...mockRequest, path: '/health' };

    requestLogger(
      healthRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.info).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should attach requestId and startTime, log request, and call next()', () => {
    requestLogger(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockRequest.requestId).toBe('test-request-id');
    expect(mockRequest.startTime).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
      }),
      'Incoming request',
    );
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should log response when res.send is called', () => {
    requestLogger(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    const sentBody = { data: 'ok' };
    mockResponse.send!.call(mockResponse, sentBody);

    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenLastCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        duration: expect.stringMatching(/\d+ms/),
        responseSize: expect.stringMatching(/\d+ bytes/),
      }),
      'Request completed',
    );
  });

  it('should sanitize sensitive fields in request body', () => {
    mockRequest.body = { email: 'u@x.com', password: 'secret123', name: 'User' };

    requestLogger(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: 'u@x.com', password: '[REDACTED]', name: 'User' },
      }),
      'Incoming request',
    );
  });
});
