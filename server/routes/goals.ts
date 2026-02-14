import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getGoalsByUserId,
  getGoalWithMilestones,
  createGoal,
  updateGoal,
  deleteGoal,
  getMilestonesByGoalId,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../services/goalService.js';
import { sanitizeFreeText } from '../utils/sanitize.js';

const goalsRouter = Router();
const GOAL_TITLE_MAX_LENGTH = 500;
const GOAL_DESCRIPTION_MAX_LENGTH = 5000;
const MILESTONE_TITLE_MAX_LENGTH = 500;
const MILESTONE_DESCRIPTION_MAX_LENGTH = 2000;

// All routes require authentication
goalsRouter.use(authenticateToken);

// Get all goals for the authenticated user
goalsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goals = await getGoalsByUserId(req.userId);
    res.json(goals);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch goals';
    res.status(500).json({ error: message });
  }
});

// Get a single goal by ID with milestones
goalsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const goal = await getGoalWithMilestones(goalId, req.userId);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json(goal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch goal';
    res.status(500).json({ error: message });
  }
});

// Create a new goal
goalsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title, description, target_date, progress_percentage, status } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const goal = await createGoal(req.userId, {
      title: sanitizeFreeText(title.trim(), GOAL_TITLE_MAX_LENGTH),
      description:
        description != null && typeof description === 'string'
          ? sanitizeFreeText(description.trim(), GOAL_DESCRIPTION_MAX_LENGTH)
          : undefined,
      target_date,
      progress_percentage,
      status,
    });

    res.status(201).json(goal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create goal';
    res.status(500).json({ error: message });
  }
});

// Update a goal
goalsRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, description, target_date, progress_percentage, status } = req.body;

    const goal = await updateGoal(goalId, req.userId, {
      title: title != null && typeof title === 'string' ? sanitizeFreeText(title.trim(), GOAL_TITLE_MAX_LENGTH) : undefined,
      description:
        description != null && typeof description === 'string'
          ? sanitizeFreeText(description.trim(), GOAL_DESCRIPTION_MAX_LENGTH)
          : undefined,
      target_date,
      progress_percentage,
      status,
    });

    res.json(goal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update goal';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// Delete a goal
goalsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteGoal(goalId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete goal';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// Get milestones for a goal
goalsRouter.get('/:id/milestones', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const milestones = await getMilestonesByGoalId(goalId, req.userId);
    res.json(milestones);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch milestones';
    res.status(500).json({ error: message });
  }
});

// Create a milestone for a goal
goalsRouter.post('/:id/milestones', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const milestone = await createMilestone(req.userId, {
      goal_id: goalId,
      title: sanitizeFreeText(title.trim(), MILESTONE_TITLE_MAX_LENGTH),
      description:
        description != null && typeof description === 'string'
          ? sanitizeFreeText(description.trim(), MILESTONE_DESCRIPTION_MAX_LENGTH)
          : undefined,
    });

    res.status(201).json(milestone);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create milestone';
    res.status(500).json({ error: message });
  }
});

// Update a milestone
goalsRouter.put('/milestones/:milestoneId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const milestoneId = Array.isArray(req.params.milestoneId)
      ? req.params.milestoneId[0]
      : req.params.milestoneId;
    const { title, description, completed } = req.body;

    const milestone = await updateMilestone(milestoneId, req.userId, {
      title: title != null && typeof title === 'string' ? sanitizeFreeText(title.trim(), MILESTONE_TITLE_MAX_LENGTH) : undefined,
      description:
        description != null && typeof description === 'string'
          ? sanitizeFreeText(description.trim(), MILESTONE_DESCRIPTION_MAX_LENGTH)
          : undefined,
      completed,
    });

    res.json(milestone);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update milestone';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// Delete a milestone
goalsRouter.delete('/milestones/:milestoneId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const milestoneId = Array.isArray(req.params.milestoneId)
      ? req.params.milestoneId[0]
      : req.params.milestoneId;
    await deleteMilestone(milestoneId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete milestone';
    const status =
      error instanceof Error && message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export { goalsRouter };
