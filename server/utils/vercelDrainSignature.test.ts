import { describe, it, expect } from 'vitest';
import {
  computeVercelDrainSignatureHex,
  verifyVercelDrainSignature,
} from './vercelDrainSignature.js';

describe('vercelDrainSignature', () => {
  it('computes deterministic HMAC-SHA1 hex', () => {
    const body = Buffer.from('{"hello":1}', 'utf8');
    const sig = computeVercelDrainSignatureHex(body, 'my-secret');
    expect(sig).toMatch(/^[a-f0-9]{40}$/);
    expect(computeVercelDrainSignatureHex(body, 'my-secret')).toBe(sig);
  });

  it('verifies matching signature', () => {
    const body = Buffer.from('test-payload', 'utf8');
    const secret = 'drain-secret';
    const hex = computeVercelDrainSignatureHex(body, secret);
    expect(verifyVercelDrainSignature(body, hex, secret)).toBe(true);
  });

  it('rejects wrong signature', () => {
    const body = Buffer.from('test', 'utf8');
    expect(verifyVercelDrainSignature(body, 'deadbeef', 'secret')).toBe(false);
  });
});
