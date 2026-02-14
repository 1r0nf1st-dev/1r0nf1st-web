'use client';

import type { JSX, ReactNode } from 'react';
import { useStravaStats } from '../useStravaStats';
import type { StravaTotalsPeriod } from '../useStravaStats';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function TotalsSection({
  title,
  period,
}: {
  title: string;
  period: StravaTotalsPeriod;
}): JSX.Element {
  return (
    <div className="mb-4 pb-4 border-b border-border/50">
      <h3 className="m-0 mb-2 text-sm font-medium text-foreground">{title}</h3>
      <ul className="m-0 p-0 list-none text-sm opacity-90">
        <li>Distance: {period.distanceMiles.toFixed(1)} mi</li>
        <li>Time: {formatTime(period.movingTimeSeconds)}</li>
        <li>Elevation: {Math.round(period.elevationGainM)} m</li>
      </ul>
    </div>
  );
}

export const StravaStats = (): JSX.Element | null => {
  const { totals, isLoading, error } = useStravaStats();

  const card = (
    id: string,
    title: string,
    body: ReactNode,
  ): JSX.Element => (
    <article className={cardClasses} id={id}>
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>{title}</h2>
      <div className={cardBody}>{body}</div>
    </article>
  );

  if (isLoading) return card('strava', 'Strava', 'Loading activity totals…');
  if (error) return card('strava', 'Strava', `Error: ${error}`);
  if (!totals) {
    return card(
      'strava',
      'Strava',
      <>
        No totals. Make sure the API server is running and Strava is configured
        in <code>.env</code>.
      </>,
    );
  }

  return (
    <article className={cardClasses} id="strava">
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Strava</h2>
      <div className={cardBody}>
        <TotalsSection title="Last 4 weeks" period={totals.recent} />
        <TotalsSection title="Year to date" period={totals.ytd} />
        <TotalsSection title="All time" period={totals.allTime} />
      </div>
    </article>
  );
};
