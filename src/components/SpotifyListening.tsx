import type { JSX } from 'react';
import { useSpotifyRecentlyPlayed } from '../useSpotifyRecentlyPlayed';
import { SpotifyTrackCard } from './SpotifyTrackCard';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

const DEFAULT_LIMIT = 8;

export const SpotifyListening = (): JSX.Element | null => {
  const { tracks, isLoading, error } = useSpotifyRecentlyPlayed(DEFAULT_LIMIT);

  if (isLoading) {
    return (
      <article className={cardClasses} id="spotify">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Recently played</h2>
        <p className={cardBody}>Loading from Spotify…</p>
      </article>
    );
  }

  if (error) {
    return null;
  }

  if (!tracks || tracks.length === 0) {
    return (
      <article className={cardClasses} id="spotify">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Recently played</h2>
        <p className={cardBody}>
          No recent tracks. Make sure the API server is running and{' '}
          <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code>, and{' '}
          <code>SPOTIFY_REFRESH_TOKEN</code> are set in <code>.env</code>.
        </p>
      </article>
    );
  }

  return (
    <>
      {tracks.map((track, index) => (
        <SpotifyTrackCard
          key={`${track.trackUrl}-${track.playedAt}`}
          track={track}
          id={index === 0 ? 'spotify' : undefined}
        />
      ))}
    </>
  );
};
