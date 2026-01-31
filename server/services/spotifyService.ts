import { config } from '../config.js';

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  trackName: string;
  artistNames: string;
  albumName: string;
  albumImageUrl: string | null;
  trackUrl: string;
  playedAt: string;
}

async function getAccessToken(): Promise<string> {
  const { spotifyClientId, spotifyClientSecret, spotifyRefreshToken } = config;

  if (!spotifyClientId || !spotifyClientSecret || !spotifyRefreshToken) {
    throw new Error(
      'Spotify is not configured. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN in your .env.',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: spotifyRefreshToken,
  });

  const credentials = Buffer.from(
    `${spotifyClientId}:${spotifyClientSecret}`,
    'utf-8',
  ).toString('base64');

  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Spotify token request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

const SPOTIFY_SCOPE = 'user-read-recently-played';

export function getAuthUrl(): string {
  const { spotifyClientId, spotifyRedirectUri } = config;
  if (!spotifyClientId || !spotifyRedirectUri) {
    throw new Error(
      'Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI in your .env.',
    );
  }
  const params = new URLSearchParams({
    client_id: spotifyClientId,
    response_type: 'code',
    redirect_uri: spotifyRedirectUri,
    scope: SPOTIFY_SCOPE,
    show_dialog: 'true',
  });
  return `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ refreshToken: string }> {
  const { spotifyClientId, spotifyClientSecret, spotifyRedirectUri } = config;
  if (!spotifyClientId || !spotifyClientSecret || !spotifyRedirectUri) {
    throw new Error(
      'Spotify is not configured. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI in your .env.',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyRedirectUri,
  });

  const credentials = Buffer.from(
    `${spotifyClientId}:${spotifyClientSecret}`,
    'utf-8',
  ).toString('base64');

  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Spotify token exchange failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { refresh_token: string };
  return { refreshToken: data.refresh_token };
}

interface SpotifyRecentlyPlayedItem {
  track: {
    name: string;
    artists: Array<{ name: string }>;
    album: { name: string; images: Array<{ url: string }> };
    external_urls: { spotify: string };
  };
  played_at: string;
}

export async function fetchRecentlyPlayed(
  options?: { limit?: number },
): Promise<SpotifyTrack[]> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 50);
  const accessToken = await getAccessToken();

  const url = `${SPOTIFY_API}/me/player/recently-played?limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Spotify token expired or invalid. Re-authorize to get a new refresh token.',
      );
    }
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Spotify API request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    items: SpotifyRecentlyPlayedItem[];
  };

  const items = data.items ?? [];
  return items.map((item) => ({
    trackName: item.track.name,
    artistNames: item.track.artists.map((a) => a.name).join(', '),
    albumName: item.track.album.name,
    albumImageUrl:
      item.track.album.images?.[0]?.url ??
      item.track.album.images?.[1]?.url ??
      null,
    trackUrl: item.track.external_urls.spotify,
    playedAt: item.played_at,
  }));
}
