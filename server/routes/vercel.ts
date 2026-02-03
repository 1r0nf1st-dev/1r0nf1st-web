import { Router } from 'express';
import { fetchDeployments } from '../services/vercelService.js';

export const vercelRouter = Router();

vercelRouter.get('/deployments', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const projectId = (req.query.projectId as string) || undefined;

    const data = await fetchDeployments({ limit, projectId });
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch deployments';
    const status = error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
