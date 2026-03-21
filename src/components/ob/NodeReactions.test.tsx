import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeReactions } from './NodeReactions';
import * as obApi from '../../lib/obApi';

vi.mock('../../lib/obApi', () => ({
  obApi: {
    reactions: {
      list: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
}));

describe('NodeReactions', () => {
  const nodeId = 'node-1';
  const currentUserId = 'user-1';

  beforeEach(() => {
    vi.mocked(obApi.obApi.reactions.list).mockResolvedValue([]);
  });

  it('fetches and shows reaction list', async () => {
    render(<NodeReactions nodeId={nodeId} currentUserId={currentUserId} />);
    expect(obApi.obApi.reactions.list).toHaveBeenCalledWith(nodeId);
    await screen.findByTestId('reaction-list');
    expect(screen.getByTestId('reaction-resonates')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-challenges')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-expands')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-bookmarks')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    vi.mocked(obApi.obApi.reactions.list).mockImplementation(() => new Promise(() => {}));
    render(<NodeReactions nodeId={nodeId} currentUserId={currentUserId} />);
    expect(screen.getByText(/Loading reactions/)).toBeInTheDocument();
  });

  it('calls add when clicking a reaction the user has not reacted with', async () => {
    vi.mocked(obApi.obApi.reactions.add).mockResolvedValue({
      id: 'r1',
      node_id: nodeId,
      user_id: currentUserId,
      type: 'resonates',
      note: null,
      created_at: new Date().toISOString(),
    });
    vi.mocked(obApi.obApi.reactions.list)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'r1',
          node_id: nodeId,
          user_id: currentUserId,
          type: 'resonates',
          note: null,
          created_at: new Date().toISOString(),
        },
      ]);
    const user = userEvent.setup();
    render(<NodeReactions nodeId={nodeId} currentUserId={currentUserId} />);
    await screen.findByTestId('reaction-list');
    await user.click(screen.getByTestId('reaction-resonates'));
    expect(obApi.obApi.reactions.add).toHaveBeenCalledWith(nodeId, 'resonates');
  });

  it('calls remove when clicking a reaction the user already has', async () => {
    vi.mocked(obApi.obApi.reactions.list).mockResolvedValue([
      {
        id: 'r1',
        node_id: nodeId,
        user_id: currentUserId,
        type: 'resonates',
        note: null,
        created_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(obApi.obApi.reactions.remove).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NodeReactions nodeId={nodeId} currentUserId={currentUserId} />);
    await screen.findByTestId('reaction-list');
    await user.click(screen.getByTestId('reaction-resonates'));
    expect(obApi.obApi.reactions.remove).toHaveBeenCalledWith(nodeId, 'resonates');
  });
});
