'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useGoals, createGoal, updateGoal, deleteGoal } from '../useGoals';
import type { Goal } from '../useGoals';
import { Skeleton } from './Skeleton';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import { Target, Plus, Check, Circle, Lock, Trash2 } from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';

const TODAY = new Date().toISOString().slice(0, 10);

function formatTaskDate(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TasksWidgetProps {
  /** When provided, shows "Daily view" link to open full daily todo view */
  onViewDaily?: () => void;
}

export function TasksWidget({ onViewDaily }: TasksWidgetProps): JSX.Element {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { goals, isLoading, error, refetch } = useGoals();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayGoals =
    goals?.filter((g) => g.status === 'active' && g.target_date === TODAY) || [];
  const upcomingGoals =
    goals?.filter(
      (g) =>
        g.status === 'active' &&
        g.target_date &&
        g.target_date > TODAY,
    ) || [];
  const noDateGoals =
    goals?.filter((g) => g.status === 'active' && !g.target_date) || [];
  const hasTasks =
    todayGoals.length > 0 ||
    upcomingGoals.length > 0 ||
    noDateGoals.length > 0;

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await createGoal(newTitle.trim(), undefined, TODAY);
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

  if (!user) {
    return (
      <section
        className={`rounded-xl border border-primary/20 dark:border-border bg-white/50 dark:bg-surface/50 p-4 ${
          'md:rounded-xl'
        }`}
        aria-labelledby="tasks-widget-heading"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="tasks-widget-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Tasks
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
      </section>
    );
  }

  if (isLoading) {
    return (
      <section
        className={`rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface p-4 ${
          'md:rounded-xl'
        }`}
        aria-labelledby="tasks-widget-heading"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="tasks-widget-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Tasks
          </h2>
        </div>
        <div aria-busy>
          <Skeleton className="mb-2 h-6 w-full" />
          <Skeleton className="mb-2 h-6 w-4/5" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={`rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface p-4 ${
          'md:rounded-xl'
        }`}
        aria-labelledby="tasks-widget-heading"
      >
        <h2
          id="tasks-widget-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted mb-2"
        >
          Tasks
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

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
      {showDate && (
        <span className="text-xs text-muted shrink-0">
          {formatTaskDate(goal.target_date)}
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

  return (
    <section
      className={`rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface p-4 ${
        'md:rounded-xl'
      }`}
      aria-labelledby="tasks-widget-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="tasks-widget-heading"
            className={`text-sm font-semibold uppercase tracking-wider text-muted ${
              'tracking-widest'
            }`}
          >
            Today
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onViewDaily && hasTasks && !isAdding && (
            <button
              type="button"
              onClick={onViewDaily}
              className="text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-1"
              aria-label="Open daily tasks view"
            >
              Daily view
            </button>
          )}
          {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`${btnBase} ${btnGhost} text-xs py-1.5 px-2 flex items-center gap-1.5`}
            aria-label="Add task"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
        </div>
      </div>

      {isAdding && (
        <div className="flex gap-2 mb-3">
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

      {!hasTasks && !isAdding && (
        <p className="text-sm text-muted py-2">
          No tasks for today. Click &quot;Add&quot; to create one.
        </p>
      )}

      {todayGoals.length > 0 && (
        <div className="space-y-0">
          {todayGoals.map((g) => (
            <TaskItem key={g.id} goal={g} />
          ))}
        </div>
      )}

      {upcomingGoals.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mt-4 mb-2">
            Upcoming
          </h3>
          <div className="space-y-0">
            {upcomingGoals.slice(0, 3).map((g) => (
              <TaskItem key={g.id} goal={g} showDate />
            ))}
          </div>
        </>
      )}

      {noDateGoals.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mt-4 mb-2">
            No date
          </h3>
          <div className="space-y-0">
            {noDateGoals.slice(0, 3).map((g) => (
              <TaskItem key={g.id} goal={g} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
