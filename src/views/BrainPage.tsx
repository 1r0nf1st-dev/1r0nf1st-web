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
import { Plus, Sparkles, ExternalLink, List, Network } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { StatsBar } from '../components/StatsBar';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export function BrainPage(): JSX.Element {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
      <section
        aria-label="Open Brain"
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PageHero flagLabel="Intelligence" title="Open Brain" watermark="Open Brain" />
        <div className="page-content min-h-0">
          <AdminOnlyPlaceholderCard
            title="Open Brain"
            description="Knowledge graph nodes, semantic search, and AI chat over your brain. Admin only."
            icon={Sparkles}
            returnTo="/brain"
          />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Open Brain"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PageHero
        flagLabel="Intelligence"
        title="Open Brain"
        watermark="Open Brain"
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
            <button
              type="button"
              className="act-btn primary"
              onClick={handleNewNode}
              data-testid="new-node-btn"
            >
              + New Node
            </button>
          </>
        }
      />

      <div className="page-content min-h-0">
        <StatsBar
          items={[
            { label: 'Nodes', value: nodes?.length ?? 0 },
            { label: 'Edges', value: edges?.length ?? 0 },
            { label: 'View', value: viewMode.toUpperCase(), accent: true },
            { label: 'Public', value: publicBrainSlug ? 'YES' : 'NO' },
          ]}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <aside className="min-w-0">
            {publicBrainSlug ? (
              <div className="content-panel">
                <h2 className="panel-title">Public Brain</h2>
                <Link
                  href={`/brain/${encodeURIComponent(publicBrainSlug)}`}
                  className="nav-item"
                  aria-label="View your public brain"
                >
                  <span className="nav-item-icon" aria-hidden>
                    ↗
                  </span>
                  <span className="nav-item-label">Open public brain</span>
                  <span className="nav-item-chevron" aria-hidden>
                    ›
                  </span>
                </Link>
              </div>
            ) : null}

            {error ? (
              <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="content-panel">
              <h2 className="panel-title">Nodes</h2>
              {isLoading ? (
                <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                  Loading nodes…
                </p>
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
              ) : viewMode === 'graph' ? (
                <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                  Graph view enabled. The graph is shown on the right.
                </p>
              ) : (
                <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
                  No nodes yet. Create one to get started.
                </p>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            {viewMode === 'graph' && nodes && nodes.length > 0 ? (
              <BrainGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={(node) => {
                  setSelectedNode(node);
                  setCreating(false);
                }}
              />
            ) : null}

            <div className="content-panel">
              <h2 className="panel-title">Ask Your Brain</h2>
              {user?.id ? <ChatPanel brainOwnerId={user.id} /> : null}
            </div>

            <div className="content-panel">
              <h2 className="panel-title">{showEditor ? 'Edit Node' : 'Editor'}</h2>
              {showEditor ? (
                <NodeEditor
                  node={editingNode}
                  onSave={handleSave}
                  onDelete={user && nodes?.length ? handleDelete : undefined}
                  onCancel={creating ? () => setCreating(false) : undefined}
                />
              ) : (
                <p className="font-display text-[13px] text-[color:var(--color-text-inv-2)]">
                  {viewMode === 'graph'
                    ? 'Click a node in the graph to edit it.'
                    : 'Select a node from the list or click \"New Node\" to create one.'}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
