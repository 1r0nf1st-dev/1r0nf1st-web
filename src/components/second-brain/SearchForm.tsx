'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { getJson } from '../../apiClient';
import { btnBase, btnPrimary } from '../../styles/buttons';

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
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">Semantic search</h2>
      <p className="text-sm text-muted">
        Find by meaning, not keywords. Or ask a question for an AI-generated
        answer.
      </p>
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('search')}
            className={`${btnBase} px-3 py-1.5 text-sm border rounded-lg ${
              mode === 'search' ? 'bg-primary/20 border-primary' : 'border-border'
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode('rag')}
            className={`${btnBase} px-3 py-1.5 text-sm border rounded-lg ${
              mode === 'rag' ? 'bg-primary/20 border-primary' : 'border-border'
            }`}
          >
            Ask (RAG)
          </button>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === 'rag'
              ? 'What did I think about the pricing strategy?'
              : 'pricing strategy, follow-up with Sarah'
          }
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={loading}
          aria-label="Search or question"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`${btnBase} ${btnPrimary}`}
        >
          {loading ? 'Searching…' : mode === 'rag' ? 'Ask' : 'Search'}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {searchResults && searchResults.length > 0 && (
        <ul className="space-y-2 mt-4" role="list">
          {searchResults.map((r, i) => (
            <li
              key={`${r.table_name}-${r.record_id}-${i}`}
              className="p-3 rounded-lg border border-border bg-surface-soft/50"
            >
              <span className="text-xs text-muted uppercase">{r.table_name}</span>
              <p className="font-medium">{r.label}</p>
              {r.detail && <p className="text-sm text-muted">{r.detail}</p>}
              <span className="text-xs text-muted">
                {(r.similarity * 100).toFixed(0)}% match
              </span>
            </li>
          ))}
        </ul>
      )}
      {searchResults && searchResults.length === 0 && (
        <p className="text-sm text-muted">No matches found.</p>
      )}
      {ragAnswer && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-surface-soft/50 whitespace-pre-wrap">
          {ragAnswer}
        </div>
      )}
    </div>
  );
};
