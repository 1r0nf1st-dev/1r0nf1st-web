import type { JSX } from 'react';
import type { DevToArticle } from '../useDevToArticles';
import { cardClasses, cardOverlay, cardBody } from '../styles/cards';

export interface DevToArticleCardProps {
  article: DevToArticle;
  isExpanded: boolean;
  onToggle: () => void;
  id?: string;
}

function formatPubDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const DevToArticleCard = ({
  article,
  isExpanded,
  onToggle,
  id,
}: DevToArticleCardProps): JSX.Element => {
  return (
    <article className={cardClasses} id={id}>
      <div className={cardOverlay} aria-hidden />
      <div className={`${cardBody} flex flex-col h-full`}>
        <div className="flex items-start gap-3 mb-2">
          {article.thumbnailUrl && (
            <a
              href={article.link}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
              aria-hidden
            >
              <img
                src={article.thumbnailUrl}
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
                href={article.link}
                target="_blank"
                rel="noreferrer"
                className="no-underline text-inherit"
              >
                {article.title}
              </a>
            </h2>
            <p className="m-0 opacity-80 text-sm mb-2">
              {formatPubDate(article.pubDate)} · {article.author}
            </p>
            <div className="flex flex-wrap gap-2 items-center text-xs opacity-70">
              <span>{article.readingTime} min read</span>
              {article.reactions > 0 && (
                <span>❤️ {article.reactions}</span>
              )}
              {article.comments > 0 && (
                <span>💬 {article.comments}</span>
              )}
            </div>
            {(() => {
              // Ensure tags is always an array
              // Handle both array and string formats (defensive programming)
              let tags: string[] = [];
              const articleTags = article.tags as string[] | string | unknown;
              if (Array.isArray(articleTags)) {
                tags = articleTags;
              } else if (typeof articleTags === 'string') {
                tags = articleTags.split(',').map((t: string) => t.trim()).filter(Boolean);
              }
              
              return tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary-strong"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>
        {isExpanded && article.description && (
          <div className="mt-3 text-sm leading-relaxed max-h-[300px] overflow-y-auto flex-1 min-h-0">
            <p>{article.description}</p>
          </div>
        )}
        <div className="mt-auto pt-3">
          <a
            href={article.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary no-underline hover:underline"
          >
            Read on Dev.to →
          </a>
        </div>
      </div>
    </article>
  );
};
