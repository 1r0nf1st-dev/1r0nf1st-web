import { useEffect, useState } from 'react';
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
  const [state, setState] = useState<QuoteState>({
    quote: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const url = `${getApiBase()}/quote/random`;

    getJson<QuoteData>(url)
      .then((quote) => {
        if (isCancelled) return;
        setState({ quote, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching the quote.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ quote: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
}
