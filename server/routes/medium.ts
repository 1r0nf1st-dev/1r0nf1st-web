import { Router } from 'express';
import { fetchMediumStories } from '../services/mediumService.js';

export const mediumRouter = Router();

mediumRouter.get('/stories', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;

    const stories = await fetchMediumStories({ limit });
    res.json(stories);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Medium stories';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
