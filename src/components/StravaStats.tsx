import type { JSX } from 'react';
import { useStravaStats } from '../useStravaStats';
import type { StravaTotalsPeriod } from '../useStravaStats';

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
    <div
      style={{
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>{title}</h3>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: '0.9rem',
          opacity: 0.9,
        }}
      >
        <li>Distance: {period.distanceKm.toFixed(1)} km</li>
        <li>Time: {formatTime(period.movingTimeSeconds)}</li>
        <li>Elevation: {Math.round(period.elevationGainM)} m</li>
      </ul>
    </div>
  );
}

export const StravaStats = (): JSX.Element | null => {
  const { totals, isLoading, error } = useStravaStats();

  if (isLoading) {
    return (
      <article className="card" id="strava">
        <h2 className="card-title">Strava</h2>
        <p className="card-body">Loading activity totals…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className="card" id="strava">
        <h2 className="card-title">Strava</h2>
        <p className="card-body">Error: {error}</p>
      </article>
    );
  }

  if (!totals) {
    return (
      <article className="card" id="strava">
        <h2 className="card-title">Strava</h2>
        <p className="card-body">
          No totals. Make sure the API server is running and Strava is
          configured in <code>.env</code>.
        </p>
      </article>
    );
  }

  return (
    <article className="card" id="strava">
      <h2 className="card-title">Strava</h2>
      <div className="card-body">
        <TotalsSection title="Last 4 weeks" period={totals.recent} />
        <TotalsSection title="Year to date" period={totals.ytd} />
        <TotalsSection title="All time" period={totals.allTime} />
      </div>
    </article>
  );
};
