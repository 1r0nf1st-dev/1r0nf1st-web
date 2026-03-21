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
import { cardClasses } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';
import { Sparkles, List, Network } from 'lucide-react';

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
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <AdminOnlyPlaceholderCard
          title="View brain"
          description="View a public brain by slug. Only admin can access this page."
          returnTo={`/brain/${encodeURIComponent(slug)}`}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <p className="text-sm text-muted">Loading brain…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className={cardClasses}>
          <p className="text-destructive" role="alert">
            {error ?? 'Brain not found'}
          </p>
          <p className="text-sm text-muted mt-2">
            The brain &quot;{slug}&quot; may not exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const { profile, nodes, edges } = data;
  const displayName = profile.display_name?.trim() || profile.username;
  const currentUserIdForReactions = isAdmin ? user?.id : undefined;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden touch-scroll">
      <div className="mx-auto w-full min-h-0 max-w-6xl p-4 md:p-6">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold text-foreground">{displayName}&apos;s Brain</h1>
            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`${btnBase} ${btnGhost} flex items-center gap-1.5 text-sm`}
                aria-pressed={viewMode === 'list'}
                data-testid="toggle-graph-view"
                aria-label="List view"
              >
                <List className="h-4 w-4" aria-hidden />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                className={`${btnBase} ${btnGhost} flex items-center gap-1.5 text-sm`}
                aria-pressed={viewMode === 'graph'}
                aria-label="Graph view"
                data-testid="toggle-graph-view"
              >
                <Network className="h-4 w-4" aria-hidden />
                Graph
              </button>
            </div>
          </div>
          {profile.bio ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>
          ) : null}
        </header>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="space-y-4 lg:w-80 lg:flex-shrink-0">
            <h2 className="text-sm font-medium text-muted-foreground">
              Public nodes ({nodes.length})
            </h2>
            {nodes.length === 0 ? (
              <p className="text-sm text-muted">No public nodes yet.</p>
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
              <p className="text-sm text-muted">
                Switch to List to browse, or use the graph on the right.
              </p>
            )}
          </aside>

          <section className="min-w-0 flex-1 space-y-4">
            {viewMode === 'graph' && nodes.length > 0 ? (
              <BrainGraph nodes={nodes} edges={edges} onNodeClick={setSelectedNode} />
            ) : null}
            {selectedNode ? (
              <NodeDetailReadOnly node={selectedNode} currentUserId={currentUserIdForReactions} />
            ) : (
              <div className={cardClasses}>
                <p className="text-muted">
                  {viewMode === 'graph'
                    ? 'Click a node in the graph to read it.'
                    : 'Select a node from the list to read it.'}
                </p>
              </div>
            )}

            {user?.id ? <ChatPanel brainOwnerId={profile.id} /> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
