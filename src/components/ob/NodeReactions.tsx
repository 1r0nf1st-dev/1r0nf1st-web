'use client';

import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { obApi, type ObReaction, type ObReactionType } from '../../lib/obApi';
import { btnBase, btnGhost, btnCompact } from '../../styles/buttons';

const REACTION_TYPES: ObReactionType[] = [
  'resonates',
  'challenges',
  'expands',
  'bookmarks',
];

const REACTION_LABELS: Record<ObReactionType, string> = {
  resonates: 'Resonates',
  challenges: 'Challenges',
  expands: 'Expands',
  bookmarks: 'Bookmarks',
};

interface NodeReactionsProps {
  nodeId: string;
  currentUserId: string;
}

export function NodeReactions({
  nodeId,
  currentUserId,
}: NodeReactionsProps): JSX.Element {
  const [reactions, setReactions] = useState<ObReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<ObReactionType | null>(null);

  const fetchReactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await obApi.reactions.list(nodeId);
      setReactions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reactions');
      setReactions([]);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const hasReacted = (type: ObReactionType): boolean =>
    reactions.some((r) => r.type === type && r.user_id === currentUserId);

  const countByType = (type: ObReactionType): number =>
    reactions.filter((r) => r.type === type).length;

  const handleToggle = async (type: ObReactionType): Promise<void> => {
    setToggling(type);
    try {
      if (hasReacted(type)) {
        await obApi.reactions.remove(nodeId, type);
      } else {
        await obApi.reactions.add(nodeId, type);
      }
      await fetchReactions();
    } catch {
      setError('Failed to update reaction');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted" data-testid="reaction-list">
        Loading reactions…
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="reaction-list">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {REACTION_TYPES.map((type) => {
          const count = countByType(type);
          const active = hasReacted(type);
          const disabled = toggling !== null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleToggle(type)}
              disabled={disabled}
              className={`${btnBase} ${btnGhost} ${btnCompact} ${
                active ? 'ring-2 ring-primary/50' : ''
              }`}
              aria-pressed={active}
              aria-label={`${REACTION_LABELS[type]} (${count})${active ? ', you reacted' : ''}`}
              data-testid={`reaction-${type}`}
            >
              <span>{REACTION_LABELS[type]}</span>
              {count > 0 && (
                <span className="text-muted-foreground" aria-hidden>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
