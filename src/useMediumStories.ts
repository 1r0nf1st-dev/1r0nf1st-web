import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface MediumStory {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
  thumbnailUrl: string | null;
}

interface MediumStoriesState {
  stories: MediumStory[] | null;
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

export function useMediumStories(limit?: number): MediumStoriesState {
  const [state, setState] = useState<MediumStoriesState>({
    stories: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.set('limit', String(limit));
    }
    const url = `${getApiBase()}/medium/stories?${searchParams.toString()}`;

    getJson<MediumStory[]>(url)
      .then((stories) => {
        if (isCancelled) return;
        setState({ stories, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching Medium stories.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ stories: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [limit]);

  return state;
}
