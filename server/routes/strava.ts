import { Router } from 'express';
import {
  fetchTotals,
  getAuthUrl,
  exchangeCodeForTokens,
} from '../services/stravaService.js';

export const stravaRouter = Router();

stravaRouter.get('/auth', (_req, res) => {
  try {
    const url = getAuthUrl();
    res.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Strava auth not configured';
    res.status(500).json({ error: message });
  }
});

stravaRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  const errorParam = req.query.error as string | undefined;

  if (errorParam) {
    res.status(400).send(
      `<p>Strava authorization failed: ${errorParam}</p><p><a href="/api/strava/auth">Try again</a></p>`,
    );
    return;
  }

  if (!code) {
    res.status(400).send(
      '<p>Missing authorization code.</p><p><a href="/api/strava/auth">Authorize with Strava</a></p>',
    );
    return;
  }

  try {
    const { refreshToken } = await exchangeCodeForTokens(code);
    res.send(
      `<p>Success! Add this to your <code>.env</code> file:</p><pre>STRAVA_REFRESH_TOKEN=${refreshToken}</pre><p>Then restart the server.</p>`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    res.status(500).send(`<p>Error: ${message}</p>`);
  }
});

stravaRouter.get('/totals', async (_req, res) => {
  try {
    const totals = await fetchTotals();
    res.json(totals);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Strava totals';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
