import crypto from 'crypto';

/**
 * Vercel drain docs: HMAC-SHA1 of the raw request body, hex digest, header `x-vercel-signature`.
 * @see https://vercel.com/docs/drains/security
 */
export function computeVercelDrainSignatureHex(rawBody: Buffer, secret: string): string {
  return crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
}

export function verifyVercelDrainSignature(
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }
  const expected = computeVercelDrainSignatureHex(rawBody, secret);
  if (expected.length !== signatureHeader.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signatureHeader, 'utf8'),
    );
  } catch {
    return false;
  }
}
