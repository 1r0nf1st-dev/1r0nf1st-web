import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface SpotifyTrack {
  trackName: string;
  artistNames: string;
  albumName: string;
  albumImageUrl: string | null;
  trackUrl: string;
  playedAt: string;
}

interface SpotifyRecentlyPlayedState {
  tracks: SpotifyTrack[] | null;
  isLoading: boolean;
  error: string | null;
}

function getApiBase(): string {
  let apiBase = '/api';
  if (env.apiBaseUrl && env.apiBaseUrl.trim()) {
    const trimmed = env.apiBaseUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    } else {
      apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    }
  }
  return apiBase;
}

export function useSpotifyRecentlyPlayed(limit?: number): SpotifyRecentlyPlayedState {
  const [state, setState] = useState<SpotifyRecentlyPlayedState>({
    tracks: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.set('limit', String(limit));
    }
    const url = `${getApiBase()}/spotify/recently-played?${searchParams.toString()}`;

    getJson<SpotifyTrack[]>(url)
      .then((tracks) => {
        if (isCancelled) return;
        setState({ tracks, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching Spotify data.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ tracks: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [limit]);

  return state;
}
