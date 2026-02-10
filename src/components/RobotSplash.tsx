import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CutsceneCodingProblem } from './CutsceneCodingProblem';
import { RobotWalkRaiseAnimation } from './RobotWalkRaiseAnimation';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

type Step = 'boot' | 'intro' | 'cutscene' | 'theme';

const BOOT_DURATION_MS = 2500;
const BOOT_TICK_MS = 80;

export interface RobotSplashProps {
  onEnter: () => void;
}

export const RobotSplash = ({ onEnter }: RobotSplashProps): JSX.Element | null => {
  const { setTheme } = useTheme();
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [step, setStep] = useState<Step>(() => (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'intro' : 'boot'));
  const [bootPercent, setBootPercent] = useState(0);

  useEffect(() => {
    if (step !== 'boot') return;
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setBootPercent((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep('intro');
          return 100;
        }
        return p + (100 / (BOOT_DURATION_MS / BOOT_TICK_MS));
      });
    }, BOOT_TICK_MS);
    return () => clearInterval(interval);
  }, [step, reducedMotion]);

  const handleCutsceneComplete = useCallback(() => setStep('theme'), []);
  const handleTheme = useCallback(
    (theme: 'light' | 'dark') => {
      setTheme(theme);
      onEnter();
    },
    [setTheme, onEnter],
  );

  const skipLink = (
    <button
      type="button"
      onClick={onEnter}
      className="absolute top-4 right-4 text-sm text-muted hover:text-foreground underline focus:ring-2 focus:ring-primary rounded bg-transparent border-0 cursor-pointer"
      aria-label="Skip to portfolio"
    >
      Skip to portfolio
    </button>
  );

  if (step === 'boot') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
        {skipLink}
        <article className={cardClasses} style={{ maxWidth: '420px' }}>
          <div className={cardOverlay} aria-hidden />
          <div className="relative z-10">
            <h1 className={cardTitle}>Initializing 1r0nf1st... {Math.min(100, Math.round(bootPercent))}%</h1>
            <p className={cardBody}>Booting up systems.</p>
          </div>
        </article>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
        {skipLink}
        <article className={cardClasses} style={{ maxWidth: '420px' }}>
          <div className={cardOverlay} aria-hidden />
          <div className="relative z-10 flex flex-col items-center text-center">
            <RobotWalkRaiseAnimation width={140} loop className="mb-4" />
            <h1 className={cardTitle}>Hi, I&apos;m 1r0nf1st</h1>
            <p className={cardBody}>I&apos;m here to help. Ready?</p>
            <button type="button" onClick={() => setStep('cutscene')} className={`${btnBase} ${btnPrimary} mt-4`}>
              Continue
            </button>
          </div>
        </article>
      </div>
    );
  }

  if (step === 'cutscene') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
        {skipLink}
        <div className="w-full max-w-lg">
          <CutsceneCodingProblem onComplete={handleCutsceneComplete} />
        </div>
      </div>
    );
  }

  if (step === 'theme') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative">
        {skipLink}
        <article className={cardClasses} style={{ maxWidth: '420px' }}>
          <div className={cardOverlay} aria-hidden />
          <div className="relative z-10 flex flex-col items-center text-center">
            <img
              src="/logo.jpg"
              alt="1r0nf1st"
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 dark:border-border shadow-md mb-3"
            />
            <h2 className={cardTitle}>Would you like a dark theme or a light theme?</h2>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleTheme('dark')}
                className={`${btnBase} ${btnPrimary}`}
                aria-label="Use dark theme"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleTheme('light')}
                className={`${btnBase} ${btnGhost}`}
                aria-label="Use light theme"
              >
                Light
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return null;
}
