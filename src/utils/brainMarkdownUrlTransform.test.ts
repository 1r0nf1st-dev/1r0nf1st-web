import { describe, it, expect } from 'vitest';
import { defaultUrlTransform } from 'react-markdown';
import { brainMarkdownUrlTransform } from './brainMarkdownUrlTransform';

const VALID = '8a23d77e-db0b-4112-997f-3f956fe1adb0';

describe('brainMarkdownUrlTransform', () => {
  it('preserves ob-attach URLs with a valid UUID (react-markdown default strips them)', () => {
    const url = `ob-attach:${VALID}`;
    expect(defaultUrlTransform(url)).toBe('');
    expect(brainMarkdownUrlTransform(url)).toBe(url);
  });

  it('preserves sb-attach URLs with a valid UUID', () => {
    const url = `sb-attach:${VALID}`;
    expect(defaultUrlTransform(url)).toBe('');
    expect(brainMarkdownUrlTransform(url)).toBe(url);
  });

  it('trims whitespace around allowed attach URLs', () => {
    const url = `  ob-attach:${VALID}  `;
    expect(brainMarkdownUrlTransform(url)).toBe(`ob-attach:${VALID}`);
  });

  it('rejects non-UUID tails after prefix (delegates to default)', () => {
    const url = 'ob-attach:javascript:alert(1)';
    expect(brainMarkdownUrlTransform(url)).toBe('');
  });

  it('still allows https images', () => {
    expect(brainMarkdownUrlTransform('https://example.com/a.png')).toBe('https://example.com/a.png');
  });
});
