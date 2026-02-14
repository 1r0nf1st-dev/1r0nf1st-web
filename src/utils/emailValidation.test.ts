import { describe, it, expect } from 'vitest';
import { parseEmailsClient, hasMaliciousScripts } from './emailValidation.js';

describe('emailValidation', () => {
  describe('parseEmailsClient', () => {
    it('parses comma-separated valid emails', () => {
      const { emails, invalid } = parseEmailsClient('a@b.co, c@d.org');
      expect(emails).toEqual(['a@b.co', 'c@d.org']);
      expect(invalid).toEqual([]);
    });

    it('reports invalid emails', () => {
      const { emails, invalid } = parseEmailsClient('a@b.co, notanemail');
      expect(emails).toEqual(['a@b.co']);
      expect(invalid).toEqual(['notanemail']);
    });
  });

  describe('hasMaliciousScripts', () => {
    it('returns true for script tag', () => {
      expect(hasMaliciousScripts('Hello <script>alert(1)</script>')).toBe(true);
    });

    it('returns true for javascript: URL', () => {
      expect(hasMaliciousScripts('Link javascript:void(0)')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(hasMaliciousScripts('Just a normal message.')).toBe(false);
    });
  });
});
