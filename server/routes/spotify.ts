import { Router } from 'express';
import {
  fetchRecentlyPlayed,
  getAuthUrl,
  exchangeCodeForTokens,
} from '../services/spotifyService.js';

export const spotifyRouter = Router();

spotifyRouter.get('/auth', (_req, res) => {
  try {
    const url = getAuthUrl();
    res.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Spotify auth not configured';
    res.status(500).json({ error: message });
  }
});

spotifyRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  const errorParam = req.query.error as string | undefined;

  if (errorParam) {
    res.status(400).send(
      `<p>Spotify authorization failed: ${errorParam}</p><p><a href="/api/spotify/auth">Try again</a></p>`,
    );
    return;
  }

  if (!code) {
    res.status(400).send(
      '<p>Missing authorization code.</p><p><a href="/api/spotify/auth">Authorize with Spotify</a></p>',
    );
    return;
  }

  try {
    const { refreshToken } = await exchangeCodeForTokens(code);
    res.send(
      `<p>Success! Add this to your <code>.env</code> file:</p><pre>SPOTIFY_REFRESH_TOKEN=${refreshToken}</pre><p>Then restart the server.</p>`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    res.status(500).send(`<p>Error: ${message}</p>`);
  }
});

spotifyRouter.get('/recently-played', async (req, res) => {
  try {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : undefined;

    const tracks = await fetchRecentlyPlayed({ limit });
    res.json(tracks);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch Spotify data';
    const status =
      error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
