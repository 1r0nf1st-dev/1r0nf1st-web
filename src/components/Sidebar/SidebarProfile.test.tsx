import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarProfile } from './SidebarProfile';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { AuthProvider } from '../../contexts/AuthContext';
import * as useAuthModule from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('SidebarProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user icon and display name when expanded', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    const { container } = render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    // User icon should be present (SVG element)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    
    // Display name should be shown
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('uses email prefix when username is not available', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: undefined,
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('shows "User" as fallback when no user data', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('has proper aria-label', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    const profile = screen.getByLabelText('testuser profile');
    expect(profile).toBeInTheDocument();
  });

  it('follows sidebar convention with icon and text', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    const profile = screen.getByLabelText('testuser profile');
    expect(profile).toHaveClass('flex', 'items-center', 'gap-2');
    expect(profile).toHaveClass('px-2', 'py-2', 'text-sm');
  });

  it('is not clickable (no link)', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <AuthProvider>
        <SidebarProvider>
          <SidebarProfile />
        </SidebarProvider>
      </AuthProvider>,
    );

    const profile = screen.getByLabelText('testuser profile');
    expect(profile.tagName).toBe('DIV');
    expect(profile).not.toHaveAttribute('href');
  });
});
