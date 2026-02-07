import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../config.js', () => ({
  config: {
    nodeEnv: 'test',
  },
}));

import { errorLogger } from './errorLogger.js';
import { logger } from '../utils/logger.js';

describe('errorLogger', () => {
  let mockRequest: Partial<Request> & { requestId?: string };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      query: {},
    };
    mockResponse = {
      statusCode: 200,
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('should log at warn level for 4xx errors and call next(err)', () => {
    const err = Object.assign(new Error('Not found'), { status: 404 });
    mockRequest.requestId = 'req-1';

    errorLogger(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        method: 'GET',
        path: '/api/test',
        statusCode: 404,
        errorName: 'Error',
        errorMessage: 'Not found',
      }),
      'Request error',
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it('should log at error level for 5xx and use error.status when set', () => {
    const err = Object.assign(new Error('Server error'), { status: 503 });

    errorLogger(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        errorMessage: 'Server error',
      }),
      'Request error',
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it('should default statusCode to 500 when error.status and res.statusCode are not 4xx/5xx', () => {
    const err = new Error('Internal');
    mockResponse.statusCode = 200;

    errorLogger(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
      'Request error',
    );
    expect(mockNext).toHaveBeenCalledWith(err);
  });

  it('should include userId when present on request', () => {
    const err = new Error('Unauthorized');
    (mockRequest as { userId?: string }).userId = 'user-123';

    errorLogger(
      err,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123' }),
      'Request error',
    );
  });
});
