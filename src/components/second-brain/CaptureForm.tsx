'use client';

import type { ClipboardEvent, FormEvent, JSX } from 'react';
import { useState } from 'react';
import { getJson } from '../../apiClient';
import { markdownSbAttachImage, uploadSecondBrainThoughtImage } from '../../lib/brainPasteImage';
import { getClipboardImageFiles } from '../../utils/clipboardImageFiles';

interface CaptureResult {
  thoughtId: string;
  category: string;
  routed: boolean;
}

export const CaptureForm = (): JSX.Element => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Last captured thought — paste images here to upload + PATCH raw text (Browse still supports full edit). */
  const [lastCapture, setLastCapture] = useState<{ thoughtId: string; rawText: string } | null>(null);
  const [attachMessage, setAttachMessage] = useState<string | null>(null);
  const [attachMessageIsError, setAttachMessageIsError] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLastCapture(null);
    setAttachMessage(null);
    setAttachMessageIsError(false);
    try {
      const res = await getJson<CaptureResult>('/api/second-brain/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      const captured = rawText.trim();
      setResult(res);
      setLastCapture({ thoughtId: res.thoughtId, rawText: captured });
      setRawText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteAttach = async (e: ClipboardEvent<HTMLTextAreaElement>): Promise<void> => {
    if (!lastCapture) return;
    const files = getClipboardImageFiles(e);
    if (files.length === 0) return;
    e.preventDefault();
    setAttachBusy(true);
    setAttachMessage(null);
    setAttachMessageIsError(false);
    try {
      const lines: string[] = [];
      for (const file of files) {
        const { id } = await uploadSecondBrainThoughtImage(lastCapture.thoughtId, file);
        lines.push(markdownSbAttachImage(id));
      }
      const block = lines.join('\n');
      const nextRaw = lastCapture.rawText ? `${lastCapture.rawText}\n${block}` : block;
      await getJson<{ id: string }>(`/api/second-brain/thoughts/${lastCapture.thoughtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: nextRaw }),
      });
      setLastCapture({ thoughtId: lastCapture.thoughtId, rawText: nextRaw });
      setAttachMessage('Image(s) attached to this thought.');
      setAttachMessageIsError(false);
    } catch (err) {
      setAttachMessage(err instanceof Error ? err.message : 'Failed to attach image');
      setAttachMessageIsError(true);
    } finally {
      setAttachBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="content-panel max-w-2xl">
      <h2 className="panel-title">Quick capture</h2>
      <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]">
        Add a thought, task, idea, or resource. AI will classify and route it. After capture, use the box
        below to paste images, or open the thought in Browse to edit full raw text.
      </p>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="PROJECTS: Claude code&#10;IDEAS: subscription model for consultancy&#10;PEOPLE: Sarah — follow up Q2 proposal"
        rows={4}
        className="field-input min-h-[140px] font-mono text-[12px] leading-[1.7]"
        disabled={loading}
        aria-label="Capture text"
      />
      <button type="submit" disabled={loading || !rawText.trim()} className="input-row-btn">
        {loading ? 'Capturing…' : 'Capture'}
      </button>
      {error && (
        <p className="font-display text-[12px] text-[color:var(--color-orange)]" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className="font-display text-[12px] text-[color:var(--color-text-inv-2)]" role="status">
          ✓ {result.category}
          {result.routed ? ' — routed' : ' — in inbox'}
        </p>
      )}
      {lastCapture ? (
        <div className="mt-4 border border-[color:var(--color-rule-md)] bg-[color:var(--color-ink)] p-3">
          <p className="mb-2 font-display text-[11px] text-[color:var(--color-text-inv-2)]">
            Paste images from the clipboard here (focus this field, then paste). They are uploaded and
            <code className="mx-1 font-mono text-[10px]">sb-attach:</code> references are appended to this
            thought.
          </p>
          <textarea
            readOnly
            rows={2}
            onPaste={handlePasteAttach}
            placeholder="Click here, then paste an image…"
            disabled={attachBusy}
            className="field-input min-h-[72px] cursor-default font-mono text-[11px] text-[color:var(--color-text-inv-2)]"
            aria-label="Paste images to attach to captured thought"
            data-testid="capture-paste-images"
          />
          {attachMessage ? (
            <p
              className={`mt-2 font-display text-[11px] ${
                attachMessageIsError
                  ? 'text-[color:var(--color-orange)]'
                  : 'text-[color:var(--color-text-inv-2)]'
              }`}
              role="status"
            >
              {attachMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
};
