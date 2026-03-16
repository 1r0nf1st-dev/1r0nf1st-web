'use client';

import type { JSX } from 'react';
import { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ObNode, ObNodeCreate, ObNodeUpdate } from '../../lib/obApi';
import { btnBase, btnPrimary, btnGhost, btnDanger } from '../../styles/buttons';

const NODE_TYPES: Array<ObNode['node_type']> = [
  'note',
  'concept',
  'question',
  'source',
  'project',
];
const VISIBILITIES: Array<ObNode['visibility']> = ['private', 'public', 'shared'];

interface NodeEditorProps {
  node: ObNode | null;
  onSave: (data: ObNodeCreate | ObNodeUpdate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel?: () => void;
}

export function NodeEditor({
  node,
  onSave,
  onDelete,
  onCancel,
}: NodeEditorProps): JSX.Element {
  const [title, setTitle] = useState(node?.title ?? '');
  const [body, setBody] = useState(node?.body ?? '');
  const [nodeType, setNodeType] = useState<ObNode['node_type']>(node?.node_type ?? 'note');
  const [visibility, setVisibility] = useState<ObNode['visibility']>(node?.visibility ?? 'private');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(node?.title ?? '');
    setBody(node?.body ?? '');
    setNodeType(node?.node_type ?? 'note');
    setVisibility(node?.visibility ?? 'private');
  }, [node?.id, node?.title, node?.body, node?.node_type, node?.visibility]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (node) {
        await onSave({ title: title.trim(), body: body || null, node_type: nodeType, visibility });
      } else {
        await onSave({
          title: title.trim(),
          body: body || null,
          node_type: nodeType,
          visibility,
        });
      }
    } finally {
      setSaving(false);
    }
  }, [node, title, body, nodeType, visibility, onSave]);

  const handleDelete = useCallback(async () => {
    if (!node?.id || !onDelete) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this node?')) return;
    setDeleting(true);
    try {
      await onDelete(node.id);
    } finally {
      setDeleting(false);
    }
  }, [node?.id, onDelete]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="ob-node-title" className="block text-sm font-medium text-foreground mb-1">
          Title
        </label>
        <input
          id="ob-node-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Node title"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
          data-testid="node-title"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="ob-node-body" className="block text-sm font-medium text-foreground">
            Body (Markdown)
          </label>
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {showPreview ? (
          <div
            className="w-full min-h-[120px] rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 first:[&_h1]:mt-0 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline"
            data-testid="node-body-preview"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body || '(empty)'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="ob-node-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write in Markdown..."
            rows={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            data-testid="node-body"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Type</label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as ObNode['node_type'])}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            data-testid="node-type"
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ObNode['visibility'])}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            data-testid="node-visibility"
          >
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {node?.ai_summary && (
        <div
          className="rounded-lg bg-muted/40 p-3 text-sm"
          data-testid="ai-summary"
        >
          <span className="font-medium text-muted-foreground">AI summary: </span>
          <span className="text-foreground">{node.ai_summary}</span>
        </div>
      )}

      {node?.ai_tags && node.ai_tags.length > 0 && (
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className={`${btnBase} ${btnPrimary}`}
          data-testid="save-node-btn"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${btnBase} ${btnGhost}`}>
            Cancel
          </button>
        )}
        {node?.id && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`${btnBase} ${btnDanger}`}
            data-testid="delete-node-btn"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
