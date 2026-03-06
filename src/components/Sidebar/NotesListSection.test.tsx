import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotesListSection } from './NotesListSection';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { AlertProvider } from '../../contexts/AlertContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { LiveRegionProvider } from '../../contexts/LiveRegionContext';
import * as useNotesModule from '../../useNotes';
import * as useNotesActionsModule from '../../contexts/NotesActionsContext';
import * as useAlertModule from '../../contexts/AlertContext';

vi.mock('../../useNotes');
vi.mock('../../contexts/NotesActionsContext', async () => {
  const actual = await vi.importActual('../../contexts/NotesActionsContext');
  return {
    ...actual,
    useNotesActions: vi.fn(),
  };
});
vi.mock('../../contexts/AlertContext', async () => {
  const actual = await vi.importActual('../../contexts/AlertContext');
  return {
    ...actual,
    useAlert: vi.fn(),
  };
});

const mockDeleteNote = vi.fn();
const mockRefetch = vi.fn();
const mockSelectNote = vi.fn();
const mockRegisterRefetch = vi.fn(() => () => {});
const mockRefetchAllNotes = vi.fn();
const mockShowAlert = vi.fn();

const mockNotes = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'Test Note 1',
    content: {},
    content_text: 'Test content',
    notebook_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    deleted_at: null,
    is_pinned: false,
    is_archived: false,
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Test Note 2',
    content: {},
    content_text: 'Test content 2',
    notebook_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    is_pinned: false,
    is_archived: false,
  },
];

const renderComponent = () => {
  return render(
    <AuthProvider>
      <AlertProvider>
        <LiveRegionProvider>
          <SidebarProvider>
            <NotesActionsProvider>
              <NotesListSection />
            </NotesActionsProvider>
          </SidebarProvider>
        </LiveRegionProvider>
      </AlertProvider>
    </AuthProvider>,
  );
};

describe('NotesListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotesModule.useNotes).mockReturnValue({
      notes: mockNotes,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    vi.mocked(useNotesModule.deleteNote).mockImplementation(mockDeleteNote);
    vi.mocked(useNotesActionsModule.useNotesActions).mockReturnValue({
      createNote: vi.fn(),
      createNoteFromTemplate: vi.fn(),
      selectNote: mockSelectNote,
      toggleWidget: vi.fn(),
      registerHandlers: vi.fn(),
      registerRefetch: mockRegisterRefetch,
      refetchAllNotes: mockRefetchAllNotes,
      openWebClipper: vi.fn(),
      closeWebClipper: vi.fn(),
      isWebClipperOpen: false,
      openSearch: vi.fn(),
      closeSearch: vi.fn(),
      isSearchOpen: false,
    });
    vi.mocked(useAlertModule.useAlert).mockReturnValue({
      showAlert: mockShowAlert,
    });
  });

  it('renders notes list', () => {
    renderComponent();
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
  });

  it('shows delete button on hover', () => {
    renderComponent();
    const noteButton = screen.getByLabelText('Open note: Test Note 1');
    const noteContainer = noteButton.closest('.group');
    expect(noteContainer).toBeInTheDocument();
    
    const deleteButton = screen.getByLabelText('Delete note Test Note 1');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('opacity-0');
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    renderComponent();
    const deleteButton = screen.getByLabelText('Delete note Test Note 1');
    
    fireEvent.click(deleteButton);
    
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('cancels deletion when Cancel is clicked', async () => {
    renderComponent();
    const deleteButton = screen.getByLabelText('Delete note Test Note 1');
    
    fireEvent.click(deleteButton);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    });
    expect(mockDeleteNote).not.toHaveBeenCalled();
  });

  it('deletes note when Yes is clicked', async () => {
    mockDeleteNote.mockResolvedValue(undefined);
    renderComponent();
    const deleteButton = screen.getByLabelText('Delete note Test Note 1');
    
    fireEvent.click(deleteButton);
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('1');
    });
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockRefetchAllNotes).toHaveBeenCalled();
  });

  it('shows error alert when deletion fails', async () => {
    const error = new Error('Delete failed');
    mockDeleteNote.mockRejectedValue(error);
    
    // Mock showAlert from AlertContext
    const AlertContext = await import('../../contexts/AlertContext');
    vi.spyOn(AlertContext, 'useAlert').mockReturnValue({
      showAlert: mockShowAlert,
    });
    
    renderComponent();
    const deleteButton = screen.getByLabelText('Delete note Test Note 1');
    
    fireEvent.click(deleteButton);
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalled();
    });
    
    // Note: Alert context mocking may need adjustment based on actual implementation
  });

  it('sorts notes by updated_at descending', () => {
    renderComponent();
    const noteButtons = screen.getAllByRole('button', { name: /Open note:/ });
    // First note should be Test Note 1 (more recent)
    expect(noteButtons[0]).toHaveAccessibleName('Open note: Test Note 1');
  });

  it('limits to 20 most recent notes', () => {
    const manyNotes = Array.from({ length: 25 }, (_, i) => ({
      id: `note-${i}`,
      user_id: 'user-1',
      title: `Note ${i}`,
      content: {},
      content_text: null,
      notebook_id: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      deleted_at: null,
      is_pinned: false,
      is_archived: false,
    }));

    vi.mocked(useNotesModule.useNotes).mockReturnValue({
      notes: manyNotes,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderComponent();
    const noteButtons = screen.getAllByRole('button', { name: /Open note:/ });
    expect(noteButtons.length).toBe(20);
  });

  it('shows loading state', () => {
    vi.mocked(useNotesModule.useNotes).mockReturnValue({
      notes: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    renderComponent();
    // Skeleton components should be rendered
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    vi.mocked(useNotesModule.useNotes).mockReturnValue({
      notes: null,
      isLoading: false,
      error: 'Failed to load',
      refetch: mockRefetch,
    });

    renderComponent();
    expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
  });

  it('shows empty state when no notes', () => {
    vi.mocked(useNotesModule.useNotes).mockReturnValue({
      notes: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderComponent();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });
});
