import { Router } from 'express';
import { fetchUserRepos } from '../services/githubService.js';

export const githubRouter = Router();

githubRouter.get('/repos', async (req, res) => {
  try {
    const username = (req.query.username as string) || undefined;
    const perPage = req.query.perPage
      ? Number.parseInt(req.query.perPage as string, 10)
      : undefined;

    const repos = await fetchUserRepos(username, { perPage });
    res.json(repos);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
    const status = error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
