import { describe, it, expect } from 'vitest';
import { parseSummaryRange, parseSummaryStep } from './appEventLogService.js';

describe('appEventLogService', () => {
  describe('parseSummaryStep', () => {
    it('returns hour by default', () => {
      expect(parseSummaryStep(undefined)).toBe('hour');
    });

    it('accepts valid steps', () => {
      expect(parseSummaryStep('day')).toBe('day');
      expect(parseSummaryStep('week')).toBe('week');
      expect(parseSummaryStep('month')).toBe('month');
    });

    it('rejects invalid step', () => {
      expect(parseSummaryStep('invalid')).toBe('hour');
    });
  });

  describe('parseSummaryRange', () => {
    it('returns default 24h window when from/to omitted', () => {
      const r = parseSummaryRange(undefined, undefined);
      expect(r).not.toBeNull();
      if (!r) {
        return;
      }
      expect(Date.parse(r.to)).toBeGreaterThan(Date.parse(r.from));
    });

    it('returns null when from > to', () => {
      expect(parseSummaryRange('2026-01-10T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBeNull();
    });

    it('returns null when span exceeds 90 days', () => {
      expect(
        parseSummaryRange('2026-01-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
      ).toBeNull();
    });
  });
});
