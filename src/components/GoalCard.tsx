import type { JSX } from 'react';
import { useState } from 'react';
import type { Goal } from '../useGoals';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';
import { FaCheckCircle, FaCircle, FaTrash, FaEdit, FaFlag } from 'react-icons/fa';

export interface GoalCardProps {
  goal: Goal;
  onUpdate: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  id?: string;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'No target date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusColor(status: Goal['status']): string {
  switch (status) {
    case 'completed':
      return 'text-green-500 dark:text-green-400';
    case 'paused':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'cancelled':
      return 'text-red-500 dark:text-red-400';
    default:
      return 'text-primary';
  }
}

function getStatusLabel(status: Goal['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Active';
  }
}

export const GoalCard = ({
  goal,
  onUpdate,
  onDelete,
  id,
}: GoalCardProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description || '');
  const [editProgress, setEditProgress] = useState(goal.progress_percentage);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      await onUpdate(goal.id, {
        title: editTitle,
        description: editDescription,
        progress_percentage: editProgress,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: Goal['status']) => {
    try {
      await onUpdate(goal.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update goal status:', error);
      alert('Failed to update goal status. Please try again.');
    }
  };

  const completedMilestones = goal.milestones?.filter((m) => m.completed).length || 0;
  const totalMilestones = goal.milestones?.length || 0;

  return (
    <article className={cardClasses} id={id}>
      <div className={cardOverlay} aria-hidden />
      <div className={`${cardBody} flex flex-col h-full`}>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label htmlFor={`goal-title-${goal.id}`} className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                id={`goal-title-${goal.id}`}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary/35 dark:border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Goal title"
              />
            </div>
            <div>
              <label
                htmlFor={`goal-description-${goal.id}`}
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <textarea
                id={`goal-description-${goal.id}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border-2 border-primary/35 dark:border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Goal description"
              />
            </div>
            <div>
              <label
                htmlFor={`goal-progress-${goal.id}`}
                className="block text-sm font-medium mb-1"
              >
                Progress: {editProgress}%
              </label>
              <input
                id={`goal-progress-${goal.id}`}
                type="range"
                min="0"
                max="100"
                value={editProgress}
                onChange={(e) => setEditProgress(Number.parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(goal.title);
                  setEditDescription(goal.description || '');
                  setEditProgress(goal.progress_percentage);
                }}
                className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className={`${cardTitle} text-lg mb-1`}>{goal.title}</h3>
                <div className="flex items-center gap-2 text-xs opacity-70 mb-2">
                  <span className={getStatusColor(goal.status)}>
                    {getStatusLabel(goal.status)}
                  </span>
                  {goal.target_date && (
                    <>
                      <span>•</span>
                      <span>
                        <FaFlag className="inline mr-1" />
                        {formatDate(goal.target_date)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-muted hover:text-foreground transition-colors"
                  aria-label="Edit goal"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                  aria-label="Delete goal"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {goal.description && (
              <p className="text-sm opacity-80 mb-3">{goal.description}</p>
            )}

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span className="font-medium">{goal.progress_percentage}%</span>
              </div>
              <div className="w-full h-2 bg-surface-soft rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${goal.progress_percentage}%` }}
                />
              </div>
            </div>

            {totalMilestones > 0 && (
              <div className="mb-3 text-xs opacity-70">
                Milestones: {completedMilestones}/{totalMilestones} completed
              </div>
            )}

            {isExpanded && goal.milestones && goal.milestones.length > 0 && (
              <div className="mb-3 space-y-2">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 text-sm p-2 bg-surface-soft/50 rounded"
                  >
                    {milestone.completed ? (
                      <FaCheckCircle className="text-green-500 shrink-0" />
                    ) : (
                      <FaCircle className="text-muted shrink-0" />
                    )}
                    <span
                      className={milestone.completed ? 'line-through opacity-60' : ''}
                    >
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-3 flex gap-2 flex-wrap">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`${btnBase} ${btnGhost} text-xs py-1.5 px-3`}
              >
                {isExpanded ? 'Hide' : 'Show'} Details
              </button>
              {goal.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className={`${btnBase} ${btnGhost} text-xs py-1.5 px-3`}
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange('paused')}
                    className={`${btnBase} ${btnGhost} text-xs py-1.5 px-3`}
                  >
                    Pause
                  </button>
                </>
              )}
              {goal.status === 'paused' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className={`${btnBase} ${btnGhost} text-xs py-1.5 px-3`}
                >
                  Resume
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
};
