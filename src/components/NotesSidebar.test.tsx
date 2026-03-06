import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesSidebar } from './NotesSidebar';

vi.mock('./NotebooksSidebar', () => ({
  NotebooksSidebar: () => <div data-testid="notebooks-sidebar">Notebooks</div>,
}));
vi.mock('./TagsList', () => ({
  TagsList: () => <div data-testid="tags-list">Tags</div>,
}));
vi.mock('./SavedSearchesSection', () => ({
  SavedSearchesSection: () => <div data-testid="saved-searches">Saved Searches</div>,
}));
vi.mock('./WebClipperSection', () => ({
  WebClipperSection: () => <div data-testid="web-clipper">Web Clipper</div>,
}));

const defaultProps = {
  searchInputRef: { current: null },
  searchQuery: '',
  onSearchChange: vi.fn(),
  onCreateNote: vi.fn(),
  templates: [],
  onCreateNoteFromTemplate: vi.fn(),
  showArchived: false,
  showShared: false,
  showDailyView: false,
  onViewMyNotes: vi.fn(),
  onViewToday: vi.fn(),
  onViewArchived: vi.fn(),
  onViewShared: vi.fn(),
  selectedNotebookId: undefined,
  onNotebookSelect: vi.fn(),
  selectedTagId: undefined,
  onTagToggle: vi.fn(),
  onApplySavedSearch: vi.fn(),
  notebooks: [],
  tags: [],
};

describe('NotesSidebar', () => {
  it('renders Back link, Notes actions, sections, and child components', () => {
    render(<NotesSidebar {...defaultProps} />);

    expect(screen.getByRole('link', { name: /← Back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Note/i })).toBeInTheDocument();
    expect(screen.getByText('Archives')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByTestId('notebooks-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('tags-list')).toBeInTheDocument();
    expect(screen.getByTestId('saved-searches')).toBeInTheDocument();
    expect(screen.getByTestId('web-clipper')).toBeInTheDocument();
  });

  it('calls onCreateNote when New Note is clicked', async () => {
    const onCreateNote = vi.fn();
    render(<NotesSidebar {...defaultProps} onCreateNote={onCreateNote} />);

    await userEvent.click(screen.getByRole('button', { name: /New Note/i }));
    expect(onCreateNote).toHaveBeenCalledTimes(1);
  });

  it('calls onSearchChange when search input changes', async () => {
    const onSearchChange = vi.fn();
    render(<NotesSidebar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search notes...');
    await userEvent.type(searchInput, 'test');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders Archives view buttons', () => {
    render(<NotesSidebar {...defaultProps} />);

    expect(screen.getByRole('group', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Notes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shared' })).toBeInTheDocument();
  });

  it('calls view handlers when Archives buttons are clicked', async () => {
    const onViewMyNotes = vi.fn();
    const onViewToday = vi.fn();
    const onViewArchived = vi.fn();
    const onViewShared = vi.fn();
    render(
      <NotesSidebar
        {...defaultProps}
        onViewMyNotes={onViewMyNotes}
        onViewToday={onViewToday}
        onViewArchived={onViewArchived}
        onViewShared={onViewShared}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'My Notes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Shared' }));

    expect(onViewMyNotes).toHaveBeenCalledTimes(1);
    expect(onViewToday).toHaveBeenCalledTimes(1);
    expect(onViewArchived).toHaveBeenCalledTimes(1);
    expect(onViewShared).toHaveBeenCalledTimes(1);
  });
});
