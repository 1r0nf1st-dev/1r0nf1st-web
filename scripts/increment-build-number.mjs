#!/usr/bin/env node
/**
 * Increment build number in Redis (Upstash) and write to build-number.json.
 * Only increments on Vercel; local builds use fallback ('dev' or timestamp).
 *
 * Requires Upstash Redis (add via Vercel Marketplace).
 * Env vars: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*)
 *
 * Run: node scripts/increment-build-number.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'build-number.json');

const KEY = 'build-number';

function getFallback() {
  if (process.env.NODE_ENV === 'development') return 'dev';
  return String(Math.floor(Date.now() / 1000));
}

async function run() {
  // Only increment Redis on Vercel; use fallback for local builds
  if (!process.env.VERCEL) {
    const fallback = getFallback();
    writeFileSync(outPath, JSON.stringify({ buildNumber: fallback }));
    return;
  }

  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    const fallback = getFallback();
    writeFileSync(outPath, JSON.stringify({ buildNumber: fallback }));
    return;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url, token });
    const n = await redis.incr(KEY);
    writeFileSync(outPath, JSON.stringify({ buildNumber: String(n) }));
  } catch (err) {
    const fallback = getFallback();
    writeFileSync(outPath, JSON.stringify({ buildNumber: fallback }));
    console.warn(
      'Build number increment failed, using fallback:',
      fallback,
      err?.message ?? err
    );
  }
}

run().catch((err) => {
  const fallback = getFallback();
  writeFileSync(outPath, JSON.stringify({ buildNumber: fallback }));
  console.warn('Build number script error:', err?.message ?? err);
});
