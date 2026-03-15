import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByRole('link', { name: '1r0nf1st' })).toBeInTheDocument();
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
    // Use getAllByText and check that at least one exists, since AuthControls may render multiple Login buttons
    const loginButtons = screen.getAllByText('Login');
    expect(loginButtons.length).toBeGreaterThan(0);
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
    // AuthControls uses dropdown; username is shown in the account menu button
    const usernameTexts = screen.getAllByText('testuser');
    expect(usernameTexts.length).toBeGreaterThan(0);
  });

  it('should show logout button when user is logged in and menu is open', async () => {
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
    const accountButtons = screen.getAllByRole('button', { name: 'Account menu' });
    await userEvent.click(accountButtons[0]!);
    const logoutButtons = screen.getAllByText('Logout');
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it('should show Settings link when user is logged in and menu is open', async () => {
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
    const accountButtons = screen.getAllByRole('button', { name: 'Account menu' });
    await userEvent.click(accountButtons[0]!);
    const settingsLinks = screen.getAllByText('Settings');
    expect(settingsLinks.length).toBeGreaterThan(0);
  });

  it('should render tech pill', () => {
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
    expect(screen.getByText('Tools · Next.js + React')).toBeInTheDocument();
  });
});
