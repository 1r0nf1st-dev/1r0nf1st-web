import { describe, it, expect } from 'vitest';
import {
  validateContactSubmission,
  parseContactBody,
  type ContactSubmission,
} from './contactService.js';

describe('contactService', () => {
  describe('validateContactSubmission', () => {
    it('returns no errors for valid submission', () => {
      const body: ContactSubmission = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello, I would like to get in touch.',
      };
      expect(validateContactSubmission(body)).toEqual([]);
    });

    it('returns error when name is missing', () => {
      const body = { name: '', email: 'jane@example.com', message: 'Hi' };
      const errors = validateContactSubmission(body);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'name', message: 'Name is required.' });
    });

    it('returns error when name is too long', () => {
      const body = {
        name: 'a'.repeat(201),
        email: 'jane@example.com',
        message: 'Hi',
      };
      const errors = validateContactSubmission(body);
      expect(errors.some((e) => e.field === 'name' && e.message.includes('at most 200'))).toBe(true);
    });

    it('returns error when email is missing', () => {
      const body = { name: 'Jane', email: '', message: 'Hi' };
      const errors = validateContactSubmission(body);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'email', message: 'Email is required.' });
    });

    it('returns error when email is invalid', () => {
      const body = { name: 'Jane', email: 'notanemail', message: 'Hi' };
      const errors = validateContactSubmission(body);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'email', message: 'Please enter a valid email address.' });
    });

    it('returns error when message is missing', () => {
      const body = { name: 'Jane', email: 'jane@example.com', message: '' };
      const errors = validateContactSubmission(body);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'message', message: 'Message is required.' });
    });

    it('returns error when message exceeds max length', () => {
      const body = {
        name: 'Jane',
        email: 'jane@example.com',
        message: 'x'.repeat(5001),
      };
      const errors = validateContactSubmission(body);
      expect(errors.some((e) => e.field === 'message' && e.message.includes('5000'))).toBe(true);
    });

    it('returns multiple errors when multiple fields invalid', () => {
      const body = { name: '', email: 'bad', message: '' };
      const errors = validateContactSubmission(body);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('handles non-string body fields as invalid', () => {
      const body = { name: 123, email: 'jane@example.com', message: 'Hi' };
      const errors = validateContactSubmission(body);
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });
  });

  describe('parseContactBody', () => {
    it('returns trimmed submission for valid body', () => {
      const body = {
        name: '  Jane Doe  ',
        email: '  JANE@Example.COM  ',
        message: '  Hello  ',
      };
      const result = parseContactBody(body);
      expect(result).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello',
      });
    });

    it('throws when name is missing', () => {
      expect(() => parseContactBody({ name: '', email: 'j@j.com', message: 'Hi' })).toThrow();
    });

    it('throws when email is invalid', () => {
      expect(() => parseContactBody({ name: 'Jane', email: 'x', message: 'Hi' })).toThrow();
    });

    it('throws when message is missing', () => {
      expect(() => parseContactBody({ name: 'Jane', email: 'j@j.com', message: '' })).toThrow();
    });

    it('strips HTML and scripts from name and message', () => {
      const result = parseContactBody({
        name: '  <script>alert(1)</script>Jane  ',
        email: 'jane@example.com',
        message: '<b>Hello</b> & <img onerror="alert(1)">',
      });
      expect(result.name).not.toContain('<');
      expect(result.name).not.toContain('script');
      expect(result.name).toBe('Jane');
      expect(result.message).not.toContain('<');
      expect(result.message).not.toContain('onerror');
      expect(result.message).toContain('Hello');
    });
  });
});
