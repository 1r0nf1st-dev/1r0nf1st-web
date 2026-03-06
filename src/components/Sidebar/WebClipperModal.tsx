'use client';

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Copy, Key, RefreshCw, X } from 'lucide-react';
import { getJson } from '../../apiClient';
import { getApiBase } from '../../config';
import { cardClasses, cardTitle } from '../../styles/cards';
import { btnBase, btnGhost } from '../../styles/buttons';

export interface WebClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebClipperModal = ({ isOpen, onClose }: WebClipperModalProps): JSX.Element | null => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const generateToken = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await getJson<{ token: string }>(`${getApiBase()}/notes/web-clipper-token`, {
        method: 'POST',
      });
      setToken(response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-0 left-0 z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web-clipper-modal-title"
    >
      <article className={`${cardClasses} max-w-md w-full`} onClick={(e) => e.stopPropagation()}>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 id="web-clipper-modal-title" className={cardTitle}>
              Web Clipper
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`${btnBase} ${btnGhost} text-sm`}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-4">
            {!token ? (
              <button
                type="button"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-white disabled:opacity-60 hover:bg-primary/90 transition-colors"
                onClick={() => {
                  generateToken().catch(() => {});
                }}
                aria-label="Generate token"
              >
                <Key className="h-4 w-4" aria-hidden />
                {isLoading ? 'Generating…' : 'Generate token'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-surface-soft px-3 py-2 text-xs font-mono text-foreground break-all">
                  {token}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      handleCopy().catch(() => {});
                    }}
                    aria-label="Copy token"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {copied ? 'Copied!' : 'Copy token'}
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                    onClick={() => setConfirmRegen(true)}
                    aria-label="Generate new token"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Generate new
                  </button>
                </div>
                {confirmRegen ? (
                  <div aria-live="polite" className="space-y-2 rounded-xl border border-primary/20 p-3 text-sm">
                    <p className="text-foreground">This will invalidate your current token. Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
                        onClick={() => {
                          setConfirmRegen(false);
                          generateToken().catch(() => {});
                        }}
                      >
                        Yes, regenerate
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-primary/20 px-3 py-2 text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                        onClick={() => setConfirmRegen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-primary hover:text-primary/80">
                Setup guide
              </summary>
              <p className="mt-2 text-sm text-muted">
                Install the extension, then add your site URL and token to clip notes.
              </p>
            </details>
          </div>
        </div>
      </article>
    </div>
  );
};
