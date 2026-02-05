import { Router } from 'express';
import {
  fetchDevToArticles,
  fetchDevToArticlesByTag,
  fetchDevToLatestArticles,
  fetchDevToTopArticles,
  fetchDevToArticlesByUsername,
} from '../services/devtoService.js';

export const devtoRouter = Router();

// Fetch articles by configured username (your articles)
devtoRouter.get('/articles', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const onlyWithImages = req.query.onlyWithImages === 'true';

    const articles = await fetchDevToArticles({ limit, onlyWithImages });
    res.json(articles);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Dev.to articles';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});

// Fetch articles by tag (e.g., /api/devto/tag/javascript)
devtoRouter.get('/tag/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const onlyWithImages = req.query.onlyWithImages === 'true';

    const articles = await fetchDevToArticlesByTag(tag, { limit, onlyWithImages });
    res.json(articles);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Dev.to articles by tag';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});

// Fetch latest articles from Dev.to
devtoRouter.get('/latest', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const onlyWithImages = req.query.onlyWithImages === 'true';

    const articles = await fetchDevToLatestArticles({ limit, onlyWithImages });
    res.json(articles);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch latest Dev.to articles';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});

// Fetch top articles from Dev.to
devtoRouter.get('/top', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const period = (req.query.period as 'week' | 'month' | 'year' | 'infinity') || 'week';
    const onlyWithImages = req.query.onlyWithImages === 'true';

    const articles = await fetchDevToTopArticles({ limit, period, onlyWithImages });
    res.json(articles);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch top Dev.to articles';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});

// Fetch articles by any username (e.g., /api/devto/user/ben)
devtoRouter.get('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;
    const onlyWithImages = req.query.onlyWithImages === 'true';

    const articles = await fetchDevToArticlesByUsername(username, { limit, onlyWithImages });
    res.json(articles);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Dev.to articles by username';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
