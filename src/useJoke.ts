import { useCallback, useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface JokeData {
  id: string;
  setup: string;
  punchline: string;
  type?: string;
}

interface JokeState {
  joke: JokeData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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

export function useJoke(): JokeState {
  const [state, setState] = useState<JokeState>({
    joke: null,
    isLoading: true,
    error: null,
    refetch: () => {},
  });

  const fetchJoke = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const url = `${getApiBase()}/joke/random`;

    getJson<JokeData>(url)
      .then((joke) => {
        setState({ joke, isLoading: false, error: null, refetch: fetchJoke });
      })
      .catch((error: unknown) => {
        let message = 'Something went wrong fetching the joke.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({
          joke: null,
          isLoading: false,
          error: message,
          refetch: fetchJoke,
        });
      });
  }, []);

  useEffect(() => {
    setState((prev) => ({ ...prev, refetch: fetchJoke }));
  }, [fetchJoke]);

  useEffect(() => {
    fetchJoke();
  }, [fetchJoke]);

  return state;
}
