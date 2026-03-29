import { describe, it, expect } from 'vitest';
import {
  stripEphemeralImagesFromTipTapDoc,
  tipTapDocMayContainEphemeralImages,
} from './sanitizeTipTapDoc';

describe('stripEphemeralImagesFromTipTapDoc', () => {
  it('replaces image with blob src with italic placeholder text', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            {
              type: 'image',
              attrs: { src: 'blob:https://example.com/uuid-123' },
            },
          ],
        },
      ],
    };
    const out = stripEphemeralImagesFromTipTapDoc(doc);
    expect(out.content).toHaveLength(1);
    const p = (out.content as unknown[])[0] as { type: string; content: unknown[] };
    expect(p.type).toBe('paragraph');
    expect(p.content).toHaveLength(2);
    const text = p.content[1] as { type: string; text: string; marks?: unknown[] };
    expect(text.type).toBe('text');
    expect(text.text).toContain('Pasted image');
    expect(text.marks).toEqual([{ type: 'italic' }]);
  });

  it('leaves https image src unchanged', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: { src: 'https://cdn.example.com/x.png' },
            },
          ],
        },
      ],
    };
    const out = stripEphemeralImagesFromTipTapDoc(doc);
    expect(out).toEqual(doc);
  });

  it('recurses into nested content', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'image', attrs: { src: 'file:///tmp/x.png' } }],
            },
          ],
        },
      ],
    };
    const out = stripEphemeralImagesFromTipTapDoc(doc);
    const bq = (out.content as unknown[])[0] as { content: unknown[] };
    const p = bq.content[0] as { content: unknown[] };
    expect((p.content[0] as { type: string }).type).toBe('text');
  });

  it('preserves blob src when listed in preserveEphemeralSrcs', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: { src: 'blob:https://example.com/keep-me' },
            },
          ],
        },
      ],
    };
    const out = stripEphemeralImagesFromTipTapDoc(
      doc,
      new Set(['blob:https://example.com/keep-me']),
    );
    expect(out).toEqual(doc);
  });
});

describe('tipTapDocMayContainEphemeralImages', () => {
  it('returns true when blob src present', () => {
    expect(
      tipTapDocMayContainEphemeralImages({
        type: 'doc',
        content: [{ type: 'image', attrs: { src: 'blob:https://x/y' } }],
      }),
    ).toBe(true);
  });

  it('returns false for clean doc', () => {
    expect(
      tipTapDocMayContainEphemeralImages({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
      }),
    ).toBe(false);
  });
});
