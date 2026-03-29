'use client';

import type { JSX } from 'react';
import type { ClipboardEvent } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConfirmModal } from '../ConfirmModal';
import remarkGfm from 'remark-gfm';
import type { ObNode, ObNodeCreate, ObNodeUpdate } from '../../lib/obApi';
import { useAlert } from '../../contexts/AlertContext';
import { markdownObAttachImage, uploadOpenBrainNodeImage } from '../../lib/brainPasteImage';
import { getClipboardImageFiles } from '../../utils/clipboardImageFiles';
import { brainMarkdownUrlTransform, obBrainMarkdownComponents } from './brainMarkdownPreview';

const NODE_TYPES: Array<ObNode['node_type']> = ['note', 'concept', 'question', 'source', 'project'];
const VISIBILITIES: Array<ObNode['visibility']> = ['private', 'public', 'shared'];

interface NodeEditorProps {
  node: ObNode | null;
  onSave: (data: ObNodeCreate | ObNodeUpdate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel?: () => void;
}

export function NodeEditor({ node, onSave, onDelete, onCancel }: NodeEditorProps): JSX.Element {
  const [title, setTitle] = useState(node?.title ?? '');
  const [body, setBody] = useState(node?.body ?? '');
  const [nodeType, setNodeType] = useState<ObNode['node_type']>(node?.node_type ?? 'note');
  const [visibility, setVisibility] = useState<ObNode['visibility']>(node?.visibility ?? 'private');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { showAlert } = useAlert();

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

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!node?.id || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(node.id);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }, [node?.id, onDelete]);

  const handleBodyPaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (showPreview) return;
      if (!node?.id) {
        showAlert('Save the node first, then paste images into the body.', 'Info');
        return;
      }
      const files = getClipboardImageFiles(e);
      if (files.length === 0) return;
      e.preventDefault();
      const ta = bodyTextareaRef.current;
      const insertMarkdown = (md: string): void => {
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          setBody((v) => v.slice(0, start) + md + v.slice(end));
          requestAnimationFrame(() => {
            ta.focus();
            const pos = start + md.length;
            ta.setSelectionRange(pos, pos);
          });
        } else {
          setBody((v) => (v ? `${v}\n${md}` : md));
        }
      };
      for (const file of files) {
        try {
          const { id } = await uploadOpenBrainNodeImage(node.id, file);
          insertMarkdown(`${markdownObAttachImage(id)}\n`);
        } catch (err) {
          showAlert(err instanceof Error ? err.message : 'Image upload failed', 'Error');
        }
      }
    },
    [node?.id, showPreview, showAlert],
  );

  return (
    <div className="ob-node-editor flex flex-col gap-4">
      <div>
        <label htmlFor="ob-node-title" className="field-label">
          Title
        </label>
        <input
          id="ob-node-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Node title"
          className="field-input"
          data-testid="node-title"
        />
      </div>

      <div>
        <div className="mb-[7px] flex items-center justify-between gap-2">
          <span id="ob-node-body-label" className="field-label mb-0">
            Body (Markdown)
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-inv-2)] underline-offset-2 transition-colors hover:text-[color:var(--color-text-inv)] hover:underline"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {!showPreview && (
          <p className="mt-1 font-display text-[11px] text-[color:var(--color-text-inv-2)]">
            {node?.id
              ? 'Tip: Paste images from the clipboard to embed them (stored securely; preview loads via signed URL).'
              : 'Save the node once, then you can paste images into the body.'}
          </p>
        )}
        {showPreview ? (
          <div
            id="ob-node-body-preview"
            role="region"
            aria-labelledby="ob-node-body-label"
            className="ob-node-preview w-full min-h-[120px] border border-[color:var(--color-rule-md)] bg-[color:var(--color-ink)] px-[14px] py-[10px] font-display text-[13px] leading-relaxed text-[color:var(--color-text-inv)] [&_h1]:text-[1.1rem] [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-[color:var(--color-text-inv)] first:[&_h1]:mt-0 [&_h2]:text-[1rem] [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-[color:var(--color-text-inv)] [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-[color:var(--color-text-inv)] [&_p]:mb-2 [&_p]:text-[color:var(--color-text-inv)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:rounded-none [&_code]:bg-[color:var(--color-surface)] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-[color:var(--color-text-inv)] [&_pre]:border [&_pre]:border-[color:var(--color-rule-dark)] [&_pre]:bg-[color:var(--color-surface)] [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[color:var(--color-orange)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-[color:var(--color-text-inv-2)] [&_a]:text-[color:var(--color-orange)] [&_a]:underline"
            data-testid="node-body-preview"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={brainMarkdownUrlTransform}
              components={obBrainMarkdownComponents}
            >
              {body || '(empty)'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={bodyTextareaRef}
            id="ob-node-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onPaste={handleBodyPaste}
            placeholder="Write in Markdown..."
            rows={8}
            className="field-input"
            aria-labelledby="ob-node-body-label"
            data-testid="node-body"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="ob-node-type" className="field-label">
            Type
          </label>
          <select
            id="ob-node-type"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as ObNode['node_type'])}
            className="field-input min-w-[140px] py-[9px]"
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
          <label htmlFor="ob-node-visibility" className="field-label">
            Visibility
          </label>
          <select
            id="ob-node-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ObNode['visibility'])}
            className="field-input min-w-[140px] py-[9px]"
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
          className="border border-[color:var(--color-rule-dark)] bg-[color:var(--color-surface)] p-3 font-display text-[12px] text-[color:var(--color-text-inv-2)]"
          data-testid="ai-summary"
        >
          <span className="font-semibold text-[color:var(--color-text-inv)]">AI summary: </span>
          <span>{node.ai_summary}</span>
        </div>
      )}

      {node?.ai_tags && node.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="ai-tags">
          {node.ai_tags.map((tag) => (
            <span
              key={tag}
              className="border border-[color:var(--color-rule-dark)] bg-[color:var(--color-ink)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-text-inv-2)]"
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
          className="act-btn primary disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="save-node-btn"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="act-btn">
            Cancel
          </button>
        )}
        {node?.id && onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className="act-btn border-[color:rgba(225,29,72,0.65)] text-[color:#FB7185] hover:border-[color:#E11D48] hover:text-[color:#FECDD3] disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="delete-node-btn"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
      {node?.id && onDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Node"
          message="Are you sure you want to delete this node? This action cannot be undone."
          warning="This action cannot be undone"
          confirmLabel="Delete Node"
          variant="destructive"
          icon="🗑"
          isLoading={deleting}
        />
      )}
    </div>
  );
}
