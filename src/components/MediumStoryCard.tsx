import type { JSX } from 'react';
import type { MediumStory } from '../useMediumStories';

export interface MediumStoryCardProps {
  story: MediumStory;
  isExpanded: boolean;
  onToggle: () => void;
  id?: string;
}

function formatPubDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MediumStoryCard = ({
  story,
  isExpanded,
  onToggle,
  id,
}: MediumStoryCardProps): JSX.Element => {
  return (
    <article className="card" id={id}>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
          {story.thumbnailUrl && (
            <a
              href={story.link}
              target="_blank"
              rel="noreferrer"
              style={{ flexShrink: 0 }}
              aria-hidden
            >
              <img
                src={story.thumbnailUrl}
                alt=""
                width={120}
                height={80}
                style={{
                  objectFit: 'cover',
                  borderRadius: '4px',
                  display: 'block',
                }}
              />
            </a>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              <a
                href={story.link}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {story.title}
              </a>
            </h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>
              {formatPubDate(story.pubDate)} · {story.author}
            </p>
          </div>
        </div>
        {isExpanded && story.description && (
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              maxHeight: '300px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
            }}
            className="medium-story-content"
            dangerouslySetInnerHTML={{ __html: story.description }}
          />
        )}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.85rem',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            Read on Medium →
          </a>
        </div>
      </div>
    </article>
  );
};
