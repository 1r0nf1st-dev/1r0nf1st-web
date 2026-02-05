import { Router } from 'express';
import { fetchRandomJoke } from '../services/jokeService.js';

export const jokeRouter = Router();

jokeRouter.get('/random', async (_req, res) => {
  try {
    const joke = await fetchRandomJoke();
    res.json(joke);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch joke';
    const status =
      error instanceof Error && 'status' in error
        ? (error.status as number)
        : 500;
    const isNetworkError =
      message === 'fetch failed' ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT');
    res
      .status(status)
      .json({
        error: isNetworkError
          ? 'Joke service is temporarily unreachable. Check your network or try again later.'
          : message,
      });
  }
});
