'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useStravaStats } from '../useStravaStats';
import type { StravaTotalsPeriod } from '../useStravaStats';
import { Skeleton } from './Skeleton';
import { btnBase, btnPrimary } from '../styles/buttons';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface StravaWidgetProps {
  styleTheme?: 'default' | 'corporate';
}

export function StravaWidget({ styleTheme = 'default' }: StravaWidgetProps): JSX.Element {
  const { totals, isLoading, error } = useStravaStats();
  const isCorporate = styleTheme === 'corporate';

  const cardClass = `rounded-xl border border-primary/20 dark:border-border bg-white dark:bg-surface p-4 ${
    isCorporate ? 'md:rounded-xl' : ''
  }`;

  if (isLoading) {
    return (
      <section
        className={cardClass}
        aria-labelledby="strava-widget-heading"
      >
        <h2
          id="strava-widget-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted mb-3"
        >
          Strava
        </h2>
        <div aria-busy>
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>
    );
  }

  if (error || !totals) {
    return (
      <section
        className={cardClass}
        aria-labelledby="strava-widget-heading"
      >
        <h2
          id="strava-widget-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted mb-3"
        >
          Strava
        </h2>
        <p className="text-sm text-muted mb-3">
          Connect your Strava account to see your activity stats.
        </p>
        <Link
          href="/api/strava/auth"
          className={`${btnBase} ${btnPrimary} text-sm py-2 px-4 inline-flex`}
        >
          Connect Strava
        </Link>
        <p className="text-xs text-muted mt-3">
          You&apos;ll be redirected to Strava to authorize. For self-hosted deployments,
          add the refresh token to your <code className="text-xs">.env</code> file.
        </p>
      </section>
    );
  }

  const PeriodRow = ({
    label,
    period,
  }: {
    label: string;
    period: StravaTotalsPeriod;
  }): JSX.Element => (
    <div className="py-2 border-b border-border/30 last:border-0">
      <span className="text-xs font-medium text-muted">{label}</span>
      <ul className="m-0 mt-1 p-0 list-none text-sm">
        <li>{period.distanceMiles.toFixed(1)} mi · {formatTime(period.movingTimeSeconds)}</li>
        <li className="text-muted">{Math.round(period.elevationGainM)} m elev</li>
      </ul>
    </div>
  );

  return (
    <section
      className={cardClass}
      aria-labelledby="strava-widget-heading"
    >
      <h2
        id="strava-widget-heading"
        className="text-sm font-semibold uppercase tracking-wider text-muted mb-3"
      >
        Strava
      </h2>
      <div>
        <PeriodRow label="Last 4 weeks" period={totals.recent} />
        <PeriodRow label="Year to date" period={totals.ytd} />
      </div>
      <Link
        href="/projects/health-tracker"
        className="text-xs text-primary hover:underline mt-2 inline-block"
      >
        View full stats →
      </Link>
    </section>
  );
}
