import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { Nav } from './Nav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/notes'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function authLoggedOut(): JSX.Element {
  mockUseAuth.mockReturnValue({
    user: null,
    token: null,
    login: vi.fn(),
    register: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  });
  return <Nav />;
}

function authLoggedIn(): JSX.Element {
  mockUseAuth.mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com', username: 'tester' },
    token: 't',
    login: vi.fn(),
    register: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  });
  return <Nav />;
}

describe('Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Login links when not authenticated', () => {
    render(authLoggedOut());
    const logins = screen.getAllByRole('link', { name: /^login$/i });
    expect(logins.length).toBeGreaterThan(0);
  });

  it('hides Login links when authenticated', () => {
    render(authLoggedIn());
    expect(screen.queryAllByRole('link', { name: /^login$/i })).toHaveLength(0);
  });

  it('still renders menu control when authenticated', () => {
    render(authLoggedIn());
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });
});
