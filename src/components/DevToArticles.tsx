'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useDevToArticles } from '../useDevToArticles';
import { DevToArticleCard } from './DevToArticleCard';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

const DEFAULT_LIMIT = 6;

// You can configure the source here or via environment variable
// Options: 'username' (your articles), 'tag' (articles by tag), 'latest' (latest articles), 'top' (top articles)
const DEVTO_SOURCE =
  ((typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEVTO_SOURCE : (import.meta as { env?: Record<string, string> }).env?.VITE_DEVTO_SOURCE) as
    | 'username'
    | 'tag'
    | 'latest'
    | 'top') || 'latest';
const DEVTO_TAG =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEVTO_TAG : (import.meta as { env?: Record<string, string> }).env?.VITE_DEVTO_TAG) ||
  'javascript';

export const DevToArticles = (): JSX.Element | null => {
  // Only pass tag if source is 'tag' and tag is provided
  const tagToUse = DEVTO_SOURCE === 'tag' && DEVTO_TAG ? DEVTO_TAG : undefined;
  
  // Only show articles with images
  const onlyWithImages = true;
  
  const { articles, isLoading, error } = useDevToArticles(
    DEFAULT_LIMIT,
    DEVTO_SOURCE,
    tagToUse,
    onlyWithImages,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const getTitle = (): string => {
    if (DEVTO_SOURCE === 'tag') {
      return `Dev.to: #${DEVTO_TAG}`;
    }
    if (DEVTO_SOURCE === 'latest') {
      return 'Latest on Dev.to';
    }
    if (DEVTO_SOURCE === 'top') {
      return 'Top on Dev.to';
    }
    return 'Dev.to Articles';
  };

  if (isLoading) {
    return (
      <article className={cardClasses} id="devto">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>{getTitle()}</h2>
        <p className={cardBody}>Loading articles from Dev.to…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="devto">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>{getTitle()}</h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  if (!articles || articles.length === 0) {
    return null; // Don't show the card if there are no articles
  }

  return (
    <>
      {articles.map((article, index) => (
        <DevToArticleCard
          key={article.link}
          article={article}
          isExpanded={expandedId === article.link}
          onToggle={() => {
            setExpandedId(expandedId === article.link ? null : article.link);
          }}
          id={index === 0 ? 'devto' : undefined}
        />
      ))}
    </>
  );
};
