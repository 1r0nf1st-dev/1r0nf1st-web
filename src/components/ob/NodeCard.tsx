'use client';

import type { JSX } from 'react';
import type { ObNode } from '../../lib/obApi';

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
      className={[
        'w-full text-left border border-[color:var(--color-rule-dark)] bg-[color:var(--color-surface)] px-4 py-3 transition-colors hover:bg-[color:var(--color-raised)] hover:border-[color:var(--color-rule-md)]',
        isSelected
          ? 'border-[color:var(--color-orange)] ring-1 ring-[color:var(--color-orange)]'
          : '',
      ].join(' ')}
      aria-pressed={isSelected}
      aria-label={`Open node: ${node.title}`}
      data-testid="node-card"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] px-2 py-0.5 bg-[color:var(--color-orange-dim)] text-[color:var(--color-orange)] border border-[rgba(224,92,26,0.18)]"
          data-testid={`type-badge-${node.node_type}`}
        >
          {NODE_TYPE_LABELS[node.node_type]}
        </span>
        {node.visibility === 'public' && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 bg-[color:var(--color-ink)] text-[color:var(--color-text-inv-2)] border border-[color:var(--color-rule-dark)]">
            Public
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-inv)]">
        {node.title || 'Untitled'}
      </h3>
      {snippet && (
        <p className="font-display text-[12px] leading-[1.6] text-[color:var(--color-text-inv-2)] line-clamp-2">
          {snippet}
        </p>
      )}
    </button>
  );
}
