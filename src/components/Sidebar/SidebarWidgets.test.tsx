import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SidebarWidgets } from './SidebarWidgets';
import * as AuthContext from '../../contexts/AuthContext';

vi.mock('../../hooks/useMediaQuery', () => ({
  useMediaQuery: (): boolean => false,
}));

vi.mock('../../contexts/NotesActionsContext', () => ({
  useNotesActions: () => ({ toggleWidget: vi.fn() }),
}));

vi.mock('../../contexts/SidebarContext', () => ({
  useSidebar: () => ({ setCollapsed: vi.fn() }),
}));

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>(
    '../../contexts/AuthContext',
  );
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const baseAuth = {
  user: null as { id: string; email?: string } | null,
  token: null,
  login: vi.fn(),
  register: vi.fn(),
  changePassword: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
};

describe('SidebarWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show Strava for non-admin after mount', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      ...baseAuth,
      user: { id: 'u1', email: 'user@example.com' },
    });

    render(<SidebarWidgets />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Toggle Goals widget/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Toggle Strava widget/i })).not.toBeInTheDocument();
  });

  it('shows Strava for admin after client mount (mount gate avoids SSR vs session mismatch)', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      ...baseAuth,
      user: { id: 'u1', email: 'admin@1r0nf1st.com' },
    });

    render(<SidebarWidgets />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Toggle Strava widget/i })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});
