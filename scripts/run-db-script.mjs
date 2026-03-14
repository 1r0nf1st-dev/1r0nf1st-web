#!/usr/bin/env node
/**
 * Run a SQL file against the database.
 * Loads .env via dotenv. Requires: DATABASE_URL or SUPABASE_DB_URL, psql in PATH.
 * Usage: node -r dotenv/config scripts/run-db-script.mjs <path>
 * Example: node -r dotenv/config scripts/run-db-script.mjs scripts/db-reset.sql
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = process.argv[2];
if (!script) {
  console.error('Usage: node -r dotenv/config scripts/run-db-script.mjs <path>');
  process.exit(1);
}
const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('DATABASE_URL or SUPABASE_DB_URL is required');
  process.exit(1);
}
const path = script.startsWith('/') ? script : join(__dirname, '..', script);
const result = spawnSync('psql', [url, '-f', path], { stdio: 'inherit' });
process.exit(result.status ?? 1);
