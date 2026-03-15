'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { Clipboard, Copy } from 'lucide-react';
import { getJson } from '../apiClient';
import { getApiBase } from '../config';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';
import { BrandName } from './BrandName';

export interface WebClipperSectionProps {
  /** Compact layout for sidebar (smaller spacing, collapsible setup guide) */
  compact?: boolean;
}

export const WebClipperSection = ({
  compact = false,
}: WebClipperSectionProps): JSX.Element => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (): Promise<void> => {
    setError('');
    setToken(null);
    setIsLoading(true);
    try {
      const res = await getJson<{ token: string; createdAt: string }>(
        `${getApiBase()}/notes/web-clipper-token`,
        { method: 'POST' },
      );
      setToken(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy token');
    }
  };

  const titleClass = compact
    ? 'text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2'
    : 'text-lg font-semibold text-foreground mb-4';

  return (
    <div className={compact ? 'py-1' : ''}>
      <h2 className={titleClass}>Web Clipper</h2>
      <div className={compact ? 'px-2 space-y-2' : 'space-y-4'}>
        {!compact && (
          <p className="text-sm text-muted mb-4">
            Save any webpage to Notes in one click. Generate a token below, then paste
            it into the Chrome extension.
          </p>
        )}
        <details className="mb-3">
          <summary className="text-sm font-medium text-primary cursor-pointer hover:underline list-none [&::-webkit-details-marker]:hidden">
            {compact ? 'Setup guide' : 'Step-by-step setup guide'}
          </summary>
          <p className="mt-2 text-xs text-muted">
            Use the <strong><BrandName /> Notes Clipper</strong>—not in the Chrome Web Store;
            not the Evernote extension.
          </p>
          <ol className="mt-3 space-y-2 text-sm text-muted list-decimal list-inside pl-2">
            <li>
              Install:{' '}
              <a
                href="https://github.com/1r0nf1st-dev/1r0nf1st-website/archive/refs/heads/main.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Download extension (ZIP)
              </a>
              , unzip, then open <code className="text-xs bg-surface-soft dark:bg-surface px-1 rounded-xl">chrome://extensions</code> → Developer mode → Load unpacked → select the{' '}
              <code className="text-xs bg-surface-soft dark:bg-surface px-1 rounded-xl">web-clipper</code>{' '}
              folder.
            </li>
            <li>Generate a token below (you must be logged in)</li>
            <li>
              Click the extension icon, enter Site URL (e.g.{' '}
              <code className="text-xs bg-surface-soft dark:bg-surface px-1 rounded-xl">https://1r0nf1st.vercel.app</code>)
              and paste the token
            </li>
            <li>On any webpage, click the extension icon → Clip page</li>
          </ol>
        </details>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}
        {token ? (
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Copy this token now. It won&apos;t be shown again. Generating a new token
              revokes the previous one.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={token}
                className="flex-1 min-w-0 p-2 text-sm rounded-xl border border-primary/30 dark:border-border bg-surface-soft/50 text-foreground font-mono truncate"
                aria-label="Web Clipper token"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`${btnBase} ${btnGhost} shrink-0 px-3 flex items-center gap-2`}
                aria-label={copied ? 'Copied' : 'Copy token'}
              >
                {copied ? (
                  <Clipboard className="w-4 h-4 text-green-600" aria-hidden />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className={`${btnBase} ${btnGhost} text-sm`}
            >
              Generate new token
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className={`${btnBase} ${btnPrimary} w-full ${compact ? 'text-sm py-2' : ''}`}
          >
            {isLoading ? 'Generating…' : 'Generate Web Clipper token'}
          </button>
        )}
      </div>
    </div>
  );
};
