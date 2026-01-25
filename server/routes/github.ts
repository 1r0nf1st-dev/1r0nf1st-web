import { Router } from 'express';
import { fetchUserRepos, fetchRepoCommits } from '../services/githubService.js';
import { config } from '../config.js';

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

githubRouter.get('/commits', async (req, res) => {
  try {
    const owner = (req.query.owner as string) || config.githubUsername;
    const repo = req.query.repo as string;
    const perPage = req.query.perPage
      ? Number.parseInt(req.query.perPage as string, 10)
      : undefined;

    if (!owner) {
      res.status(400).json({ error: 'GitHub username is not configured. Set GITHUB_USERNAME in your .env.' });
      return;
    }

    if (!repo) {
      res.status(400).json({ error: 'Repo query parameter is required' });
      return;
    }

    const commits = await fetchRepoCommits(owner, repo, { perPage });
    res.json(commits);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch commits';
    const status = error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
