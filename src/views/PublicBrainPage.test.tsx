import type { JSX } from 'react';
import type { PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PublicBrainPage } from './PublicBrainPage';

const authUser = vi.hoisted(() => ({
  email: 'admin@1r0nf1st.com',
  id: 'u1',
}));

const mockGetBySlug = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    profile: {
      id: 'p1',
      username: 'brainowner',
      display_name: 'Brain Owner',
      brain_slug: 'brainowner',
    },
    nodes: [],
    edges: [],
  }),
);

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: PropsWithChildren<{ href: string; className?: string }>) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: authUser.email, id: authUser.id },
  }),
}));

vi.mock('../lib/obApi', () => ({
  obApi: {
    public: { getBySlug: mockGetBySlug },
  },
}));

vi.mock('../components/ob/NodeCard', () => ({
  NodeCard: (): JSX.Element => <div data-testid="node-card" />,
}));

vi.mock('../components/ob/NodeDetailReadOnly', () => ({
  NodeDetailReadOnly: (): JSX.Element => <div data-testid="node-detail" />,
}));

vi.mock('../components/ob/BrainGraph', () => ({
  BrainGraph: (): JSX.Element => <div data-testid="brain-graph" />,
}));

vi.mock('../components/ob/ChatPanel', () => ({
  ChatPanel: (): JSX.Element => <div data-testid="chat-panel" />,
}));

vi.mock('../components/PageHero', () => ({
  PageHero: (): JSX.Element => <div data-testid="page-hero" />,
}));

vi.mock('../components/StatsBar', () => ({
  StatsBar: (): JSX.Element => <div data-testid="stats-bar" />,
}));

vi.mock('../components/AdminOnlyPlaceholderCard', () => ({
  AdminOnlyPlaceholderCard: (): JSX.Element => <div data-testid="admin-placeholder" />,
}));

describe('PublicBrainPage', () => {
  beforeEach(() => {
    authUser.email = 'admin@1r0nf1st.com';
    mockGetBySlug.mockClear();
  });

  it('uses the same flex column shell as Open Brain so page-content scrolls inside the app (admin)', async () => {
    render(<PublicBrainPage slug="test-slug" />);

    await waitFor(() => {
      expect(mockGetBySlug).toHaveBeenCalled();
    });

    const region = screen.getByRole('region', { name: 'Public brain' });
    expect(region).toHaveClass('flex');
    expect(region).toHaveClass('min-h-0');
    expect(region).toHaveClass('flex-1');
    expect(region).toHaveClass('overflow-hidden');
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument();
  });

  it('shows admin placeholder for logged-in non-admin', () => {
    authUser.email = 'user@example.com';

    render(<PublicBrainPage slug="test-slug" />);

    const region = screen.getByRole('region', { name: 'Public brain' });
    expect(region).toHaveClass('overflow-hidden');
    expect(screen.getByTestId('admin-placeholder')).toBeInTheDocument();
    expect(mockGetBySlug).not.toHaveBeenCalled();
  });
});
