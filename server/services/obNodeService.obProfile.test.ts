import { describe, expect, it } from 'vitest';
import { obProfileSlugFromEmail } from './obNodeService.js';

describe('obProfileSlugFromEmail', () => {
  it('uses local part of email', () => {
    expect(obProfileSlugFromEmail('admin@1r0nf1st.com')).toBe('admin');
  });

  it('returns user when email missing', () => {
    expect(obProfileSlugFromEmail(undefined)).toBe('user');
  });

  it('trims whitespace', () => {
    expect(obProfileSlugFromEmail('  foo  @bar.com')).toBe('foo');
  });
});
