/**
 * Build TipTap document content from clipped web content.
 * Sanitizes input and produces safe JSON for note storage.
 */

import { stripHtmlAndScripts } from './sanitize.js';

/** Ensure URL is a safe http/https link. */
function sanitizeUrl(url: string): string {
  if (typeof url !== 'string' || !url.trim()) return '';
  const s = url.trim();
  if (s.startsWith('https://') || s.startsWith('http://')) {
    return s.slice(0, 2048);
  }
  return '';
}

/** Build TipTap doc JSON from clipped HTML and source URL. */
export function buildClipContent(
  rawHtml: string,
  sourceUrl: string,
  sourceTitle: string,
  maxContentLength = 50000,
): Record<string, unknown> {
  const plain = stripHtmlAndScripts(typeof rawHtml === 'string' ? rawHtml : '');
  const safeContent = plain.slice(0, maxContentLength).trim();
  const url = sanitizeUrl(sourceUrl);
  const title = typeof sourceTitle === 'string' ? sourceTitle.slice(0, 500).trim() : '';

  const content: Record<string, unknown>[] = [];

  if (url) {
    const linkText = title || url;
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'link', attrs: { href: url } }],
          text: `Source: ${linkText}`,
        },
      ],
    });
    content.push({ type: 'paragraph', content: [] });
  }

  if (safeContent) {
    const paragraphs = safeContent.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length === 0) {
      content.push({ type: 'paragraph', content: [{ type: 'text', text: safeContent }] });
    } else {
      for (const p of paragraphs) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: p.replace(/\n/g, ' ').trim() }],
        });
      }
    }
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }

  return { type: 'doc', content };
}
