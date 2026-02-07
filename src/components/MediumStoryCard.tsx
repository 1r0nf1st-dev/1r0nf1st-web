import type { JSX } from 'react';
import type { MediumStory } from '../useMediumStories';
import { cardClasses, cardOverlay, cardBody } from '../styles/cards';

export interface MediumStoryCardProps {
  story: MediumStory;
  isExpanded: boolean;
  onToggle?: () => void;
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
  id,
}: MediumStoryCardProps): JSX.Element => {
  return (
    <article className={cardClasses} id={id}>
      <div className={cardOverlay} aria-hidden />
      <div className={`${cardBody} flex flex-col h-full`}>
        <div className="flex items-start gap-3 mb-2">
          {story.thumbnailUrl && (
            <a
              href={story.link}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
              aria-hidden
            >
              <img
                src={story.thumbnailUrl}
                alt=""
                width={120}
                height={80}
                className="object-cover rounded block"
              />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium mb-1 text-foreground">
              <a
                href={story.link}
                target="_blank"
                rel="noreferrer"
                className="no-underline text-inherit"
              >
                {story.title}
              </a>
            </h2>
            <p className="m-0 opacity-80 text-sm">
              {formatPubDate(story.pubDate)} · {story.author}
            </p>
          </div>
        </div>
        {isExpanded && story.description && (
          <div
            className="mt-3 text-sm leading-relaxed max-h-[300px] overflow-y-auto flex-1 min-h-0 [&_img]:max-w-full [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: story.description }}
          />
        )}
        <div className="mt-auto pt-3">
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary no-underline hover:underline"
          >
            Read on Medium →
          </a>
        </div>
      </div>
    </article>
  );
};
