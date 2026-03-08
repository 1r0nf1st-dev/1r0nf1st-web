'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { getJson } from '../../apiClient';
import { btnBase, btnPrimary } from '../../styles/buttons';

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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">Quick capture</h2>
      <p className="text-sm text-muted">
        Add a thought, task, idea, or resource. AI will classify and route it.
      </p>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="PROJECTS: Claude code&#10;IDEAS: subscription model for consultancy&#10;PEOPLE: Sarah — follow up Q2 proposal"
        rows={4}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
        disabled={loading}
        aria-label="Capture text"
      />
      <button
        type="submit"
        disabled={loading || !rawText.trim()}
        className={`${btnBase} ${btnPrimary}`}
      >
        {loading ? 'Capturing…' : 'Capture'}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          ✓ {result.category}
          {result.routed ? ' — routed' : ' — in inbox'}
        </p>
      )}
    </form>
  );
};
