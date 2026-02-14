import { describe, it, expect } from 'vitest';
import {
  stripHtmlAndScripts,
  sanitizePlainText,
  sanitizeFreeText,
  sanitizeFileName,
  isSafeStoragePath,
  isAllowedMimeType,
  hasDangerousExtension,
} from './sanitize.js';

describe('sanitize', () => {
  describe('stripHtmlAndScripts', () => {
    it('removes script tags and content', () => {
      expect(stripHtmlAndScripts('Hello <script>alert(1)</script> world')).toBe('Hello world');
    });

    it('removes style tags', () => {
      expect(stripHtmlAndScripts('A <style>.x{}</style> B')).toBe('A B');
    });

    it('strips javascript: URLs', () => {
      expect(stripHtmlAndScripts('Link javascript:evil() here')).not.toContain('javascript:');
    });

    it('strips event handlers', () => {
      expect(stripHtmlAndScripts('<div onclick="alert(1)">x</div>')).not.toContain('onclick');
    });

    it('strips remaining HTML tags', () => {
      expect(stripHtmlAndScripts('<b>bold</b>')).not.toContain('<');
    });
  });

  describe('sanitizeFreeText', () => {
    it('strips HTML and scripts then trims and limits length', () => {
      expect(sanitizeFreeText('  <b>hi</b>  ', 20)).toBe('hi');
      expect(sanitizeFreeText('<script>alert(1)</script>Hello', 50)).toBe('Hello');
      expect(sanitizeFreeText('ab'.repeat(100), 5)).toBe('ababa');
    });
  });

  describe('sanitizePlainText', () => {
    it('trims and limits length', () => {
      expect(sanitizePlainText('  ab  ', 5)).toBe('ab');
      expect(sanitizePlainText('abcdefgh', 4)).toBe('abcd');
    });

    it('removes control characters', () => {
      expect(sanitizePlainText('a\x00b\x1Fc')).toBe('abc');
    });
  });

  describe('sanitizeFileName', () => {
    it('strips path components', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    });

    it('replaces unsafe chars with underscore', () => {
      expect(sanitizeFileName('file<>name?.txt')).toBe('file__name_.txt');
    });

    it('returns unnamed for empty result', () => {
      expect(sanitizeFileName('...')).toBe('unnamed');
    });
  });

  describe('isSafeStoragePath', () => {
    it('rejects path traversal', () => {
      expect(isSafeStoragePath('notes/uid/nid/../other', 'notes/')).toBe(false);
      expect(isSafeStoragePath('../../etc/passwd', 'notes/')).toBe(false);
    });

    it('rejects absolute paths', () => {
      expect(isSafeStoragePath('/etc/passwd', 'notes/')).toBe(false);
    });

    it('accepts path with allowed prefix', () => {
      expect(isSafeStoragePath('notes/user1/note1/123-file.pdf', 'notes/')).toBe(true);
    });
  });

  describe('isAllowedMimeType', () => {
    it('allows images and PDF', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
      expect(isAllowedMimeType('image/png')).toBe(true);
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('rejects executables', () => {
      expect(isAllowedMimeType('application/x-msdownload')).toBe(false);
    });
  });

  describe('hasDangerousExtension', () => {
    it('detects dangerous extensions', () => {
      expect(hasDangerousExtension('file.exe')).toBe(true);
      expect(hasDangerousExtension('file.php')).toBe(true);
    });

    it('allows safe extensions', () => {
      expect(hasDangerousExtension('file.pdf')).toBe(false);
      expect(hasDangerousExtension('file.png')).toBe(false);
    });
  });
});
