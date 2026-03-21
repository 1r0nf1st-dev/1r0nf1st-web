import type { JSX } from 'react';
import type { PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';

const pushMock = vi.fn();
const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({ children, href, className }: PropsWithChildren<{ href: string; className?: string }>) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    register: registerMock,
  }),
}));

vi.mock('../components/Nav', () => ({
  Nav: (): JSX.Element => <div data-testid="nav" />,
}));

vi.mock('../components/Footer', () => ({
  Footer: (): JSX.Element => <div data-testid="footer" />,
}));

vi.mock('../components/CogPair', () => ({
  CogPair: (): JSX.Element => <div data-testid="cog-pair" />,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it('renders split layout branding and login form copy', () => {
    render(<LoginPage />);

    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /your second brain awaits\./i })).toBeInTheDocument();
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText(/^Note:/)).toBeInTheDocument();
  });

  it('shows forgot password link in login mode only', () => {
    render(<LoginPage />);

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Don't have an account? Register" }));
    expect(screen.queryByRole('link', { name: 'Forgot password?' })).not.toBeInTheDocument();
  });

  it('submits login with existing auth logic', async () => {
    loginMock.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('a@b.com', 'password123');
    });
  });

  it('redirects to /notes after successful login when no returnTo param', async () => {
    loginMock.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/notes');
    });
  });
});
