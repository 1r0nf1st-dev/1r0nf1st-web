'use client';

import type { JSX } from 'react';
import type { ObNode } from '../../lib/obApi';
import { cardClasses, cardTitle, cardBody } from '../../styles/cards';

interface NodeCardProps {
  node: ObNode;
  isSelected?: boolean;
  onSelect: () => void;
}

const NODE_TYPE_LABELS: Record<ObNode['node_type'], string> = {
  note: 'Note',
  concept: 'Concept',
  question: 'Question',
  source: 'Source',
  project: 'Project',
};

export function NodeCard({ node, isSelected, onSelect }: NodeCardProps): JSX.Element {
  const summary = node.ai_summary ?? node.body ?? '';
  const snippet = summary.slice(0, 120) + (summary.length > 120 ? '…' : '');

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${cardClasses} w-full text-left transition-all hover:border-primary/50 dark:hover:border-primary/50 ${isSelected ? 'ring-2 ring-primary border-primary/60' : ''}`}
      aria-pressed={isSelected}
      aria-label={`Open node: ${node.title}`}
      data-testid="node-card"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary dark:bg-primary/30"
          data-testid={`type-badge-${node.node_type}`}
        >
          {NODE_TYPE_LABELS[node.node_type]}
        </span>
        {node.visibility === 'public' && (
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Public
          </span>
        )}
      </div>
      <h3 className={cardTitle + ' mt-2'}>{node.title || 'Untitled'}</h3>
      {snippet && <p className={cardBody + ' line-clamp-2'}>{snippet}</p>}
    </button>
  );
}
