import { describe, it, expect } from 'vitest';
import { setLastRequestIdFromResponse, getLastRequestId } from './requestContext';

describe('requestContext', () => {
  it('stores id from response header', () => {
    const res = {
      headers: {
        get: (n: string) => (n.toLowerCase() === 'x-request-id' ? '  abc-123  ' : null),
      },
    } as Response;
    setLastRequestIdFromResponse(res);
    expect(getLastRequestId()).toBe('abc-123');
  });
});
