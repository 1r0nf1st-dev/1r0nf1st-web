import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatNoteDate } from './formatNoteDate';

describe('formatNoteDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for dates less than 1 hour ago', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-15T11:30:00Z');
    expect(formatNoteDate(date.toISOString())).toBe('Just now');
  });

  it('returns "X hours ago" for dates less than 24 hours ago', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-15T10:00:00Z');
    expect(formatNoteDate(date.toISOString())).toBe('2 hours ago');
  });

  it('returns "1 hour ago" for singular hour', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-15T11:00:00Z');
    expect(formatNoteDate(date.toISOString())).toBe('1 hour ago');
  });

  it('returns "Yesterday" for dates between 24-48 hours ago', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-14T12:00:00Z');
    expect(formatNoteDate(date.toISOString())).toBe('Yesterday');
  });

  it('returns "X days ago" for dates less than 7 days ago', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-13T12:00:00Z');
    expect(formatNoteDate(date.toISOString())).toBe('2 days ago');
  });

  it('returns "2 days ago" for dates between 2-7 days', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    // The function returns "Yesterday" for diffDays < 2, and "X days ago" for diffDays >= 2 && < 7
    // So "1 day ago" is not possible - anything < 2 days is "Yesterday"
    // Test with a date that's exactly 2 days ago
    const date = new Date('2024-01-13T12:00:00Z'); // 2 days ago
    expect(formatNoteDate(date.toISOString())).toBe('2 days ago');
  });

  it('returns absolute date for dates older than 7 days', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const date = new Date('2024-01-01T12:00:00Z');
    const result = formatNoteDate(date.toISOString());
    expect(result).toMatch(/Jan \d+, 2024/);
  });
});
