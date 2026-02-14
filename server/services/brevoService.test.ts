import { describe, it, expect } from 'vitest';
import { parseEmails, sanitizeMessageBody } from './brevoService.js';

describe('brevoService', () => {
  describe('parseEmails', () => {
    it('returns valid emails and empty invalid for comma-separated valid addresses', () => {
      const { emails, invalid } = parseEmails('a@b.co, c@d.org');
      expect(emails).toEqual(['a@b.co', 'c@d.org']);
      expect(invalid).toEqual([]);
    });

    it('trims whitespace', () => {
      const { emails, invalid } = parseEmails('  a@b.co  ,  c@d.org  ');
      expect(emails).toEqual(['a@b.co', 'c@d.org']);
      expect(invalid).toEqual([]);
    });

    it('reports invalid emails', () => {
      const { emails, invalid } = parseEmails('a@b.co, notanemail, c@d.org');
      expect(emails).toEqual(['a@b.co', 'c@d.org']);
      expect(invalid).toEqual(['notanemail']);
    });

    it('returns empty arrays for empty string', () => {
      const { emails, invalid } = parseEmails('');
      expect(emails).toEqual([]);
      expect(invalid).toEqual([]);
    });
  });

  describe('sanitizeMessageBody', () => {
    it('removes script tags and content', () => {
      const input = 'Hello <script>alert(1)</script> world';
      expect(sanitizeMessageBody(input)).toBe('Hello world');
    });

    it('removes javascript: URLs', () => {
      const input = 'Click javascript:void(0) here';
      expect(sanitizeMessageBody(input)).not.toContain('javascript:');
    });

    it('strips remaining HTML tags', () => {
      const input = 'A <b>bold</b> word';
      expect(sanitizeMessageBody(input)).not.toContain('<');
      expect(sanitizeMessageBody(input)).not.toContain('>');
    });

    it('returns empty string for non-string', () => {
      expect(sanitizeMessageBody(null as unknown as string)).toBe('');
      expect(sanitizeMessageBody(undefined as unknown as string)).toBe('');
    });
  });
});
