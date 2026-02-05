import type { JSX } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGoals, createGoal, updateGoal, deleteGoal } from '../useGoals';
import { GoalCard } from './GoalCard';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost, btnPrimary } from '../styles/buttons';
import { FaPlus, FaBullseye, FaLock } from 'react-icons/fa';
import type { Goal } from '../useGoals';

export const GoalTracker = (): JSX.Element | null => {
  const { user } = useAuth();
  const location = useLocation();
  const { goals, isLoading, error, refetch } = useGoals();
  const [isCreating, setIsCreating] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      alert('Please enter a goal title');
      return;
    }

    try {
      await createGoal(
        newGoalTitle.trim(),
        newGoalDescription.trim() || undefined,
        newGoalTargetDate || undefined,
      );
      setNewGoalTitle('');
      setNewGoalDescription('');
      setNewGoalTargetDate('');
      setIsCreating(false);
      await refetch();
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    // Convert null to undefined to match updateGoal signature
    const cleanUpdates: {
      title?: string;
      description?: string;
      target_date?: string;
      progress_percentage?: number;
      status?: 'active' | 'completed' | 'paused' | 'cancelled';
    } = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && {
        description: updates.description === null ? undefined : updates.description,
      }),
      ...(updates.target_date !== undefined && {
        target_date: updates.target_date === null ? undefined : updates.target_date,
      }),
      ...(updates.progress_percentage !== undefined && {
        progress_percentage: updates.progress_percentage,
      }),
      ...(updates.status !== undefined && { status: updates.status }),
    };
    await updateGoal(goalId, cleanUpdates);
    await refetch();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    await refetch();
  };

  if (isLoading) {
    return (
      <article className={cardClasses} id="goals">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>
          <FaBullseye className="inline mr-2" />
          Goals
        </h2>
        <p className={cardBody}>Loading your goals…</p>
      </article>
    );
  }

  // Show login instructions if user is not authenticated
  if (!user || error?.includes('log in') || error?.includes('authenticated')) {
    return (
      <div className="md:col-span-3">
        <article className={cardClasses} id="goals">
          <div className={cardOverlay} aria-hidden />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <FaLock className="text-2xl text-primary" />
            <h2 className={`${cardTitle} m-0`}>
              <FaBullseye className="inline mr-2" />
              Goal Tracker
            </h2>
          </div>
          <div className={cardBody}>
            <p className="mb-4">
              To use the Goal Tracker, you need to be logged in. This feature allows you to:
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2 text-sm opacity-90">
              <li>Create and track your personal goals</li>
              <li>Set target dates and track progress</li>
              <li>Add milestones to break down your goals</li>
              <li>Monitor your achievements over time</li>
            </ul>
            <div className="flex gap-3 justify-start items-center">
              <Link
                to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
                className={`${btnBase} ${btnPrimary} text-sm py-2 px-8 whitespace-nowrap`}
              >
                Log In
              </Link>
              <Link
                to="/projects"
                className={`${btnBase} ${btnGhost} text-sm py-2 px-8 whitespace-nowrap`}
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </article>
      </div>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="goals">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>
          <FaBullseye className="inline mr-2" />
          Goals
        </h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  const activeGoals = goals?.filter((g) => g.status === 'active') || [];
  const completedGoals = goals?.filter((g) => g.status === 'completed') || [];
  const otherGoals = goals?.filter((g) => g.status !== 'active' && g.status !== 'completed') || [];

  return (
    <>
      <article className={cardClasses} id="goals">
        <div className={cardOverlay} aria-hidden />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h2 className={`${cardTitle} m-0`}>
            <FaBullseye className="inline mr-2" />
            Goals
          </h2>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className={`${btnBase} ${btnGhost} text-sm py-2 px-4 flex items-center gap-2`}
            >
              <FaPlus />
              New Goal
            </button>
          )}
        </div>

        {isCreating && (
          <div className={`${cardBody} mb-4 p-4 border-2 border-primary/35 dark:border-border rounded-lg`}>
            <h3 className="text-lg font-semibold mb-3">Create New Goal</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="new-goal-title" className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-goal-title"
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-primary/35 dark:border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter goal title"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGoal();
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="new-goal-description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="new-goal-description"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-primary/35 dark:border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter goal description (optional)"
                />
              </div>
              <div>
                <label htmlFor="new-goal-date" className="block text-sm font-medium mb-1">
                  Target Date
                </label>
                <input
                  id="new-goal-date"
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-primary/35 dark:border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGoal}
                  className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}
                >
                  Create Goal
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewGoalTitle('');
                    setNewGoalDescription('');
                    setNewGoalTargetDate('');
                  }}
                  className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {(!goals || goals.length === 0) && !isCreating && (
          <p className={cardBody}>
            No goals yet. Click "New Goal" to create your first goal!
          </p>
        )}
      </article>

      {activeGoals.length > 0 && (
        <>
          {activeGoals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
              id={index === 0 ? 'goals-active' : undefined}
            />
          ))}
        </>
      )}

      {otherGoals.length > 0 && (
        <>
          {otherGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </>
      )}

      {completedGoals.length > 0 && (
        <>
          {completedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </>
      )}
    </>
  );
};
