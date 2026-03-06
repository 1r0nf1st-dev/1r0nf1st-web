'use client';

import type { JSX } from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useGoals, createGoal, updateGoal, deleteGoal } from '../useGoals';
import type { Goal } from '../useGoals';
import { useAlert } from '../contexts/AlertContext';
import { Skeleton } from './Skeleton';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import {
  Target,
  Plus,
  Check,
  Circle,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function getPrevDay(isoDate: string): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getNextDay(isoDate: string): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export interface DailyTodoViewProps {
  styleTheme?: 'default' | 'corporate';
  onBack?: () => void;
}

export function DailyTodoView({
  styleTheme = 'default',
  onBack,
}: DailyTodoViewProps): JSX.Element {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { goals, isLoading, error, refetch } = useGoals();
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isCorporate = styleTheme === 'corporate';

  const tasksForDate = useMemo(() => {
    if (!goals) return [];
    return goals.filter(
      (g) =>
        g.status === 'active' &&
        g.target_date === selectedDate,
    );
  }, [goals, selectedDate]);

  const overdueTasks = useMemo(() => {
    if (!goals || selectedDate >= TODAY_ISO) return [];
    return goals.filter(
      (g) =>
        g.status === 'active' &&
        g.target_date &&
        g.target_date < selectedDate,
    );
  }, [goals, selectedDate]);

  const upcomingTasks = useMemo(() => {
    if (!goals) return [];
    return goals
      .filter(
        (g) =>
          g.status === 'active' &&
          g.target_date &&
          g.target_date > selectedDate,
      )
      .slice(0, 5);
  }, [goals, selectedDate]);

  const noDateTasks = useMemo(() => {
    if (!goals) return [];
    return goals.filter((g) => g.status === 'active' && !g.target_date);
  }, [goals]);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await createGoal(newTitle.trim(), undefined, selectedDate);
      setNewTitle('');
      setIsAdding(false);
      await refetch();
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : 'Failed to add task.',
        'Error',
      );
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      await updateGoal(goal.id, {
        status: goal.status === 'completed' ? 'active' : 'completed',
        progress_percentage: goal.status === 'completed' ? 0 : 100,
      });
      await refetch();
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : 'Failed to update task.',
        'Error',
      );
    }
  };

  const handleDelete = async (goalId: string) => {
    if (deletingId) return;
    setDeletingId(goalId);
    try {
      await deleteGoal(goalId);
      await refetch();
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : 'Failed to delete task.',
        'Error',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const TaskItem = ({
    goal,
    showDate = false,
  }: {
    goal: Goal;
    showDate?: boolean;
  }) => (
    <div
      key={goal.id}
      className="flex items-center gap-2 py-2 px-2 min-h-[44px] rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 group touch-manipulation"
    >
      <button
        type="button"
        onClick={() => handleToggleComplete(goal)}
        className="shrink-0 p-2 min-h-11 min-w-11 flex items-center justify-center rounded-xl focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
        aria-label={goal.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
      >
        {goal.status === 'completed' ? (
          <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
        ) : (
          <Circle className="w-4 h-4 text-muted" />
        )}
      </button>
      <span
        className={`flex-1 text-sm truncate ${
          goal.status === 'completed'
            ? 'line-through text-muted'
            : 'text-foreground'
        }`}
      >
        {goal.title}
      </span>
      {showDate && goal.target_date && (
        <span className="text-xs text-muted shrink-0">
          {formatDisplayDate(goal.target_date)}
        </span>
      )}
      <button
        type="button"
        onClick={() => handleDelete(goal.id)}
        disabled={deletingId === goal.id}
        className="opacity-0 group-hover:opacity-100 p-2 min-h-11 min-w-11 flex items-center justify-center rounded-xl text-muted hover:text-red-600 dark:hover:text-red-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 touch-manipulation"
        aria-label={`Delete ${goal.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (!user) {
    return (
      <div
        className={`flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 rounded-xl border border-primary/20 dark:border-border bg-white/50 dark:bg-surface/50 ${
          isCorporate ? 'md:rounded-xl' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Daily tasks
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>Log in to manage your tasks.</span>
          <Link
            href={`/login?returnTo=${encodeURIComponent('/notes')}`}
            className={`${btnBase} ${btnPrimary} text-xs py-1.5 px-3 ml-auto`}
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface ${
          isCorporate ? 'md:rounded-xl' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Daily tasks
          </h2>
        </div>
        <div aria-busy>
          <Skeleton className="mb-4 h-10 w-full" />
          <Skeleton className="mb-2 h-6 w-full" />
          <Skeleton className="mb-2 h-6 w-4/5" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface ${
          isCorporate ? 'md:rounded-xl' : ''
        }`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-2">
          Daily tasks
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 ${
        isCorporate ? 'md:px-8 lg:px-10' : ''
      }`}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={`${btnBase} ${btnGhost} flex items-center gap-2 py-1.5 px-2 -ml-2`}
              aria-label="Back to notes"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
            <h2
              className={`text-sm font-semibold uppercase tracking-wider text-muted ${
                isCorporate ? 'tracking-widest' : ''
              }`}
            >
              Daily tasks
            </h2>
          </div>
          <div aria-hidden className="w-[72px]" />
        </div>

        {/* Date picker */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(getPrevDay(selectedDate))}
            className={`${btnBase} ${btnGhost} p-2 min-h-11 min-w-11 touch-manipulation`}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm font-medium border border-primary/30 dark:border-border rounded-xl bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Select date"
            />
            <span className="text-sm font-medium text-foreground min-w-[100px]">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(getNextDay(selectedDate))}
            className={`${btnBase} ${btnGhost} p-2 min-h-11 min-w-11 touch-manipulation`}
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Quick add */}
      <div className="mb-4">
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`${btnBase} ${btnGhost} flex items-center gap-2 py-3 px-3 min-h-11 w-full justify-center border border-dashed border-primary/30 dark:border-border hover:bg-primary/5 dark:hover:bg-primary/10 touch-manipulation`}
            aria-label="Add task"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Add task for {formatDisplayDate(selectedDate)}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTitle('');
                }
              }}
              placeholder="New task..."
              className="flex-1 px-3 py-2 text-sm border border-primary/30 dark:border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!newTitle.trim()}
              className={`${btnBase} ${btnPrimary} text-sm py-2 px-3`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTitle('');
              }}
              className={`${btnBase} ${btnGhost} text-sm py-2 px-3`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Tasks for selected date */}
      {tasksForDate.length === 0 && !isAdding && (
        <p className="text-sm text-muted py-4 text-center">
          No tasks for {formatDisplayDate(selectedDate)}. Click &quot;Add task&quot; to create one.
        </p>
      )}

      {tasksForDate.length > 0 && (
        <div className="space-y-0 mb-6">
          {tasksForDate.map((g) => (
            <TaskItem key={g.id} goal={g} />
          ))}
        </div>
      )}

      {/* Overdue (when viewing past dates) */}
      {overdueTasks.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
            Overdue
          </h3>
          <div className="space-y-0 mb-6">
            {overdueTasks.map((g) => (
              <TaskItem key={g.id} goal={g} showDate />
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Upcoming
          </h3>
          <div className="space-y-0 mb-6">
            {upcomingTasks.map((g) => (
              <TaskItem key={g.id} goal={g} showDate />
            ))}
          </div>
        </>
      )}

      {/* No date */}
      {noDateTasks.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            No date
          </h3>
          <div className="space-y-0">
            {noDateTasks.map((g) => (
              <TaskItem key={g.id} goal={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
