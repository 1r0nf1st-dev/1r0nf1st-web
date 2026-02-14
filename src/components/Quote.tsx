import type { JSX } from 'react';
import { useQuote } from '../useQuote';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';

export const Quote = (): JSX.Element | null => {
  const { quote, isLoading, error, refetch } = useQuote();

  if (isLoading) {
    return (
      <article className={cardClasses} id="quote">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Quote</h2>
        <p className={cardBody}>Loading quote…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="quote">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Quote</h2>
        <div className={cardBody}>
          <p className="mb-4">
            Quote unavailable right now. Try again later.
          </p>
          {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && error && (
            <p className="mb-4 text-xs opacity-80" role="status">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className={`${btnBase} ${btnGhost} text-sm`}
          >
            Try again
          </button>
        </div>
      </article>
    );
  }

  if (!quote) {
    return (
      <article className={cardClasses} id="quote">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Quote</h2>
        <p className={cardBody}>
          No quote available. Make sure the API server is running.
        </p>
      </article>
    );
  }

  return (
    <article className={cardClasses} id="quote">
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Quote</h2>
      <div className={cardBody}>
        <blockquote className="m-0 p-0 border-none text-[1.05rem] leading-relaxed opacity-95">
          <p className="m-0 mb-4">&quot;{quote.content}&quot;</p>
          <footer className="text-[0.95rem] font-medium opacity-90">
            — {quote.author}
          </footer>
        </blockquote>
        {quote.tags.length > 0 && (
          <p className="mt-4 text-sm opacity-80">{quote.tags.join(' · ')}</p>
        )}
      </div>
    </article>
  );
};
