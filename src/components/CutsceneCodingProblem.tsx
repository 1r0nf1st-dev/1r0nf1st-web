import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { cardClasses, cardOverlay, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';

type ScenePhase = 'problem' | 'robot-enter' | 'solving' | 'fixed' | 'done';

const PHASE_DURATIONS_MS: Record<ScenePhase, number> = {
  problem: 1500,
  'robot-enter': 800,
  solving: 1200,
  fixed: 1500,
  done: 0,
};

export interface CutsceneCodingProblemProps {
  onComplete: () => void;
}

export const CutsceneCodingProblem = ({
  onComplete,
}: CutsceneCodingProblemProps): JSX.Element => {
  const [phase, setPhase] = useState<ScenePhase>('problem');
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const advance = useCallback(() => {
    setPhase((p) => {
      if (p === 'fixed') {
        onComplete();
        return 'done';
      }
      if (p === 'problem') return 'robot-enter';
      if (p === 'robot-enter') return 'solving';
      if (p === 'solving') return 'fixed';
      return p;
    });
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'done') return;
    const duration = reducedMotion ? Math.min(PHASE_DURATIONS_MS[phase], 400) : PHASE_DURATIONS_MS[phase];
    if (duration <= 0) return;
    const t = setTimeout(advance, duration);
    return () => clearTimeout(t);
  }, [phase, advance, reducedMotion]);

  const handleSkip = (): void => {
    onComplete();
  };

  return (
    <article className={cardClasses} aria-live="polite" aria-label="1r0nf1st solves a coding problem">
      <div className={cardOverlay} aria-hidden />
      <div className={`${cardBody} relative z-10 flex flex-col items-center min-h-[280px] justify-center`}>
        {/* Code block + error */}
        <div className="w-full max-w-md rounded-lg border-2 border-red-500/50 dark:border-red-400/50 bg-black/10 dark:bg-white/5 p-3 font-mono text-sm mb-4">
          <div className="text-muted">{'// There is a bug in my circuitry'}</div>
          <div className={phase === 'fixed' || phase === 'done' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {phase === 'problem' || phase === 'robot-enter' ? 'Error: Cannot read property of undefined' : phase === 'solving' ? '...' : '✓ Fixed!'}
          </div>
        </div>

        {/* Robot (logo as face) + optional animation */}
        <div
          className={`flex items-center justify-center gap-3 transition-all duration-500 ${
            phase === 'problem' ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="1r0nf1st robot"
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 dark:border-border shadow-md"
            />
            {(phase === 'solving' || phase === 'fixed') && (
              <span
                className="absolute -inset-1 rounded-full border-2 border-primary/60 animate-ping opacity-40"
                aria-hidden
              />
            )}
          </div>
          {phase === 'fixed' || phase === 'done' ? (
            <span className="text-2xl" role="img" aria-label="Thumbs up">
              👍
            </span>
          ) : null}
        </div>

        {phase === 'fixed' && (
          <p className="mt-3 text-foreground font-medium">1r0nf1st fixed it!</p>
        )}

        <div className="mt-6 flex gap-3">
          {(phase === 'fixed' || phase === 'done') ? (
            <button type="button" onClick={advance} className={`${btnBase} ${btnPrimary}`}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className={`${btnBase} ${btnPrimary} opacity-80 hover:opacity-100`}
              aria-label="Skip cutscene"
            >
              Skip cutscene
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
