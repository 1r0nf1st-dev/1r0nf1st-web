import { config } from '../config.js';

export interface DevToArticle {
  id: number;
  title: string;
  url: string;
  published_at: string;
  published_timestamp: string;
  user: {
    username: string;
    name: string;
  };
  description: string;
  cover_image: string | null;
  reading_time_minutes: number;
  tags: string[] | string; // Can be array or string from API
  positive_reactions_count: number;
  comments_count: number;
}

export interface DevToArticleFormatted {
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

const DEVTO_API_BASE = 'https://dev.to/api';

function formatArticles(
  articles: DevToArticle[],
  options?: { onlyWithImages?: boolean; limit?: number },
): DevToArticleFormatted[] {
  if (articles.length === 0) {
    return [];
  }

  // Filter articles with images if requested
  let filteredArticles = articles;
  if (options?.onlyWithImages) {
    filteredArticles = articles.filter(
      (article) => article.cover_image && article.cover_image.trim() !== '',
    );
  }

  // Apply limit after filtering
  if (options?.limit && filteredArticles.length > options.limit) {
    filteredArticles = filteredArticles.slice(0, options.limit);
  }

  return filteredArticles.map((article) => {
    // Handle tags - Dev.to API returns tags as an array of strings
    // But sometimes it might be a string, so we handle both cases
    let tags: string[] = [];
    if (Array.isArray(article.tags)) {
      tags = article.tags;
    } else if (typeof article.tags === 'string') {
      // Fallback: if tags is a string, split it
      tags = article.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    return {
      title: article.title || 'Untitled',
      link: article.url || '',
      pubDate: article.published_at || article.published_timestamp || new Date().toISOString(),
      author: article.user?.name || article.user?.username || 'Unknown',
      description: article.description || '',
      thumbnailUrl: article.cover_image || null,
      readingTime: article.reading_time_minutes || 0,
      tags,
      reactions: article.positive_reactions_count || 0,
      comments: article.comments_count || 0,
    };
  });
}

async function fetchFromDevToApi(
  url: string,
  options?: { onlyWithImages?: boolean; limit?: number },
): Promise<DevToArticleFormatted[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; PortfolioBot/1.0; +https://github.com/)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Dev.to API request failed: ${response.status} ${response.statusText}. ${errorText || 'Please check your request parameters.'}`,
    );
  }

  const articles = (await response.json()) as DevToArticle[];

  if (!Array.isArray(articles)) {
    throw new Error('Dev.to API returned invalid data.');
  }

  return formatArticles(articles, options);
}

export async function fetchDevToArticles(
  options?: { limit?: number; onlyWithImages?: boolean },
): Promise<DevToArticleFormatted[]> {
  const username = config.devToUsername;

  if (!username) {
    throw new Error(
      'Dev.to username is not configured. Set DEVTO_USERNAME in your .env.',
    );
  }

  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 30);
  const usernameTrimmed = username.trim().replace(/^@/, '');

  // Fetch more articles if filtering by images to ensure we get enough results
  const fetchLimit = options?.onlyWithImages ? limit * 3 : limit;
  const url = `${DEVTO_API_BASE}/articles?username=${encodeURIComponent(usernameTrimmed)}&per_page=${fetchLimit}`;

  return fetchFromDevToApi(url, { ...options, limit });
}

export async function fetchDevToArticlesByTag(
  tag: string,
  options?: { limit?: number; onlyWithImages?: boolean },
): Promise<DevToArticleFormatted[]> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 30);
  const tagTrimmed = tag.trim();

  if (!tagTrimmed) {
    throw new Error('Tag is required to fetch articles by tag.');
  }

  // Fetch more articles if filtering by images to ensure we get enough results
  const fetchLimit = options?.onlyWithImages ? limit * 3 : limit;
  const url = `${DEVTO_API_BASE}/articles?tag=${encodeURIComponent(tagTrimmed)}&per_page=${fetchLimit}`;

  return fetchFromDevToApi(url, { ...options, limit });
}

export async function fetchDevToLatestArticles(
  options?: { limit?: number; onlyWithImages?: boolean },
): Promise<DevToArticleFormatted[]> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 30);

  // Fetch more articles if filtering by images to ensure we get enough results
  const fetchLimit = options?.onlyWithImages ? limit * 3 : limit;
  const url = `${DEVTO_API_BASE}/articles/latest?per_page=${fetchLimit}`;

  return fetchFromDevToApi(url, { ...options, limit });
}

export async function fetchDevToTopArticles(
  options?: { limit?: number; period?: 'week' | 'month' | 'year' | 'infinity'; onlyWithImages?: boolean },
): Promise<DevToArticleFormatted[]> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 30);
  const period = options?.period || 'week';

  // Fetch more articles if filtering by images to ensure we get enough results
  const fetchLimit = options?.onlyWithImages ? limit * 3 : limit;
  const url = `${DEVTO_API_BASE}/articles/top?per_page=${fetchLimit}&top=${period}`;

  return fetchFromDevToApi(url, { ...options, limit });
}

export async function fetchDevToArticlesByUsername(
  username: string,
  options?: { limit?: number; onlyWithImages?: boolean },
): Promise<DevToArticleFormatted[]> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 30);
  const usernameTrimmed = username.trim().replace(/^@/, '');

  if (!usernameTrimmed) {
    throw new Error('Username is required to fetch articles.');
  }

  // Fetch more articles if filtering by images to ensure we get enough results
  const fetchLimit = options?.onlyWithImages ? limit * 3 : limit;
  const url = `${DEVTO_API_BASE}/articles?username=${encodeURIComponent(usernameTrimmed)}&per_page=${fetchLimit}`;

  return fetchFromDevToApi(url, { ...options, limit });
}
