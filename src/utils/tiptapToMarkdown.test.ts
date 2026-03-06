import { describe, it, expect } from 'vitest';
import { tiptapToMarkdown } from './tiptapToMarkdown';

describe('tiptapToMarkdown', () => {
  it('returns empty for invalid input', () => {
    expect(tiptapToMarkdown(null)).toBe('');
    expect(tiptapToMarkdown(undefined)).toBe('');
    expect(tiptapToMarkdown({})).toBe('');
  });

  it('converts paragraph to markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    };
    expect(tiptapToMarkdown(doc)).toBe('Hello world');
  });

  it('converts heading to markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
      ],
    };
    expect(tiptapToMarkdown(doc)).toBe('# Title');
  });

  it('converts bullet list to markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 2' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapToMarkdown(doc)).toContain('Item 1');
    expect(tiptapToMarkdown(doc)).toContain('Item 2');
  });

  it('converts bold and italic', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
          ],
        },
      ],
    };
    expect(tiptapToMarkdown(doc)).toBe('**Bold** and *italic*');
  });

  it('converts link', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Click here',
              marks: [{ type: 'link', attrs: { href: 'https://x.com' } }],
            },
          ],
        },
      ],
    };
    expect(tiptapToMarkdown(doc)).toBe('[Click here](https://x.com)');
  });
});
