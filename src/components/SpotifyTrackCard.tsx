import type { JSX } from 'react';
import type { SpotifyTrack } from '../useSpotifyRecentlyPlayed';

export interface SpotifyTrackCardProps {
  track: SpotifyTrack;
  id?: string;
}

function formatPlayedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SpotifyTrackCard = ({
  track,
  id,
}: SpotifyTrackCardProps): JSX.Element => {
  return (
    <article className="card" id={id}>
      <div
        className="card-body"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          {track.albumImageUrl && (
            <a
              href={track.trackUrl}
              target="_blank"
              rel="noreferrer"
              style={{ flexShrink: 0 }}
              aria-hidden
            >
              <img
                src={track.albumImageUrl}
                alt=""
                width={80}
                height={80}
                style={{
                  objectFit: 'cover',
                  borderRadius: '4px',
                  display: 'block',
                }}
              />
            </a>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
              <a
                href={track.trackUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {track.trackName}
              </a>
            </h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>
              {track.artistNames}
            </p>
            <p style={{ margin: 0, opacity: 0.7, fontSize: '0.8rem' }}>
              {track.albumName}
            </p>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            opacity: 0.7,
            fontSize: '0.8rem',
            marginTop: 'auto',
            paddingTop: '0.5rem',
          }}
        >
          {formatPlayedAt(track.playedAt)}
        </p>
        <div style={{ marginTop: '0.5rem' }}>
          <a
            href={track.trackUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.85rem',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            Play on Spotify →
          </a>
        </div>
      </div>
    </article>
  );
};
