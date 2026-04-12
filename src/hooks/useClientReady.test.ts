import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClientReady } from './useClientReady';

describe('useClientReady', () => {
  it('returns a boolean without throwing', () => {
    const { result } = renderHook(() => useClientReady());
    expect(typeof result.current).toBe('boolean');
  });
});
