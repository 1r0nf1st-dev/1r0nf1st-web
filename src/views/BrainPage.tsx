'use client';

import type { JSX } from 'react';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useObNodes, createObNode, updateObNode, deleteObNode } from '../hooks/useObNodes';
import { obApi } from '../lib/obApi';
import type { ObNode, ObNodeCreate, ObNodeUpdate } from '../lib/obApi';
import type { ObPublicEdge } from '../lib/obApi';
import { NodeCard } from '../components/ob/NodeCard';
import { NodeEditor } from '../components/ob/NodeEditor';
import { BrainGraph } from '../components/ob/BrainGraph';
import { ChatPanel } from '../components/ob/ChatPanel';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';
import { cardClasses } from '../styles/cards';
import { Plus, Sparkles, ExternalLink, List, Network } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export function BrainPage(): JSX.Element {
  const { user } = useAuth();
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const { nodes, isLoading, error, refetch } = useObNodes({ limit: 50 });
  const [selectedNode, setSelectedNode] = useState<ObNode | null>(null);
  const [creating, setCreating] = useState(false);
  const [publicBrainSlug, setPublicBrainSlug] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [edges, setEdges] = useState<ObPublicEdge[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    obApi.profile
      .getMe()
      .then((p) => setPublicBrainSlug(p.brain_slug))
      .catch(() => setPublicBrainSlug(null));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !nodes?.length) {
      setEdges([]);
      return;
    }
    obApi.edges
      .list()
      .then((allEdges) => {
        const nodeIds = new Set(nodes.map((n) => n.id));
        const between = allEdges.filter(
          (e) => nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id),
        );
        setEdges(between);
      })
      .catch(() => setEdges([]));
  }, [isAdmin, nodes]);

  const handleSave = useCallback(
    async (data: ObNodeCreate | ObNodeUpdate) => {
      if (selectedNode) {
        await updateObNode(selectedNode.id, data as ObNodeUpdate);
        setSelectedNode((prev) => (prev ? { ...prev, ...data } : null));
      } else {
        const created = await createObNode(data as ObNodeCreate);
        setSelectedNode(created);
        setCreating(false);
      }
      await refetch();
    },
    [selectedNode, refetch],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteObNode(id);
      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }
      await refetch();
    },
    [selectedNode?.id, refetch],
  );

  const handleNewNode = useCallback(() => {
    setSelectedNode(null);
    setCreating(true);
  }, []);

  const showEditor = creating || selectedNode;
  const editingNode = selectedNode ?? (creating ? null : null);

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <section aria-label="Open Brain">
          <AdminOnlyPlaceholderCard
            title="Open Brain"
            description="Knowledge graph nodes, semantic search, and AI chat over your brain. Admin only."
            icon={Sparkles}
            returnTo="/brain"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-80 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl font-semibold text-foreground">Open Brain</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`${btnBase} ${btnGhost} flex items-center gap-1 text-sm`}
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
              >
                <List className="w-4 h-4" aria-hidden />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                className={`${btnBase} ${btnGhost} flex items-center gap-1 text-sm`}
                aria-pressed={viewMode === 'graph'}
                aria-label="Graph view"
                data-testid="toggle-graph-view"
              >
                <Network className="w-4 h-4" aria-hidden />
                Graph
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {publicBrainSlug && (
              <Link
                href={`/brain/${encodeURIComponent(publicBrainSlug)}`}
                className={`${btnBase} ${btnGhost} flex items-center gap-1.5 text-sm`}
                aria-label="View your public brain"
              >
                <ExternalLink className="w-4 h-4" aria-hidden />
                Public brain
              </Link>
            )}
            <button
              type="button"
              onClick={handleNewNode}
              className={`${btnBase} ${btnPrimary} flex items-center gap-1.5`}
              data-testid="new-node-btn"
              aria-label="New node"
            >
              <Plus className="w-4 h-4" aria-hidden />
              New node
            </button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-muted">Loading nodes…</p>
          ) : viewMode === 'list' && nodes && nodes.length > 0 ? (
            <ul className="space-y-2">
              {nodes.map((node) => (
                <li key={node.id}>
                  <NodeCard
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onSelect={() => {
                      setSelectedNode(node);
                      setCreating(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : viewMode === 'graph' && nodes && nodes.length > 0 ? (
            <BrainGraph
              nodes={nodes}
              edges={edges}
              onNodeClick={(node) => {
                setSelectedNode(node);
                setCreating(false);
              }}
            />
          ) : viewMode === 'graph' ? (
            <p className="text-sm text-muted">No nodes to show in graph.</p>
          ) : (
            <p className="text-sm text-muted">No nodes yet. Create one to get started.</p>
          )}
        </aside>

        <section className="flex-1 min-w-0 space-y-4">
          {showEditor ? (
            <div className={cardClasses}>
              <NodeEditor
                node={editingNode}
                onSave={handleSave}
                onDelete={user && nodes?.length ? handleDelete : undefined}
                onCancel={creating ? () => setCreating(false) : undefined}
              />
            </div>
          ) : (
            <div className={cardClasses}>
              <p className="text-muted">
                {viewMode === 'graph'
                  ? 'Click a node in the graph to edit it.'
                  : 'Select a node from the list or click &quot;New node&quot; to create one.'}
              </p>
            </div>
          )}

          {user?.id && (
            <ChatPanel brainOwnerId={user.id} />
          )}
        </section>
      </div>
    </div>
  );
}
