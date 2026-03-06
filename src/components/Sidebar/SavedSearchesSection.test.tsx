import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SavedSearchesSection } from './SavedSearchesSection';

const mocks = vi.hoisted(() => ({
  deleteSavedSearchMock: vi.fn(),
  refetchMock: vi.fn(),
}));

vi.mock('../../useSavedSearches', () => ({
  useSavedSearches: () => ({
    savedSearches: [
      { id: 's1', name: 'My Search', query: 'q=test' },
      { id: 's2', name: 'Another', query: 'tag=abc' },
    ],
    isLoading: false,
    refetch: mocks.refetchMock,
  }),
  createSavedSearch: vi.fn(),
  deleteSavedSearch: mocks.deleteSavedSearchMock,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/notes',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams({
      q: '',
    }),
}));

describe('SavedSearchesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteSavedSearchMock.mockResolvedValue(undefined);
    mocks.refetchMock.mockResolvedValue(undefined);
  });

  it('requires confirmation before deleting a saved search', async () => {
    render(<SavedSearchesSection />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete saved search/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(mocks.deleteSavedSearchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    await waitFor(() => {
      expect(mocks.deleteSavedSearchMock).toHaveBeenCalledWith('s1');
    });
    expect(mocks.refetchMock).toHaveBeenCalled();
  });
});
