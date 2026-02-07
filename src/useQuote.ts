import { useCallback, useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface QuoteData {
  id: string;
  content: string;
  author: string;
  tags: string[];
}

interface QuoteState {
  quote: QuoteData | null;
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

export function useQuote(): QuoteState {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${getApiBase()}/quote/random`;
      const quoteData = await getJson<QuoteData>(url);
      setQuote(quoteData);
      setIsLoading(false);
    } catch (err: unknown) {
      let message = 'Something went wrong fetching the quote.';
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
    // Fetch quote on mount
    let isCancelled = false;
    // Initialize loading state before async fetch - this is a valid pattern for data fetching hooks
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setIsLoading(true);
    setError(null);

    const url = `${getApiBase()}/quote/random`;
    getJson<QuoteData>(url)
      .then((quoteData) => {
        if (!isCancelled) {
          setQuote(quoteData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching the quote.';
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
    quote,
    isLoading,
    error,
    refetch: fetchQuote,
  };
}
