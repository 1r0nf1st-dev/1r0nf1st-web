'use client';

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { obApi, type ObExploreResult, type ObNode } from '../lib/obApi';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { ListCard } from '../components/ListCard';

const NODE_TYPE_OPTIONS: Array<
  { value: ''; label: string } | { value: ObNode['node_type']; label: string }
> = [
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
    <section
      aria-label="Explore"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PageHero flagLabel="Intelligence" title="Explore" watermark="Explore" />
      <div className="page-content min-h-0">
        {!user ? (
          <div className="content-panel">
            <h2 className="panel-title">Explore brains</h2>
            <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
              Semantic search across all public Open Brain nodes. Log in to search.
            </p>
            <Link href={`/login?returnTo=${encodeURIComponent('/explore')}`} className="nav-item">
              <span className="nav-item-icon" aria-hidden>
                →
              </span>
              <span className="nav-item-label">Log in to explore</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="content-panel">
              <h2 className="panel-title">Search public nodes</h2>
              <div className="input-row">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => (e.key === 'Enter' ? onSearch() : undefined)}
                  placeholder="Search by meaning…"
                  className="field-input"
                  aria-label="Explore search"
                  data-testid="explore-search"
                />
                <button
                  type="button"
                  onClick={onSearch}
                  disabled={isSearching || !query.trim()}
                  className="input-row-btn"
                >
                  {isSearching ? 'Searching…' : 'Search'}
                </button>
              </div>
              <div className="input-row">
                <select
                  value={nodeTypeFilter}
                  onChange={(e) =>
                    setNodeTypeFilter(
                      e.target.value === '' ? '' : (e.target.value as ObNode['node_type']),
                    )
                  }
                  className="field-input"
                  aria-label="Filter by node type"
                  data-testid="explore-node-type-filter"
                >
                  {NODE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="input-row-btn" aria-hidden>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <Search className="w-4 h-4" aria-hidden />
                    )}
                    Filter
                  </span>
                </div>
              </div>
              {error ? (
                <p
                  className="font-display text-[12px] text-[color:var(--color-orange)]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            {results ? (
              <div data-testid="explore-results">
                {results.length === 0 ? (
                  <div className="content-panel">
                    <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                      No matching public nodes found.
                    </p>
                  </div>
                ) : (
                  <div>
                    {results.map((r: ObExploreResult) => (
                      <ListCard
                        key={r.id}
                        icon="◈"
                        title={r.title || 'Untitled'}
                        tag={
                          NODE_TYPE_OPTIONS.find((o) => o.value === r.node_type)?.label ??
                          r.node_type
                        }
                        date={`${(r.similarity * 100).toFixed(0)}% match · ${r.username}`}
                        onClick={() => {
                          // Navigation stays client-side via Link, but we keep the card pattern here.
                          window.location.href = `/brain/${encodeURIComponent(r.brain_slug)}`;
                        }}
                        right={<ExternalLink className="w-4 h-4" aria-hidden />}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
