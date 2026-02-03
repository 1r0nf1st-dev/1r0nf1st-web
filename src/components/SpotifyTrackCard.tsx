import type { JSX } from 'react';
import type { SpotifyTrack } from '../useSpotifyRecentlyPlayed';
import { cardClasses, cardOverlay, cardBody } from '../styles/cards';

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
    <article className={cardClasses} id={id}>
      <div className={cardOverlay} aria-hidden />
      <div className={`${cardBody} flex flex-col h-full`}>
        <div className="flex items-start gap-3 mb-2">
          {track.albumImageUrl && (
            <a
              href={track.trackUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
              aria-hidden
            >
              <img
                src={track.albumImageUrl}
                alt=""
                width={80}
                height={80}
                className="object-cover rounded block"
              />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium mb-1 text-foreground">
              <a
                href={track.trackUrl}
                target="_blank"
                rel="noreferrer"
                className="no-underline text-inherit"
              >
                {track.trackName}
              </a>
            </h2>
            <p className="m-0 opacity-80 text-sm">{track.artistNames}</p>
            <p className="m-0 opacity-70 text-xs">{track.albumName}</p>
          </div>
        </div>
        <p className="m-0 opacity-70 text-xs mt-auto pt-2">
          {formatPlayedAt(track.playedAt)}
        </p>
        <div className="mt-2">
          <a
            href={track.trackUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary no-underline hover:underline"
          >
            Play on Spotify →
          </a>
        </div>
      </div>
    </article>
  );
};
