import Parser from 'rss-parser';
import { config } from '../config.js';

// Use a browser-like User-Agent so Medium (and other sites) don't block the request
const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; FeedReader/1.0; +https://github.com/)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
});

export interface MediumStory {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
  thumbnailUrl: string | null;
}

function extractFirstImageUrl(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export async function fetchMediumStories(
  options?: { limit?: number },
): Promise<MediumStory[]> {
  const feedUrl = config.mediumFeedUrl;

  if (!feedUrl) {
    throw new Error(
      'Medium feed is not configured. Set MEDIUM_FEED_URL or MEDIUM_USERNAME in your .env.',
    );
  }

  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 20);
  const feedUrlTrimmed = feedUrl.trim();

  // Fetch with browser-like headers (Medium may block or return HTML otherwise)
  const response = await fetch(feedUrlTrimmed, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `Medium feed request failed: ${response.status} ${response.statusText}. Check that MEDIUM_FEED_URL is correct.`,
    );
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);

  const rawItems = feed.items ?? [];
  if (rawItems.length === 0) {
    throw new Error(
      'The feed returned no articles. Check that MEDIUM_FEED_URL is correct (e.g. https://medium.com/feed/@username) and that the Medium account has published posts. Open the URL in a browser to verify.',
    );
  }

  const items = rawItems.slice(0, limit).map((item) => {
    const content = item.content ?? item['content:encoded'] ?? item.contentSnippet ?? '';
    const htmlContent = typeof content === 'string' ? content : '';
    const thumbnailUrl = extractFirstImageUrl(htmlContent);

    return {
      title: item.title ?? 'Untitled',
      link: item.link ?? item.guid ?? '',
      pubDate: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
      author: item.creator ?? item.author ?? feed.title ?? 'Unknown',
      description: htmlContent,
      thumbnailUrl,
    };
  });

  return items;
}
