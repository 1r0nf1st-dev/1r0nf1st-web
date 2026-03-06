import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AlertProvider } from '../contexts/AlertContext';
import { DailyTodoView } from './DailyTodoView';

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../contexts/AuthContext')>();
  return {
    ...mod,
    useAuth: vi.fn(() => ({ user: { id: 'u1', email: 'test@example.com' } })),
  };
});

vi.mock('../useGoals', () => ({
  useGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

const mockGoals = [
  {
    id: '1',
    user_id: 'u1',
    title: 'Task for today',
    target_date: new Date().toISOString().slice(0, 10),
    status: 'active' as const,
    progress_percentage: 0,
    description: null,
    created_at: '',
    updated_at: '',
  },
];

describe('DailyTodoView', () => {
  beforeEach(async () => {
    const { useGoals } = await import('../useGoals');
    vi.mocked(useGoals).mockReturnValue({
      goals: mockGoals,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  const AllProviders = ({ children }: { children: ReactNode }) => (
    <AuthProvider>
      <AlertProvider>{children}</AlertProvider>
    </AuthProvider>
  );

  it('renders daily tasks heading', () => {
    render(
      <AllProviders>
        <DailyTodoView />
      </AllProviders>,
    );
    expect(screen.getByText('Daily tasks')).toBeInTheDocument();
  });

  it('shows date picker with today', () => {
    render(
      <AllProviders>
        <DailyTodoView />
      </AllProviders>,
    );
    const dateInput = screen.getByLabelText('Select date');
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('shows add task button', () => {
    render(
      <AllProviders>
        <DailyTodoView />
      </AllProviders>,
    );
    expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument();
  });

  it('renders task for selected date', () => {
    render(
      <AllProviders>
        <DailyTodoView />
      </AllProviders>,
    );
    expect(screen.getByText('Task for today')).toBeInTheDocument();
  });

  it('shows Back button when onBack is provided', () => {
    const onBack = vi.fn();
    render(
      <AllProviders>
        <DailyTodoView onBack={onBack} />
      </AllProviders>,
    );
    const backBtn = screen.getByRole('button', { name: 'Back to notes' });
    expect(backBtn).toBeInTheDocument();
    backBtn.click();
    expect(onBack).toHaveBeenCalled();
  });
});
