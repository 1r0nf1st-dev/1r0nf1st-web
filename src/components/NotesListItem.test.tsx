import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesListItem } from './NotesListItem';
import type { Note } from '../useNotes';

const mockNote: Note = {
  id: '1',
  user_id: 'user1',
  title: 'Test Note',
  content: { type: 'doc', content: [] },
  content_text: 'This is a test note with some content that should be truncated.',
  notebook_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  deleted_at: null,
  is_pinned: false,
  is_archived: false,
  tags: [
    { id: '1', user_id: 'user1', name: 'Work', color: null, created_at: '2024-01-01' },
  ],
};

describe('NotesListItem', () => {
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
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('renders "Untitled" when title is empty', () => {
    const noteWithoutTitle = { ...mockNote, title: '' };
    render(<NotesListItem note={noteWithoutTitle} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('renders preview text when available', () => {
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText(/This is a test note/)).toBeInTheDocument();
  });

  it('does not render preview when content_text is empty', () => {
    const noteWithoutContent = { ...mockNote, content_text: null };
    render(<NotesListItem note={noteWithoutContent} isSelected={false} onClick={mockOnClick} />);
    expect(screen.queryByText(/This is a test note/)).not.toBeInTheDocument();
  });

  it('calls onClick when item is clicked', () => {
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    const item = screen.getByRole('button', { name: /Note: Test Note/ });
    item.click();
    
    expect(mockOnClick).toHaveBeenCalledWith(mockNote);
  });

  it('shows pin icon when note is pinned', () => {
    const pinnedNote = { ...mockNote, is_pinned: true };
    render(<NotesListItem note={pinnedNote} isSelected={false} onClick={mockOnClick} />);
    
    const pinIcon = screen.getByLabelText('Pinned note');
    expect(pinIcon).toBeInTheDocument();
  });

  it('shows file icon when note is not pinned', () => {
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    
    // FileText icon is aria-hidden, so we check for the SVG element directly
    const fileIcon = document.querySelector('.lucide-file-text');
    expect(fileIcon).toBeInTheDocument();
    expect(screen.queryByLabelText('Pinned note')).not.toBeInTheDocument();
  });

  it('applies selected state styling when isSelected is true', () => {
    const { container } = render(<NotesListItem note={mockNote} isSelected={true} onClick={mockOnClick} />);
    const button = container.querySelector('button');
    
    expect(button).toHaveAttribute('aria-selected', 'true');
    expect(button?.className).toContain('bg-primary/10');
    expect(button?.className).toContain('ring-inset');
  });

  it('does not apply selected state styling when isSelected is false', () => {
    const { container } = render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    const button = container.querySelector('button');
    
    expect(button).toHaveAttribute('aria-selected', 'false');
    expect(button?.className).not.toContain('bg-primary/10');
  });

  it('displays formatted date', () => {
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    const dateElement = screen.getByText(/ago|Just now|Yesterday|Jan/);
    expect(dateElement).toBeInTheDocument();
  });

  it('displays tags with separator', () => {
    render(<NotesListItem note={mockNote} isSelected={false} onClick={mockOnClick} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});
