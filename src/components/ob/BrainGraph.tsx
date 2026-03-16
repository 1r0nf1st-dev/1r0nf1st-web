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

const EDGE_COLORS: Record<ObPublicEdge['edge_type'], string> = {
  supports: '#34d399',
  contradicts: '#ef4444',
  extends: '#3b82f6',
  inspired_by: '#f59e0b',
  references: '#94a3b8',
};

/** Node styles for readable labels on the graph (high contrast) */
const NODE_STYLE: CSSProperties = {
  background: '#1e293b',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  fontWeight: 500,
};

function buildGraph(
  nodes: ObNode[],
  edges: ObPublicEdge[],
): { flowNodes: Node[]; flowEdges: Edge[] } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const flowNodes: Node[] = nodes.map((node, i) => ({
    id: node.id,
    position: { x: (i % cols) * 220, y: Math.floor(i / cols) * 100 },
    data: { label: node.title || 'Untitled' },
    type: 'default',
    style: NODE_STYLE,
  }));

  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.from_node_id,
    target: e.to_node_id,
    type: 'smoothstep',
    animated: e.created_by === 'ai',
    style: { stroke: EDGE_COLORS[e.edge_type] ?? '#94a3b8' },
  }));

  return { flowNodes, flowEdges };
}

interface BrainGraphProps {
  nodes: ObNode[];
  edges: ObPublicEdge[];
  onNodeClick: (node: ObNode) => void;
}

export function BrainGraph({
  nodes,
  edges,
  onNodeClick,
}: BrainGraphProps): JSX.Element {
  const { flowNodes: initialNodes, flowEdges: initialEdges } = useMemo(
    () => buildGraph(nodes, edges),
    [nodes, edges],
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

  return (
    <div
      className="w-full rounded-lg border border-border bg-muted/20"
      style={{ height: 400 }}
      data-testid="brain-graph"
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
