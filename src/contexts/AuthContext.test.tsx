import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { getJson } from '../apiClient';
import type { JSX } from 'react';

// Mock apiClient
vi.mock('../apiClient', () => ({
  getJson: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children as JSX.Element}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return initial state when no token in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should verify token on mount if token exists in localStorage', async () => {
      localStorage.setItem('authToken', 'test-token');
      const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' };

      vi.mocked(getJson).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getJson).toHaveBeenCalledWith('/api/auth/verify', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
    });

    it('should clear token if verification fails', async () => {
      localStorage.setItem('authToken', 'invalid-token');
      vi.mocked(getJson).mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        token: 'new-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
      };

      vi.mocked(getJson).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(localStorage.getItem('authToken')).toBe(mockResponse.token);
      expect(localStorage.getItem('refreshToken')).toBe(mockResponse.refreshToken);
      expect(getJson).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
    });

    it('should throw error on login failure', async () => {
      vi.mocked(getJson).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        token: 'new-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'new@example.com', username: 'newuser' },
      };

      vi.mocked(getJson).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('new@example.com', 'password123', 'newuser');
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(localStorage.getItem('authToken')).toBe(mockResponse.token);
      expect(getJson).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'new@example.com', password: 'password123', username: 'newuser' }),
      });
    });

    it('should handle email verification required', async () => {
      const mockResponse = {
        message: 'User created. Please check your email to verify your account.',
        user: { id: '1', email: 'new@example.com' },
      };

      vi.mocked(getJson).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.register('new@example.com', 'password123');
        }),
      ).rejects.toThrow('User created. Please check your email to verify your account.');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      localStorage.setItem('authToken', 'test-token');
      vi.mocked(getJson).mockResolvedValue({ message: 'Password changed successfully' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.changePassword('newpass123');
      });

      expect(getJson).toHaveBeenCalledWith('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: 'newpass123',
        }),
      });
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      localStorage.setItem('authToken', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' };
      vi.mocked(getJson).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      vi.mocked(getJson).mockResolvedValue({ message: 'Logged out successfully' });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});
