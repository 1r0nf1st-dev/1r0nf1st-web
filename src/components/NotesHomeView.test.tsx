import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AlertProvider } from '../contexts/AlertContext';
import { NotesHomeView } from './NotesHomeView';

vi.mock('../useGoals', () => ({
  useGoals: vi.fn(() => ({
    goals: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock('../useStravaStats', () => ({
  useStravaStats: vi.fn(() => ({
    totals: null,
    isLoading: false,
    error: 'Not configured',
  })),
}));

const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <AlertProvider>{children}</AlertProvider>
  </AuthProvider>
);

const mockNotes = [
  {
    id: '1',
    user_id: 'u1',
    title: 'Pinned note',
    content: { type: 'doc', content: [] },
    content_text: 'Some content',
    notebook_id: null,
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-19T12:00:00Z',
    deleted_at: null,
    is_pinned: true,
    is_archived: false,
    tags: [{ id: 't1', name: 'work', user_id: 'u1', color: null, created_at: '' }],
  },
  {
    id: '2',
    user_id: 'u1',
    title: 'Recent note',
    content: { type: 'doc', content: [] },
    content_text: null,
    notebook_id: null,
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
    deleted_at: null,
    is_pinned: false,
    is_archived: false,
    tags: [],
  },
];

describe('NotesHomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick actions and sections when notes exist', () => {
    const onNoteClick = vi.fn();
    const onNewNote = vi.fn();
    const onFocusSearch = vi.fn();

    render(
      <AllProviders>
        <NotesHomeView
          notes={mockNotes}
          onNoteClick={onNoteClick}
          onNewNote={onNewNote}
          onFocusSearch={onFocusSearch}
        />
      </AllProviders>,
    );

    expect(screen.getByRole('button', { name: /create new note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /focus search/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pinned', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Pinned note')).toBeInTheDocument();
    expect(screen.getByText('Recent note')).toBeInTheDocument();
  });

  it('calls onNoteClick when a note is clicked', async () => {
    const user = userEvent.setup();
    const onNoteClick = vi.fn();

    render(
      <AllProviders>
        <NotesHomeView
          notes={mockNotes}
          onNoteClick={onNoteClick}
          onNewNote={vi.fn()}
          onFocusSearch={vi.fn()}
        />
      </AllProviders>,
    );

    await user.click(screen.getByText('Pinned note'));
    expect(onNoteClick).toHaveBeenCalledWith(mockNotes[0]);
  });

  it('calls onNewNote when New Note is clicked', async () => {
    const user = userEvent.setup();
    const onNewNote = vi.fn();

    render(
      <AllProviders>
        <NotesHomeView
          notes={[]}
          onNoteClick={vi.fn()}
          onNewNote={onNewNote}
          onFocusSearch={vi.fn()}
        />
      </AllProviders>,
    );

    await user.click(screen.getByRole('button', { name: /create your first note/i }));
    expect(onNewNote).toHaveBeenCalled();
  });

  it('shows empty state when no notes', () => {
    render(
      <AllProviders>
        <NotesHomeView
          notes={[]}
          onNoteClick={vi.fn()}
          onNewNote={vi.fn()}
          onFocusSearch={vi.fn()}
        />
      </AllProviders>,
    );

    expect(screen.getByRole('heading', { name: /no notes yet/i })).toBeInTheDocument();
    expect(
      screen.getByText(/create your first note to get started/i),
    ).toBeInTheDocument();
  });
});
