'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useGoals, createGoal, updateGoal, deleteGoal } from '../useGoals';
import type { Goal } from '../useGoals';
import { Skeleton } from './Skeleton';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import { Target, Plus, Lock, Pencil, Trash2 } from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';

const ACTIVE_LIMIT = 5;

export function GoalTrackerWidget(): JSX.Element {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { goals, isLoading, error, refetch } = useGoals();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeGoals = goals?.filter((g) => g.status === 'active') || [];
  const displayedGoals = activeGoals.slice(0, ACTIVE_LIMIT);

  const handleAddGoal = async () => {
    if (!newTitle.trim()) {
      setAddError('Please enter a goal title');
      return;
    }
    setAddError(null);
    try {
      await createGoal(newTitle.trim(), undefined, newTargetDate || undefined);
      setNewTitle('');
      setNewTargetDate('');
      setIsAdding(false);
      await refetch();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Failed to create goal. Please try again.',
      );
      showAlert(
        err instanceof Error ? err.message : 'Failed to create goal.',
        'Error',
      );
    }
  };

  const handleUpdateProgress = async (goal: Goal, progress: number) => {
    try {
      await updateGoal(goal.id, { progress_percentage: progress });
      setEditingId(null);
      await refetch();
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : 'Failed to update goal.',
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
        err instanceof Error ? err.message : 'Failed to delete goal.',
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
        aria-labelledby="goals-widget-heading"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="goals-widget-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Goals
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>Log in to track your goals.</span>
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
        aria-labelledby="goals-widget-heading"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="goals-widget-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted"
          >
            Goals
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
        aria-labelledby="goals-widget-heading"
      >
        <h2
          id="goals-widget-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted mb-2"
        >
          Goals
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface p-4 ${
        'md:rounded-xl'
      }`}
      aria-labelledby="goals-widget-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <h2
            id="goals-widget-heading"
            className={`text-sm font-semibold uppercase tracking-wider text-muted ${
              'tracking-widest'
            }`}
          >
            Goals
          </h2>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`${btnBase} ${btnGhost} text-xs py-1.5 px-2 flex items-center gap-1.5`}
            aria-label="Add goal"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>

      {isAdding && (
        <div className="space-y-2 mb-4 p-3 border border-primary/20 dark:border-border rounded-xl">
          {addError && (
            <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>
          )}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Goal title"
            className="w-full px-3 py-2 text-sm border border-primary/30 dark:border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <input
            type="date"
            value={newTargetDate}
            onChange={(e) => setNewTargetDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-primary/30 dark:border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddGoal}
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
                setNewTargetDate('');
                setAddError(null);
              }}
              className={`${btnBase} ${btnGhost} text-sm py-2 px-3`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {displayedGoals.length === 0 && !isAdding && (
        <p className="text-sm text-muted py-2">
          No active goals. Click &quot;Add&quot; to create one.
        </p>
      )}

      <div className="space-y-3">
        {displayedGoals.map((goal) => (
          <div
            key={goal.id}
            className="p-3 rounded-xl border border-primary/10 dark:border-border bg-surface-soft/30 min-h-[44px] touch-manipulation"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {goal.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(editingId === goal.id ? null : goal.id);
                    setEditProgress(goal.progress_percentage);
                  }}
                  className="p-1.5 text-muted hover:text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Edit progress for ${goal.title}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(goal.id)}
                  disabled={deletingId === goal.id}
                  className="p-1.5 text-muted hover:text-red-600 dark:hover:text-red-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 touch-manipulation"
                  aria-label={`Delete ${goal.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {editingId === goal.id ? (
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) =>
                    setEditProgress(Number.parseInt(e.target.value, 10))
                  }
                  className="w-full"
                  aria-label={`Progress: ${editProgress}%`}
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>{editProgress}%</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateProgress(goal, editProgress)}
                    className={`${btnBase} ${btnPrimary} text-xs py-1 px-2`}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">Progress</span>
                  <span className="font-medium">{goal.progress_percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${goal.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {activeGoals.length > ACTIVE_LIMIT && (
        <p className="text-xs text-muted mt-2">
          +{activeGoals.length - ACTIVE_LIMIT} more active goals
        </p>
      )}
    </section>
  );
}
