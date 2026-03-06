import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCard } from './NoteCard';
import type { Note } from '../useNotes';

const mockNote: Note = {
  id: '1',
  user_id: 'user1',
  title: 'Test Note',
  content: { type: 'doc', content: [] },
  content_text: 'This is a test note with some content that should be truncated if it is too long.',
  notebook_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  deleted_at: null,
  is_pinned: false,
  is_archived: false,
  tags: [
    { id: '1', user_id: 'user1', name: 'Work', color: null, created_at: '2024-01-01' },
    { id: '2', user_id: 'user1', name: 'Personal', color: null, created_at: '2024-01-01' },
  ],
};

describe('NoteCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders note title', () => {
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('renders "Untitled" when title is empty', () => {
    const noteWithoutTitle = { ...mockNote, title: '' };
    render(<NoteCard note={noteWithoutTitle} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('renders preview text', () => {
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText(/This is a test note/)).toBeInTheDocument();
  });

  it('renders "No content" when content_text is empty', () => {
    const noteWithoutContent = { ...mockNote, content_text: null };
    render(<NoteCard note={noteWithoutContent} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    // Use real timers for userEvent interactions
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /Note: Test Note/ });
    await user.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
    vi.useFakeTimers();
  });

  it('calls onClick when Enter key is pressed', async () => {
    // Use real timers for userEvent interactions
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /Note: Test Note/ });
    card.focus();
    await user.keyboard('{Enter}');
    
    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
    vi.useFakeTimers();
  });

  it('calls onClick when Space key is pressed', async () => {
    // Use real timers for userEvent interactions
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /Note: Test Note/ });
    card.focus();
    await user.keyboard(' ');
    
    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
    vi.useFakeTimers();
  });

  it('shows pin icon when note is pinned', () => {
    const pinnedNote = { ...mockNote, is_pinned: true };
    render(<NoteCard note={pinnedNote} isSelected={false} onClick={mockOnClick} />);
    
    const pinIcon = screen.getByLabelText('Pinned note');
    expect(pinIcon).toBeInTheDocument();
  });

  it('does not show pin icon when note is not pinned', () => {
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    const pinIcon = screen.queryByLabelText('Pinned note');
    expect(pinIcon).not.toBeInTheDocument();
  });

  it('applies selected state styling when isSelected is true', () => {
    const { container } = render(<NoteCard note={mockNote} isSelected={true} onClick={mockOnClick} />);
    const card = container.querySelector('article');
    
    expect(card).toHaveAttribute('aria-selected', 'true');
    expect(card?.className).toContain('ring-2');
    expect(card?.className).toContain('ring-blue-600/50');
    expect(card?.className).toContain('bg-blue-50/30');
  });

  it('does not apply selected state styling when isSelected is false', () => {
    const { container } = render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    const card = container.querySelector('article');
    
    expect(card).toHaveAttribute('aria-selected', 'false');
    // Check for selected-specific background class that is only added when isSelected is true
    // Note: ring classes are also used for focus states, so we check for bg-blue-50/30
    // which is unique to the selected state
    const className = card?.className || '';
    expect(className).not.toContain('bg-blue-50/30');
    expect(className).not.toContain('dark:bg-blue-900/20');
  });

  it('displays formatted date', () => {
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    // Date should be formatted (either relative or absolute)
    const dateElement = screen.getByText(/ago|Just now|Yesterday|Jan/);
    expect(dateElement).toBeInTheDocument();
  });

  it('displays tags', () => {
    render(<NoteCard note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });
});
