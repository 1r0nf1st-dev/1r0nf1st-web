import type { JSX } from 'react';
import type { PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrainPage } from './BrainPage';

const authUser = vi.hoisted(() => ({
  email: 'user@example.com',
  id: 'u1',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: PropsWithChildren<{ href: string; className?: string }>) => (
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

vi.mock('../hooks/useObNodes', () => ({
  useObNodes: () => ({
    nodes: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  createObNode: vi.fn(),
  updateObNode: vi.fn(),
  deleteObNode: vi.fn(),
}));

vi.mock('../lib/obApi', () => ({
  obApi: {
    profile: { getMe: vi.fn().mockResolvedValue({ brain_slug: null }) },
    edges: { list: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('../components/ob/NodeCard', () => ({
  NodeCard: (): JSX.Element => <div data-testid="node-card" />,
}));

vi.mock('../components/ob/NodeEditor', () => ({
  NodeEditor: (): JSX.Element => <div data-testid="node-editor" />,
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

describe('BrainPage', () => {
  beforeEach(() => {
    authUser.email = 'user@example.com';
  });

  it('wraps Open Brain in a flex column with min-h-0 so page-content can scroll inside app shell (non-admin)', () => {
    render(<BrainPage />);

    const region = screen.getByRole('region', { name: 'Open Brain' });
    expect(region).toHaveClass('flex');
    expect(region).toHaveClass('min-h-0');
    expect(region).toHaveClass('flex-1');
    expect(region).toHaveClass('overflow-hidden');
  });

  it('uses the same scroll layout for admin Open Brain (full editor view)', () => {
    authUser.email = 'admin@1r0nf1st.com';

    render(<BrainPage />);

    const region = screen.getByRole('region', { name: 'Open Brain' });
    expect(region).toHaveClass('flex');
    expect(region).toHaveClass('min-h-0');
    expect(region).toHaveClass('flex-1');
    expect(region).toHaveClass('overflow-hidden');
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument();
  });
});
