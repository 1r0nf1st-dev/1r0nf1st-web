'use client';

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { obApi, type ObSearchResult } from '../../lib/obApi';
import { Search, MessageCircle, Loader2 } from 'lucide-react';

interface ChatPanelProps {
  brainOwnerId: string;
}

export function ChatPanel({ brainOwnerId }: ChatPanelProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ObSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const onSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const results = await obApi.ai.search(q, brainOwnerId, 10);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, brainOwnerId]);

  const onChat = useCallback(async () => {
    const q = chatQuery.trim();
    if (!q) return;
    setChatting(true);
    setChatError(null);
    setChatResponse(null);
    try {
      const { response } = await obApi.ai.chat(q, brainOwnerId);
      setChatResponse(response);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Chat failed');
    } finally {
      setChatting(false);
    }
  }, [chatQuery, brainOwnerId]);

  const inputClass =
    'flex-1 min-w-0 border border-[color:var(--color-rule-dark)] bg-[color:var(--color-ink)] px-3 py-2 font-display text-[13px] text-[color:var(--color-text-inv)] placeholder:text-[color:var(--color-text-inv-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-orange)]';

  return (
    <div className="space-y-6">
      <section>
        <label
          htmlFor="ob-search"
          className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-text-inv-2)]"
        >
          Semantic search
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ob-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search nodes by meaning…"
            className={inputClass}
            aria-label="Search your brain"
            data-testid="search-input"
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-1.5 bg-[color:var(--color-orange)] px-3 py-[7px] font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-70"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Search className="w-4 h-4" aria-hidden />
            )}
            Search
          </button>
        </div>
        {searchError && (
          <p
            className="mt-1 font-display text-[12px] text-[color:var(--color-orange)]"
            role="alert"
          >
            {searchError}
          </p>
        )}
        {searchResults && (
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto" data-testid="search-results">
            {searchResults.length === 0 ? (
            <li
              className="font-display text-[12px] text-[color:var(--color-text-inv-2)]"
              data-testid="no-results"
            >
                No matching nodes.
              </li>
            ) : (
              searchResults.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-[color:var(--color-rule-dark)] pb-2 last:border-0"
                  data-testid="search-result-item"
                >
                  <span className="font-display text-[13px] font-bold text-[color:var(--color-text-inv)]">
                    {r.title || 'Untitled'}
                  </span>
                  {r.ai_summary && (
                    <p className="mt-0.5 font-display text-[12px] text-[color:var(--color-text-inv-2)] line-clamp-2">
                      {r.ai_summary}
                    </p>
                  )}
                  <span className="font-mono text-[10px] text-[color:var(--color-text-inv-2)]">
                    {(r.similarity * 100).toFixed(0)}% match
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <section>
        <label
          htmlFor="ob-chat"
          className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-text-inv-2)]"
        >
          Chat (RAG)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ob-chat"
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onChat()}
            placeholder="Ask a question…"
            className={inputClass}
            aria-label="Chat with your brain"
            data-testid="chat-input"
          />
          <button
            type="button"
            onClick={onChat}
            disabled={chatting || !chatQuery.trim()}
            className="flex items-center gap-1.5 bg-[color:var(--color-orange)] px-3 py-[7px] font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-70"
            data-testid="chat-send"
          >
            {chatting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircle className="w-4 h-4" aria-hidden />
            )}
            Ask
          </button>
        </div>
        {chatError && (
          <p
            className="mt-1 font-display text-[12px] text-[color:var(--color-orange)]"
            role="alert"
          >
            {chatError}
          </p>
        )}
        {chatResponse && (
          <div
            className="mt-2 border border-[color:var(--color-rule-dark)] bg-[color:var(--color-surface)] p-3 font-display text-[12px] text-[color:var(--color-text-inv)] whitespace-pre-wrap"
            role="region"
            aria-label="Chat response"
            data-testid="chat-response"
          >
            {chatResponse}
          </div>
        )}
      </section>
    </div>
  );
}
