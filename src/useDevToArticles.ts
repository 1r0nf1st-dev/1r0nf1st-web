import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface DevToArticle {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
  thumbnailUrl: string | null;
  readingTime: number;
  tags: string[];
  reactions: number;
  comments: number;
}

interface DevToArticlesState {
  articles: DevToArticle[] | null;
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

export function useDevToArticles(
  limit?: number,
  source?: 'username' | 'tag' | 'latest' | 'top',
  tag?: string,
  onlyWithImages?: boolean,
): DevToArticlesState {
  const [state, setState] = useState<DevToArticlesState>({
    articles: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.set('limit', String(limit));
    }
    if (onlyWithImages) {
      searchParams.set('onlyWithImages', 'true');
    }

    let url = `${getApiBase()}/devto/articles`;
    
    // Determine which endpoint to use
    if (source === 'tag') {
      if (!tag) {
        // Fallback to latest if tag is not provided
        url = `${getApiBase()}/devto/latest`;
      } else {
        url = `${getApiBase()}/devto/tag/${encodeURIComponent(tag)}`;
      }
    } else if (source === 'latest') {
      url = `${getApiBase()}/devto/latest`;
    } else if (source === 'top') {
      url = `${getApiBase()}/devto/top`;
      searchParams.set('period', 'week'); // Default to weekly top articles
    }

    const fullUrl = `${url}?${searchParams.toString()}`;

    getJson<DevToArticle[]>(fullUrl)
      .then((articles) => {
        if (isCancelled) return;
        setState({ articles, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching Dev.to articles.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ articles: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [limit, source, tag, onlyWithImages]);

  return state;
}
