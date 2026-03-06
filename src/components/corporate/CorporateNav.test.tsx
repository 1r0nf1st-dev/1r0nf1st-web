import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { CorporateNav } from './CorporateNav';
import * as authContextModule from '../../contexts/AuthContext';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/about'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('CorporateNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
  });

  const renderNav = () => {
    return render(
      <ThemeProvider>
        <CorporateNav />
      </ThemeProvider>,
    );
  };

  it('should render the logo and site name', () => {
    renderNav();
    const homeLinks = screen.getAllByRole('link', { name: /1r0nf1st/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    expect(homeLinks[0]).toBeInTheDocument();
  });

  it('should render nav links', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /01 about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /02 project/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /03 contact/i })).toBeInTheDocument();
  });

  it('should show login link when user is not logged in', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('should show logout when user is logged in', async () => {
    const user = userEvent.setup();
    vi.mocked(authContextModule.useAuth).mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
    renderNav();
    await user.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should have accessible hamburger button for mobile menu', () => {
    renderNav();
    const menuButton = screen.getByRole('button', {
      name: /open menu/i,
    });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should open and close mobile menu when hamburger is clicked', async () => {
    const user = userEvent.setup();
    renderNav();

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: /mobile menu/i })).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: /close menu/i });
    await user.click(closeButtons[0]);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should render nav links inside mobile menu when open', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const dialog = screen.getByRole('dialog', { name: /mobile menu/i });
    expect(within(dialog).getByRole('link', { name: /01 about/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /02 project/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /03 contact/i })).toBeInTheDocument();
  });
});
