import { describe, it, expect } from 'vitest';
import {
  expandPlatformIngestBody,
  isVercelLogEntry,
  isSupabaseDatabaseWebhook,
} from './platformLogNormalize.js';

describe('platformLogNormalize', () => {
  it('detects Vercel log entry', () => {
    expect(
      isVercelLogEntry({
        id: 'log-1',
        deploymentId: 'dep',
        projectId: 'prj',
        source: 'lambda',
        level: 'error',
        timestamp: 1_710_000_000_000,
        message: 'fail',
        host: 'app.vercel.app',
      }),
    ).toBe(true);
    expect(isVercelLogEntry({ provider: 'vercel', category: 'x' })).toBe(false);
  });

  it('expands Vercel batch array', () => {
    const rows = expandPlatformIngestBody([
      {
        id: 'a',
        deploymentId: 'd',
        projectId: 'p',
        source: 'build',
        level: 'warning',
        timestamp: 1_700_000_000,
        message: 'warn line',
        host: 'build',
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.provider).toBe('vercel');
    expect(rows[0]?.category).toBe('log_build');
    expect(rows[0]?.externalId).toBe('a');
  });

  it('expands Vercel { logs: [...] } wrapper', () => {
    const rows = expandPlatformIngestBody({
      logs: [
        {
          id: 'b',
          deploymentId: 'd',
          projectId: 'p',
          source: 'edge',
          level: 'info',
          timestamp: 1_700_000_000,
          host: 'e',
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe('log_edge');
  });

  it('detects Supabase database webhook', () => {
    expect(
      isSupabaseDatabaseWebhook({
        type: 'INSERT',
        schema: 'public',
        table: 'notes',
        record: { id: '1', title: 'x' },
        old_record: null,
      }),
    ).toBe(true);
  });

  it('expands Supabase webhook to row without record body in payload', () => {
    const rows = expandPlatformIngestBody({
      type: 'UPDATE',
      schema: 'public',
      table: 'goals',
      record: { id: '1', progress_percentage: 50 },
      old_record: { id: '1', progress_percentage: 40 },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.provider).toBe('supabase');
    expect(rows[0]?.category).toBe('db_update');
    expect(rows[0]?.payload).toEqual({
      schema: 'public',
      table: 'goals',
      type: 'UPDATE',
      recordKeys: ['id', 'progress_percentage'],
      oldRecordKeys: ['id', 'progress_percentage'],
    });
  });

  it('still accepts custom provider/category rows', () => {
    const rows = expandPlatformIngestBody({
      provider: 'ci',
      category: 'nightly',
      message: 'done',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.provider).toBe('ci');
  });
});
