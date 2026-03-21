'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { getJson } from '../../apiClient';

interface SearchResult {
  table_name: string;
  record_id: string;
  label: string;
  detail: string | null;
  similarity: number;
  created_at: string;
}

export const SearchForm = (): JSX.Element => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'rag'>('search');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setRagAnswer(null);
    try {
      if (mode === 'rag') {
        const res = await getJson<{ answer: string }>('/api/second-brain/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query.trim() }),
        });
        setRagAnswer(res.answer);
      } else {
        const res = await getJson<SearchResult[]>('/api/second-brain/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() }),
        });
        setSearchResults(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-panel max-w-2xl">
      <h2 className="panel-title">Semantic Search</h2>
      <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
        Find by meaning, not keywords.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={mode === 'search' ? 'tab active' : 'tab'}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setMode('rag')}
          className={mode === 'rag' ? 'tab active' : 'tab'}
        >
          Ask (RAG)
        </button>
      </div>

      <form onSubmit={handleSearch}>
        <div className="input-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'rag'
                ? 'What did I think about the pricing strategy?'
                : 'pricing strategy, follow-up with Sarah'
            }
            className="field-input"
            disabled={loading}
            aria-label="Search or question"
          />
          <button type="submit" disabled={loading || !query.trim()} className="input-row-btn">
            {loading ? 'Searching…' : mode === 'rag' ? 'Ask' : 'Search'}
          </button>
        </div>
      </form>
      {error && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {error}
        </p>
      )}
      {searchResults && searchResults.length > 0 && (
        <ul className="space-y-2 mt-4" role="list">
          {searchResults.map((r, i) => (
            <li key={`${r.table_name}-${r.record_id}-${i}`} className="list-card">
              <div className="card-icon" aria-hidden>
                🔎
              </div>
              <div className="min-w-0">
                <div className="card-title">{r.label}</div>
                <div className="card-meta">
                  <span className="card-tag">{r.table_name}</span>
                  <span className="card-date">{(r.similarity * 100).toFixed(0)}% match</span>
                </div>
              </div>
              <div className="card-arrow" aria-hidden>
                →
              </div>
            </li>
          ))}
        </ul>
      )}
      {searchResults && searchResults.length === 0 && (
        <p className="font-display text-[12px] text-[color:var(--color-text-3)]">
          No matches found.
        </p>
      )}
      {ragAnswer && (
        <div className="content-panel whitespace-pre-wrap font-display text-[12px] text-[color:var(--color-text-inv)]">
          {ragAnswer}
        </div>
      )}
    </div>
  );
};
