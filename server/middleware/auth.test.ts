import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Response, NextFunction } from 'express';

// Mock Supabase before importing auth
vi.mock('../db/supabase', () => {
  const mockGetUser = vi.fn();
  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
      },
    },
  };
});

import { authenticateToken, type AuthRequest } from './auth.js';
import { supabase } from '../db/supabase.js';

describe('authenticateToken', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    await authenticateToken(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if authorization header format is invalid', async () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };
    // When format is invalid, token extraction succeeds but JWT verification fails
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    } as never);

    await authenticateToken(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    } as never);

    await authenticateToken(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' },
    };
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };
    vi.mocked(supabase!.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    await authenticateToken(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.userId).toBe('123');
    expect(mockRequest.email).toBe('test@example.com');
    expect(mockRequest.user).toEqual(mockUser);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockRequest.headers = {
      authorization: 'Bearer test-token',
    };
    vi.mocked(supabase!.auth.getUser).mockRejectedValue(new Error('Network error'));

    await authenticateToken(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
