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
  supports: 'var(--color-steel)',
  contradicts: 'var(--color-orange)',
  extends: 'var(--color-steel)',
  inspired_by: 'var(--color-orange)',
  references: 'var(--color-text-3)',
};

/** Node styles aligned with brand tokens (sharp, industrial) */
const NODE_STYLE: CSSProperties = {
  background: 'var(--color-white)',
  color: 'var(--color-text-1)',
  border: '1px solid var(--color-rule)',
  borderRadius: 0,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
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
    style: {
      stroke: EDGE_COLORS[e.edge_type] ?? 'var(--color-text-3)',
      strokeWidth: 2,
    },
  }));

  return { flowNodes, flowEdges };
}

interface BrainGraphProps {
  nodes: ObNode[];
  edges: ObPublicEdge[];
  onNodeClick: (node: ObNode) => void;
}

export function BrainGraph({ nodes, edges, onNodeClick }: BrainGraphProps): JSX.Element {
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
      className="w-full border border-[color:var(--color-rule)] bg-[color:var(--color-white)]"
      style={{ height: 520 }}
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
        <Background color="var(--color-rule)" gap={20} size={1} />
        <Controls
          style={{
            borderRadius: 0,
            overflow: 'hidden',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-white)',
          }}
        />
        <MiniMap
          nodeColor={() => 'var(--color-text-3)'}
          style={{
            borderRadius: 0,
            overflow: 'hidden',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-white)',
          }}
        />
      </ReactFlow>
    </div>
  );
}
