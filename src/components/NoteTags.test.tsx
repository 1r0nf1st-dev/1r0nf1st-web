import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NoteTags } from './NoteTags';
import type { Tag } from '../useNotes';

describe('NoteTags', () => {
  const mockTags: Tag[] = [
    { id: '1', user_id: 'user1', name: 'Work', color: null, created_at: '2024-01-01' },
    { id: '2', user_id: 'user1', name: 'Personal', color: null, created_at: '2024-01-01' },
    { id: '3', user_id: 'user1', name: 'Important', color: null, created_at: '2024-01-01' },
    { id: '4', user_id: 'user1', name: 'Archive', color: null, created_at: '2024-01-01' },
  ];

  it('renders nothing when tags array is empty', () => {
    const { container } = render(<NoteTags tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when tags is null', () => {
    const { container } = render(<NoteTags tags={null as unknown as Tag[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all tags when count is less than maxVisible', () => {
    const { getByText } = render(<NoteTags tags={mockTags.slice(0, 2)} maxVisible={3} />);
    expect(getByText('Work')).toBeInTheDocument();
    expect(getByText('Personal')).toBeInTheDocument();
  });

  it('renders only maxVisible tags and shows overflow indicator', () => {
    const { getByText, queryByText } = render(<NoteTags tags={mockTags} maxVisible={3} />);
    expect(getByText('Work')).toBeInTheDocument();
    expect(getByText('Personal')).toBeInTheDocument();
    expect(getByText('Important')).toBeInTheDocument();
    expect(queryByText('Archive')).not.toBeInTheDocument();
    expect(getByText('+1')).toBeInTheDocument();
  });

  it('uses default maxVisible of 3', () => {
    const { getByText } = render(<NoteTags tags={mockTags} />);
    expect(getByText('+1')).toBeInTheDocument();
  });
});
