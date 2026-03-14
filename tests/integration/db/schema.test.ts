/**
 * Integration test: verifies database schema exists.
 * Skips when DATABASE_URL or SUPABASE_DB_URL is not set.
 * Run: pnpm test:integration
 * Requires: pnpm add -D pg
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

describe.skipIf(!url)('DB schema integration', () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString: url });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  it('has goals table', async () => {
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'goals'
      ORDER BY ordinal_position
    `);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.rows.some((r) => r.column_name === 'id')).toBe(true);
    expect(res.rows.some((r) => r.column_name === 'user_id')).toBe(true);
  });

  it('has sb_projects table (Second Brain)', async () => {
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sb_projects'
      ORDER BY ordinal_position
    `);
    expect(res.rows.length).toBeGreaterThan(0);
  });

  it('has notes table', async () => {
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notes'
      ORDER BY ordinal_position
    `);
    expect(res.rows.length).toBeGreaterThan(0);
  });
});
