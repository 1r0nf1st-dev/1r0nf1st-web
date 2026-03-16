import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runEnrichmentPipeline } from './obEnrichmentService.js';
import { config } from '../config.js';

vi.mock('../config.js', () => ({
  config: { geminiApiKey: '' },
}));

describe('obEnrichmentService', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(config).geminiApiKey = '';
  });

  it('returns without throwing when GEMINI_API_KEY is not set', async () => {
    await expect(
      runEnrichmentPipeline(mockSupabase as never, 'node-1', 'user-1'),
    ).resolves.toBeUndefined();
  });

  it('returns without throwing when node is not found', async () => {
    vi.mocked(config).geminiApiKey = 'test-key';
    await expect(
      runEnrichmentPipeline(mockSupabase as never, 'node-1', 'user-1'),
    ).resolves.toBeUndefined();
  });
});
