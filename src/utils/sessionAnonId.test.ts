import { describe, it, expect, beforeEach } from 'vitest';
import { getSessionAnonId } from './sessionAnonId';

describe('getSessionAnonId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('creates and returns a stable id per session', () => {
    const a = getSessionAnonId();
    const b = getSessionAnonId();
    expect(a).toBeDefined();
    expect(a).toBe(b);
    expect(a!.length).toBeGreaterThan(8);
  });
});
