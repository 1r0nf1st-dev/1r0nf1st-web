import type { JSX } from 'react';
import { useState } from 'react';
import { useMediumStories } from '../useMediumStories';
import { MediumStoryCard } from './MediumStoryCard';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

const DEFAULT_LIMIT = 6;

export const MediumStories = (): JSX.Element => {
  const { stories, isLoading, error } = useMediumStories(DEFAULT_LIMIT);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <article className={cardClasses} id="medium">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Latest on Medium</h2>
        <p className={cardBody}>Loading stories from Medium…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="medium">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Latest on Medium</h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <article className={cardClasses} id="medium">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Latest on Medium</h2>
        <p className={cardBody}>
          No stories found. Make sure the API server is running and{' '}
          <code>MEDIUM_FEED_URL</code> or <code>MEDIUM_USERNAME</code> is set in{' '}
          <code>.env</code>.
        </p>
      </article>
    );
  }

  return (
    <>
      {stories.map((story, index) => (
        <MediumStoryCard
          key={story.link}
          story={story}
          isExpanded={expandedId === story.link}
          onToggle={() => {
            setExpandedId(expandedId === story.link ? null : story.link);
          }}
          id={index === 0 ? 'medium' : undefined}
        />
      ))}
    </>
  );
};
