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
  const [joke, setJoke] = useState<JokeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoke = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${getApiBase()}/joke/random`;
      const jokeData = await getJson<JokeData>(url);
      setJoke(jokeData);
      setIsLoading(false);
    } catch (err: unknown) {
      let message = 'Something went wrong fetching the joke.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch joke on mount
    let isCancelled = false;
    // Initialize loading state before async fetch - this is a valid pattern for data fetching hooks
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setIsLoading(true);
    setError(null);

    const url = `${getApiBase()}/joke/random`;
    getJson<JokeData>(url)
      .then((jokeData) => {
        if (!isCancelled) {
          setJoke(jokeData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching the joke.';
          if (err instanceof Error) {
            message = err.message;
          } else if (typeof err === 'string') {
            message = err;
          }
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    joke,
    isLoading,
    error,
    refetch: fetchJoke,
  };
}
