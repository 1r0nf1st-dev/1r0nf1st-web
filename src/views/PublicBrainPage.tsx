'use client';

import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { obApi, type ObNode, type ObPublicBrain } from '../lib/obApi';
import { NodeCard } from '../components/ob/NodeCard';
import { NodeDetailReadOnly } from '../components/ob/NodeDetailReadOnly';
import { BrainGraph } from '../components/ob/BrainGraph';
import { ChatPanel } from '../components/ob/ChatPanel';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { PageHero } from '../components/PageHero';
import { StatsBar } from '../components/StatsBar';
import { Sparkles } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

interface PublicBrainPageProps {
  slug: string;
}

export function PublicBrainPage({ slug }: PublicBrainPageProps): JSX.Element {
  const { user } = useAuth();
  const [data, setData] = useState<ObPublicBrain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ObNode | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fetchBrain = useCallback(async () => {
    if (!slug || !isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await obApi.public.getBySlug(slug, { limit: 50 });
      setData(result);
      setSelectedNode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brain');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug, isAdmin]);

  useEffect(() => {
    fetchBrain();
  }, [fetchBrain]);

  if (user && !isAdmin) {
    return (
      <section
        aria-label="Public brain"
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PageHero flagLabel="Intelligence" title="Public Brain" watermark="Public Brain" />
        <div className="page-content min-h-0">
          <AdminOnlyPlaceholderCard
            title="View brain"
            description="View a public brain by slug. Only admin can access this page."
            icon={Sparkles}
            returnTo={`/brain/${encodeURIComponent(slug)}`}
          />
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section
        aria-label="Public brain"
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PageHero flagLabel="Intelligence" title="Public Brain" watermark={slug} />
        <div className="page-content min-h-0">
          <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
            Loading brain…
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        aria-label="Public brain"
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PageHero flagLabel="Intelligence" title="Public Brain" watermark={slug} />
        <div className="page-content min-h-0">
          <div className="content-panel">
            <h2 className="panel-title">Could not load</h2>
            <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
              {error ?? 'Brain not found'}
            </p>
            <p className="font-display mt-2 text-[13px] text-[color:var(--color-text-inv-2)]">
              The brain &quot;{slug}&quot; may not exist or may have been removed.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { profile, nodes, edges } = data;
  const displayName = profile.display_name?.trim() || profile.username;
  const currentUserIdForReactions = isAdmin ? user?.id : undefined;

  return (
    <section
      aria-label="Public brain"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PageHero
        flagLabel="Intelligence"
        title={`${displayName}'s Brain`}
        watermark={displayName}
        actions={
          <>
            <button
              type="button"
              className="act-btn"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <span aria-hidden>List</span>
            </button>
            <button
              type="button"
              className="act-btn"
              onClick={() => setViewMode('graph')}
              aria-pressed={viewMode === 'graph'}
              aria-label="Graph view"
              data-testid="toggle-graph-view"
            >
              <span aria-hidden>Graph</span>
            </button>
          </>
        }
      />

      <div className="page-content min-h-0">
        <StatsBar
          items={[
            { label: 'Nodes', value: nodes.length },
            { label: 'Edges', value: edges.length },
            { label: 'View', value: viewMode.toUpperCase(), accent: true },
            { label: 'Slug', value: slug },
          ]}
        />

        <div className="ob-page-grid">
          <aside className="ob-page-aside min-w-0">
            <div className="content-panel">
              <h2 className="panel-title">Public nodes</h2>
              {nodes.length === 0 ? (
                <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                  No public nodes yet.
                </p>
              ) : viewMode === 'list' ? (
                <ul className="space-y-2">
                  {nodes.map((node) => (
                    <li key={node.id}>
                      <NodeCard
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onSelect={() => setSelectedNode(node)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                  Graph view enabled. The graph is shown below.
                </p>
              )}
            </div>
          </aside>

          <div className="ob-page-top min-w-0">
            <div className="content-panel">
              <h2 className="panel-title">Ask this brain</h2>
              {user?.id ? <ChatPanel brainOwnerId={profile.id} /> : null}
            </div>

            <div className="content-panel">
              <h2 className="panel-title">Read</h2>
              {selectedNode ? (
                <NodeDetailReadOnly node={selectedNode} currentUserId={currentUserIdForReactions} />
              ) : (
                <p className="font-display text-[13px] text-[color:var(--color-text-inv-2)]">
                  {viewMode === 'graph'
                    ? 'Click a node in the graph to read it.'
                    : 'Select a node from the list to read it.'}
                </p>
              )}
            </div>
          </div>

          {viewMode === 'graph' && nodes.length > 0 ? (
            <div className="ob-page-graph">
              <BrainGraph wide nodes={nodes} edges={edges} onNodeClick={setSelectedNode} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
