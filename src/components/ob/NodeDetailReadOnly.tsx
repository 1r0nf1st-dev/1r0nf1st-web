'use client';

import type { JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ObNode } from '../../lib/obApi';
import { brainMarkdownUrlTransform, obBrainMarkdownComponents } from './brainMarkdownPreview';
import { NodeReactions } from './NodeReactions';
import { cardClasses, cardTitle, cardBody } from '../../styles/cards';

const NODE_TYPE_LABELS: Record<ObNode['node_type'], string> = {
  note: 'Note',
  concept: 'Concept',
  question: 'Question',
  source: 'Source',
  project: 'Project',
};

interface NodeDetailReadOnlyProps {
  node: ObNode;
  /** When set (e.g. admin on public brain), reactions UI is shown. */
  currentUserId?: string;
}

export function NodeDetailReadOnly({ node, currentUserId }: NodeDetailReadOnlyProps): JSX.Element {
  return (
    <div className={cardClasses + ' space-y-4'}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
          {NODE_TYPE_LABELS[node.node_type]}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Public</span>
      </div>
      <h2 className={cardTitle}>{node.title || 'Untitled'}</h2>
      {node.body && (
        <div
          className="text-sm text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 first:[&_h1]:mt-0 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline"
          data-testid="node-detail-panel"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={brainMarkdownUrlTransform}
            components={obBrainMarkdownComponents}
          >
            {node.body}
          </ReactMarkdown>
        </div>
      )}
      {node.ai_summary && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm" data-testid="ai-summary">
          <span className="font-medium text-muted-foreground">AI summary: </span>
          <span className="text-foreground">{node.ai_summary}</span>
        </div>
      )}
      {node.ai_tags && node.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="ai-tags">
          {node.ai_tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary"
              data-testid="ai-tag"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {!node.body && !node.ai_summary && (
        <p className={cardBody + ' text-muted-foreground'}>No content.</p>
      )}
      {currentUserId && (
        <div className="pt-3 border-t border-border">
          <NodeReactions nodeId={node.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
