import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { brainMarkdownUrlTransform } from '../../utils/brainMarkdownUrlTransform';
import { obBrainMarkdownComponents } from './brainMarkdownPreview';

vi.mock('../../lib/brainPasteImage', async () => {
  const actual = await vi.importActual<typeof import('../../lib/brainPasteImage')>(
    '../../lib/brainPasteImage',
  );
  return {
    ...actual,
    fetchOpenBrainAttachmentDownloadUrl: vi.fn().mockResolvedValue({
      downloadUrl: 'https://signed.example.test/img.png',
    }),
  };
});

describe('Open Brain markdown preview pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes ob-attach src into img resolver so preview can load (regression: defaultUrlTransform cleared src)', async () => {
    const id = '8a23d77e-db0b-4112-997f-3f956fe1adb0';
    const md = `![image](ob-attach:${id})`;

    render(
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={brainMarkdownUrlTransform}
        components={obBrainMarkdownComponents}
      >
        {md}
      </Markdown>,
    );

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'image' });
      expect(img).toHaveAttribute('src', 'https://signed.example.test/img.png');
    });
  });
});
