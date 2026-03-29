import { describe, it, expect } from 'vitest';
import { getClipboardImageFiles, type ClipboardDataEvent } from './clipboardImageFiles';

describe('getClipboardImageFiles', () => {
  it('collects image files from DataTransferItem list', () => {
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    const event = {
      clipboardData: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
        files: [],
      },
    } as unknown as ClipboardDataEvent;

    expect(getClipboardImageFiles(event)).toEqual([file]);
  });

  it('falls back to clipboardData.files when items yield nothing', () => {
    const file = new File(['x'], 'q.jpg', { type: 'image/jpeg' });
    const event = {
      clipboardData: {
        items: [],
        files: [file],
      },
    } as unknown as ClipboardDataEvent;

    expect(getClipboardImageFiles(event)).toEqual([file]);
  });

  it('skips non-image file entries', () => {
    const event = {
      clipboardData: {
        items: [
          {
            kind: 'file',
            type: 'application/pdf',
            getAsFile: () => new File(['x'], 'a.pdf', { type: 'application/pdf' }),
          },
        ],
        files: [],
      },
    } as unknown as ClipboardDataEvent;

    expect(getClipboardImageFiles(event)).toEqual([]);
  });
});
