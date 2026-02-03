import { Router } from 'express';
import { fetchRandomQuote } from '../services/quoteService.js';

export const quoteRouter = Router();

quoteRouter.get('/random', async (_req, res) => {
  try {
    const quote = await fetchRandomQuote();
    res.json(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch quote';
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
          ? 'Quote service is temporarily unreachable. Check your network or try again later.'
          : message,
      });
  }
});
