'use client';

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import {
  obApi,
  type ObExploreResult,
  type ObNode,
} from '../lib/obApi';
import { btnBase, btnPrimary } from '../styles/buttons';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { Search, Loader2, ExternalLink } from 'lucide-react';

const NODE_TYPE_OPTIONS: Array<{ value: ''; label: string } | { value: ObNode['node_type']; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'note', label: 'Note' },
  { value: 'concept', label: 'Concept' },
  { value: 'question', label: 'Question' },
  { value: 'source', label: 'Source' },
  { value: 'project', label: 'Project' },
];

export function ExplorePage(): JSX.Element {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<ObNode['node_type'] | ''>('');
  const [results, setResults] = useState<ObExploreResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    setError(null);
    setResults(null);
    try {
      const data = await obApi.explore.search(
        q,
        25,
        nodeTypeFilter === '' ? undefined : nodeTypeFilter,
      );
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, nodeTypeFilter]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Explore brains
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semantic search across all public Open Brain nodes. Log in to search.
        </p>
      </header>

      {!user ? (
        <div className={cardClasses}>
          <p className="text-muted">
            <Link href={`/login?returnTo=${encodeURIComponent('/explore')}`} className="text-primary underline">
              Log in
            </Link>
            {' '}
            to search across public brains.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Search by meaning…"
              className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary"
              aria-label="Explore search"
              data-testid="explore-search"
            />
            <select
              value={nodeTypeFilter}
              onChange={(e) =>
                setNodeTypeFilter(
                  e.target.value === ''
                    ? ''
                    : (e.target.value as ObNode['node_type']),
                )
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary"
              aria-label="Filter by node type"
              data-testid="explore-node-type-filter"
            >
              {NODE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSearch}
              disabled={isSearching || !query.trim()}
              className={`${btnBase} ${btnPrimary} flex items-center gap-1.5`}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Search className="w-4 h-4" aria-hidden />
              )}
              Search
            </button>
          </div>

          {error && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {results && (
            <div data-testid="explore-results">
              {results.length === 0 ? (
                <p className="text-muted">No matching public nodes found.</p>
              ) : (
                <ul className="space-y-4">
                  {results.map((r) => (
                    <li key={r.id}>
                      <div className={cardClasses}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className={cardTitle}>{r.title || 'Untitled'}</h2>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary"
                                data-testid={`explore-result-type-${r.node_type}`}
                              >
                                {NODE_TYPE_OPTIONS.find((o) => o.value === r.node_type)?.label ?? r.node_type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {r.username}
                              {' · '}
                              {(r.similarity * 100).toFixed(0)}% match
                            </p>
                            {r.ai_summary && (
                              <p className={cardBody + ' mt-2 line-clamp-2'}>
                                {r.ai_summary}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/brain/${encodeURIComponent(r.brain_slug)}`}
                            className={`${btnBase} flex items-center gap-1 text-sm shrink-0`}
                            aria-label={`View in ${r.username}'s brain`}
                          >
                            <ExternalLink className="w-4 h-4" aria-hidden />
                            View
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
