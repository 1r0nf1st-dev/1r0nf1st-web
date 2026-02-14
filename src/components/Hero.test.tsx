import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Hero } from './Hero';
import * as authContextModule from '../contexts/AuthContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHero = () => {
    return render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
  };

  it('should render the hero title', () => {
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText('1r0nf1st')).toBeInTheDocument();
  });

  it('should show login button when user is not logged in', () => {
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should show username when user is logged in', () => {
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: { id: '1', username: 'testuser' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText(/Logged in as/)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should show logout button when user is logged in', () => {
    const mockLogout = vi.fn();
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: { id: '1', username: 'testuser' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: mockLogout,
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show change password link when user is logged in', () => {
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: { id: '1', username: 'testuser' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('should render portfolio pill', () => {
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    renderHero();
    expect(screen.getByText('Portfolio · Next.js + React')).toBeInTheDocument();
  });
});
