import { describe, it, expect } from 'vitest';
import { extractNoteIdsFromContent } from './noteLinks.js';

describe('extractNoteIdsFromContent', () => {
  const noteId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns empty for null or invalid content', () => {
    expect(extractNoteIdsFromContent(null)).toEqual([]);
    expect(extractNoteIdsFromContent(undefined)).toEqual([]);
    expect(extractNoteIdsFromContent('')).toEqual([]);
  });

  it('extracts note ID from link mark with /notes/ href', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'See note',
              marks: [{ type: 'link', attrs: { href: `/notes/${noteId}` } }],
            },
          ],
        },
      ],
    };
    expect(extractNoteIdsFromContent(content)).toEqual([noteId.toLowerCase()]);
  });

  it('extracts multiple unique note IDs', () => {
    const id2 = '660e8400-e29b-41d4-a716-446655440001';
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Link 1',
              marks: [{ type: 'link', attrs: { href: `/notes/${noteId}` } }],
            },
            {
              type: 'text',
              text: 'Link 2',
              marks: [{ type: 'link', attrs: { href: `/notes/${id2}` } }],
            },
          ],
        },
      ],
    };
    const result = extractNoteIdsFromContent(content);
    expect(result).toHaveLength(2);
    expect(result).toContain(noteId.toLowerCase());
    expect(result).toContain(id2.toLowerCase());
  });

  it('ignores external links', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'External',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    };
    expect(extractNoteIdsFromContent(content)).toEqual([]);
  });
});
