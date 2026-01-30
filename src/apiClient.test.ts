import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError, getJson } from './apiClient';

describe('ApiError', () => {
  it('should create an ApiError with correct properties', () => {
    const error = new ApiError('Not found', 404, '/api/test');
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.url).toBe('/api/test');
    expect(error.name).toBe('ApiError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('getJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should successfully fetch and return JSON data', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await getJson<typeof mockData>('/api/test');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        Accept: 'application/json',
      },
    });
  });

  it('should add Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('authToken', 'test-token-123');
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await getJson('/api/test');
    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer test-token-123',
      },
    });
  });

  it('should not override Authorization header if already provided', async () => {
    localStorage.setItem('authToken', 'local-token');
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await getJson('/api/test', {
      headers: {
        Authorization: 'Bearer custom-token',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer custom-token',
      },
    });
  });

  it('should throw ApiError when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not found',
    });

    await expect(getJson('/api/test')).rejects.toThrow(ApiError);
    await expect(getJson('/api/test')).rejects.toThrow('Not found');
  });

  it('should throw ApiError with default message when response text is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(getJson('/api/test')).rejects.toThrow(ApiError);
    await expect(getJson('/api/test')).rejects.toThrow('Request to /api/test failed with status 500');
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getJson('/api/test')).rejects.toThrow(ApiError);
    await expect(getJson('/api/test')).rejects.toThrow(
      'Network error: Unable to connect to the server. Please try again later.',
    );
  });

  it('should re-throw ApiError as-is', async () => {
    const originalError = new ApiError('Custom error', 400, '/api/test');
    global.fetch = vi.fn().mockRejectedValue(originalError);

    await expect(getJson('/api/test')).rejects.toThrow(originalError);
  });

  it('should pass through custom RequestInit options', async () => {
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await getJson('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  });
});
