const QUOTABLE_API = 'https://api.quotable.io';
const ZENQUOTES_API = 'https://zenquotes.io/api';

export interface QuoteData {
  id: string;
  content: string;
  author: string;
  tags: string[];
}

interface QuotableResponse {
  _id: string;
  content: string;
  author: string;
  tags?: string[];
  authorSlug?: string;
  length?: number;
  dateAdded?: string;
  dateModified?: string;
}

/** ZenQuotes returns [{ q, a, i?, c?, h? }] */
interface ZenQuotesItem {
  q?: string;
  a?: string;
  i?: string;
  c?: string;
  h?: string;
}

async function fetchFromQuotable(): Promise<QuoteData> {
  const url = `${QUOTABLE_API}/random`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Quotable failed: ${response.status}`);
  }
  const data = (await response.json()) as QuotableResponse;
  return {
    id: data._id,
    content: data.content ?? '',
    author: data.author ?? 'Unknown',
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

async function fetchFromZenQuotes(): Promise<QuoteData> {
  const url = `${ZENQUOTES_API}/random`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `ZenQuotes failed: ${response.status}`);
  }
  const arr = (await response.json()) as ZenQuotesItem[];
  const item = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  if (!item || typeof item.q !== 'string') {
    throw new Error('ZenQuotes returned no quote');
  }
  return {
    id: `zen-${Date.now()}`,
    content: item.q,
    author: typeof item.a === 'string' ? item.a : 'Unknown',
    tags: [],
  };
}

/** Fallback quotes when external APIs are down */
const FALLBACK_QUOTES: QuoteData[] = [
  { id: 'fb-1', content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', tags: ['work', 'passion'] },
  { id: 'fb-2', content: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', tags: ['persistence'] },
  { id: 'fb-3', content: 'Quality is not an act, it is a habit.', author: 'Aristotle', tags: ['quality', 'habit'] },
  { id: 'fb-4', content: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', tags: ['action', 'time'] },
  { id: 'fb-5', content: 'We cannot solve our problems with the same thinking we used when we created them.', author: 'Albert Einstein', tags: ['thinking', 'problems'] },
];

function getFallbackQuote(): QuoteData {
  const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[index];
}

export async function fetchRandomQuote(): Promise<QuoteData> {
  try {
    return await fetchFromQuotable();
  } catch {
    try {
      return await fetchFromZenQuotes();
    } catch {
      return getFallbackQuote();
    }
  }
}
