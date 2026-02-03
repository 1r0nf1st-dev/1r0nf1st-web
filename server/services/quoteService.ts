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

export async function fetchRandomQuote(): Promise<QuoteData> {
  try {
    return await fetchFromQuotable();
  } catch {
    try {
      return await fetchFromZenQuotes();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Quote services unreachable.';
      throw new Error(
        `Quote service is temporarily unreachable. Check your network or try again later. (${message})`,
      );
    }
  }
}
