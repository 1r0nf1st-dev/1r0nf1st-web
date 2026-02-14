import type { JSX } from 'react';
import { useState } from 'react';
import { useJoke } from '../useJoke';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';

export const Joke = (): JSX.Element | null => {
  const { joke, isLoading, error, refetch } = useJoke();
  const [showPunchline, setShowPunchline] = useState(false);

  if (isLoading) {
    return (
      <article className={cardClasses} id="joke">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Joke</h2>
        <p className={cardBody}>Loading joke…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="joke">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Joke</h2>
        <div className={cardBody}>
          <p className="mb-4">
            Joke unavailable right now. Try again later.
          </p>
          {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && error && (
            <p className="mb-4 text-xs opacity-80" role="status">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setShowPunchline(false);
              refetch();
            }}
            className={`${btnBase} ${btnGhost} text-sm`}
          >
            Try again
          </button>
        </div>
      </article>
    );
  }

  if (!joke) {
    return (
      <article className={cardClasses} id="joke">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Joke</h2>
        <p className={cardBody}>
          No joke available. Make sure the API server is running.
        </p>
      </article>
    );
  }

  return (
    <article className={cardClasses} id="joke">
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Joke</h2>
      <div className={cardBody}>
        <div className="mb-4">
          <p className="m-0 text-[1.05rem] leading-relaxed opacity-95">
            {joke.setup}
          </p>
          {showPunchline && (
            <p className="mt-4 m-0 text-[1.05rem] leading-relaxed font-medium opacity-95">
              {joke.punchline}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!showPunchline ? (
            <button
              type="button"
              onClick={() => setShowPunchline(true)}
              className={`${btnBase} ${btnGhost} text-sm`}
            >
              Show punchline
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowPunchline(false);
                refetch();
              }}
              className={`${btnBase} ${btnGhost} text-sm`}
            >
              New joke
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
