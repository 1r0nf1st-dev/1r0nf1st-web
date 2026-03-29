'use client';

import type { CSSProperties, JSX } from 'react';
import type { MouseEvent } from 'react';
import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ObNode } from '../../lib/obApi';
import type { ObPublicEdge } from '../../lib/obApi';

export type BrainGraphVariant = 'interior' | 'light';

const EDGE_COLORS_INTERIOR: Record<ObPublicEdge['edge_type'], string> = {
  supports: 'rgba(168, 163, 154, 0.55)',
  contradicts: 'var(--color-orange)',
  extends: 'rgba(168, 163, 154, 0.45)',
  inspired_by: 'var(--color-orange)',
  references: 'rgba(168, 163, 154, 0.35)',
};

const EDGE_COLORS_LIGHT: Record<ObPublicEdge['edge_type'], string> = {
  supports: 'var(--color-steel)',
  contradicts: 'var(--color-orange)',
  extends: 'var(--color-steel)',
  inspired_by: 'var(--color-orange)',
  references: 'var(--color-text-3)',
};

/** Matches NodeCard / content-panel: dark surface, inv text, sharp corners */
const NODE_STYLE_INTERIOR: CSSProperties = {
  background: 'var(--color-surface)',
  color: 'var(--color-text-inv)',
  border: '1px solid var(--color-rule-dark)',
  borderTop: '2px solid var(--color-orange)',
  borderRadius: 0,
  padding: '10px 14px',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  boxShadow: 'none',
};

const NODE_STYLE_LIGHT: CSSProperties = {
  background: 'var(--color-white)',
  color: 'var(--color-text-1)',
  border: '1px solid var(--color-rule)',
  borderTop: '2px solid var(--color-orange)',
  borderRadius: 0,
  padding: '10px 14px',
  fontFamily: 'var(--font-display), sans-serif',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  boxShadow: 'none',
};

function buildGraph(
  nodes: ObNode[],
  edges: ObPublicEdge[],
  variant: BrainGraphVariant,
): { flowNodes: Node[]; flowEdges: Edge[] } {
  const edgeColors = variant === 'interior' ? EDGE_COLORS_INTERIOR : EDGE_COLORS_LIGHT;
  const nodeStyle = variant === 'interior' ? NODE_STYLE_INTERIOR : NODE_STYLE_LIGHT;

  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const flowNodes: Node[] = nodes.map((node, i) => ({
    id: node.id,
    position: { x: (i % cols) * 220, y: Math.floor(i / cols) * 100 },
    data: { label: node.title || 'Untitled' },
    type: 'default',
    style: nodeStyle,
  }));

  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.from_node_id,
    target: e.to_node_id,
    type: 'smoothstep',
    animated: e.created_by === 'ai',
    style: {
      stroke: edgeColors[e.edge_type] ?? 'rgba(168, 163, 154, 0.4)',
      strokeWidth: 2,
    },
  }));

  return { flowNodes, flowEdges };
}

interface BrainGraphProps {
  nodes: ObNode[];
  edges: ObPublicEdge[];
  onNodeClick: (node: ObNode) => void;
  /** Open Brain admin UI uses interior tokens; public slug page uses light shell */
  variant?: BrainGraphVariant;
  /** Omit panel chrome (title) when embedded in a page that already has a heading */
  showTitle?: boolean;
  /** Taller canvas when the graph spans the full content width (admin /brain layout) */
  wide?: boolean;
}

export function BrainGraph({
  nodes,
  edges,
  onNodeClick,
  variant = 'interior',
  showTitle = true,
  wide = false,
}: BrainGraphProps): JSX.Element {
  const { flowNodes: initialNodes, flowEdges: initialEdges } = useMemo(
    () => buildGraph(nodes, edges, variant),
    [nodes, edges, variant],
  );
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setFlowNodes(initialNodes);
    setFlowEdges(initialEdges);
  }, [initialNodes, initialEdges, setFlowNodes, setFlowEdges]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const handleNodeClick = useCallback(
    (_event: MouseEvent, flowNode: Node) => {
      const node = nodeMap.get(flowNode.id);
      if (node) onNodeClick(node);
    },
    [nodeMap, onNodeClick],
  );

  const shellClass = [
    variant === 'interior'
      ? 'content-panel brain-graph-shell brain-graph-shell--interior'
      : 'brain-graph-shell brain-graph-shell--light border border-[color:var(--color-rule)] bg-[color:var(--color-white)]',
    wide ? 'brain-graph-shell--wide' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const flowClassName = variant === 'interior' ? 'brain-graph-flow dark' : 'brain-graph-flow';

  const bgColor = variant === 'interior' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(26, 23, 20, 0.08)';
  const bgGap = 22;

  const minimapNodeColor =
    variant === 'interior' ? () => 'var(--color-orange)' : () => 'var(--color-steel)';

  const controlsStyle: CSSProperties =
    variant === 'interior'
      ? {
          borderRadius: 0,
          overflow: 'hidden',
          border: '1px solid var(--color-rule-dark)',
          background: 'var(--color-surface)',
        }
      : {
          borderRadius: 0,
          overflow: 'hidden',
          border: '1px solid var(--color-rule)',
          background: 'var(--color-white)',
        };

  const minimapStyle: CSSProperties =
    variant === 'interior'
      ? {
          borderRadius: 0,
          overflow: 'hidden',
          border: '1px solid var(--color-rule-dark)',
          background: 'var(--color-ink)',
        }
      : {
          borderRadius: 0,
          overflow: 'hidden',
          border: '1px solid var(--color-rule)',
          background: 'var(--color-white)',
        };

  const titleClass =
    variant === 'interior'
      ? 'panel-title brain-graph-shell__title'
      : 'brain-graph-shell__title brain-graph-shell__title--light font-display text-[11px] font-black uppercase tracking-[0.08em] text-[color:var(--color-text-1)] mb-0 flex items-center gap-2 px-5 pt-5 pb-3';

  return (
    <div className={shellClass} data-testid="brain-graph">
      {showTitle ? (
        <h2 className={titleClass}>
          {variant === 'light' ? (
            <span
              className="inline-block h-px w-4 shrink-0 bg-[color:var(--color-orange)]"
              aria-hidden
            />
          ) : null}
          Knowledge graph
        </h2>
      ) : null}
      <div className="brain-graph-shell__canvas">
        <ReactFlow
          className={flowClassName}
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={bgColor} gap={bgGap} size={1} />
          <Controls style={controlsStyle} showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapNodeColor}
            maskColor={
              variant === 'interior' ? 'rgba(26, 23, 20, 0.65)' : 'rgba(244, 242, 238, 0.72)'
            }
            style={minimapStyle}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
