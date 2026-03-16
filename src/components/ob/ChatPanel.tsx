'use client';

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { obApi, type ObSearchResult } from '../../lib/obApi';
import { btnBase, btnPrimary } from '../../styles/buttons';
import { cardClasses } from '../../styles/cards';
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

  return (
    <div className={cardClasses + ' space-y-6'}>
      <h2 className="text-lg font-semibold text-foreground">Ask your brain</h2>

      <section>
        <label htmlFor="ob-search" className="block text-sm font-medium text-foreground mb-1">
          Semantic search
        </label>
        <div className="flex gap-2">
          <input
            id="ob-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search nodes by meaning…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary"
            aria-label="Search your brain"
            data-testid="search-input"
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={searching || !searchQuery.trim()}
            className={`${btnBase} ${btnPrimary} flex items-center gap-1.5`}
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
          <p className="mt-1 text-sm text-destructive" role="alert">
            {searchError}
          </p>
        )}
        {searchResults && (
          <ul
            className="mt-2 space-y-2 max-h-48 overflow-y-auto"
            data-testid="search-results"
          >
            {searchResults.length === 0 ? (
              <li className="text-sm text-muted" data-testid="no-results">
                No matching nodes.
              </li>
            ) : (
              searchResults.map((r) => (
                <li
                  key={r.id}
                  className="text-sm border-b border-border/50 pb-2 last:border-0"
                  data-testid="search-result-item"
                >
                  <span className="font-medium text-foreground">{r.title || 'Untitled'}</span>
                  {r.ai_summary && (
                    <p className="text-muted line-clamp-2 mt-0.5">{r.ai_summary}</p>
                  )}
                  <span className="text-xs text-muted">{(r.similarity * 100).toFixed(0)}% match</span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <section>
        <label htmlFor="ob-chat" className="block text-sm font-medium text-foreground mb-1">
          Chat (RAG)
        </label>
        <div className="flex gap-2">
          <input
            id="ob-chat"
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onChat()}
            placeholder="Ask a question…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:ring-2 focus:ring-primary"
            aria-label="Chat with your brain"
            data-testid="chat-input"
          />
          <button
            type="button"
            onClick={onChat}
            disabled={chatting || !chatQuery.trim()}
            className={`${btnBase} ${btnPrimary} flex items-center gap-1.5`}
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
          <p className="mt-1 text-sm text-destructive" role="alert">
            {chatError}
          </p>
        )}
        {chatResponse && (
          <div
            className="mt-2 p-3 rounded-lg bg-muted/40 text-sm text-foreground whitespace-pre-wrap"
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
