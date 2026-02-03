import type { JSX } from 'react';
import { useQuote } from '../useQuote';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

export const Quote = (): JSX.Element | null => {
  const { quote, isLoading, error } = useQuote();

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
        <p className={cardBody}>
          Quote unavailable right now. Try again later.
        </p>
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
          <p className="m-0 mb-4">"{quote.content}"</p>
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
