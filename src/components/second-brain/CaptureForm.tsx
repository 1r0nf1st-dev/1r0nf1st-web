'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { getJson } from '../../apiClient';

interface CaptureResult {
  thoughtId: string;
  category: string;
  routed: boolean;
}

export const CaptureForm = (): JSX.Element => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await getJson<CaptureResult>('/api/second-brain/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      setResult(res);
      setRawText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="content-panel max-w-2xl">
      <h2 className="panel-title">Quick capture</h2>
      <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
        Add a thought, task, idea, or resource. AI will classify and route it.
      </p>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="PROJECTS: Claude code&#10;IDEAS: subscription model for consultancy&#10;PEOPLE: Sarah — follow up Q2 proposal"
        rows={4}
        className="field-input min-h-[140px] font-mono text-[12px] leading-[1.7]"
        disabled={loading}
        aria-label="Capture text"
      />
      <button type="submit" disabled={loading || !rawText.trim()} className="input-row-btn">
        {loading ? 'Capturing…' : 'Capture'}
      </button>
      {error && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]" role="status">
          ✓ {result.category}
          {result.routed ? ' — routed' : ' — in inbox'}
        </p>
      )}
    </form>
  );
};
