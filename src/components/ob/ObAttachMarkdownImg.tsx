'use client';

import type { ImgHTMLAttributes, JSX } from 'react';
import { useEffect, useState } from 'react';
import { fetchOpenBrainAttachmentDownloadUrl, isObAttachSrc } from '../../lib/brainPasteImage';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt?: string;
};

type ResolvedAttachProps = {
  attachId: string;
  alt?: string;
  className?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;

function ObAttachResolvedImage({
  attachId,
  alt,
  className,
  ...rest
}: ResolvedAttachProps): JSX.Element {
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchOpenBrainAttachmentDownloadUrl(attachId)
      .then(({ downloadUrl }) => {
        if (!cancelled) setResolved(downloadUrl);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load image');
      });
    return () => {
      cancelled = true;
    };
  }, [attachId]);

  if (error) {
    return <span className="text-[color:var(--color-orange)] text-xs">{error}</span>;
  }

  if (!resolved) {
    return <span className="text-[color:var(--color-text-inv-2)] text-xs">Loading image…</span>;
  }

  return (
    <img
      src={resolved}
      alt={alt ?? ''}
      className={`max-w-full h-auto ${className ?? ''}`}
      {...rest}
    />
  );
}

/**
 * Renders Markdown images: resolves `ob-attach:uuid` via authenticated download URL.
 * External http(s) URLs pass through as normal <img>.
 */
export function ObAttachMarkdownImg({ src, alt, className, ...rest }: Props): JSX.Element {
  const attachId = isObAttachSrc(src);

  if (!src) {
    return <span className="text-[color:var(--color-text-inv-2)] text-xs">(missing image)</span>;
  }

  if (!attachId) {
    return <img src={src} alt={alt ?? ''} className={className} {...rest} />;
  }

  return (
    <ObAttachResolvedImage key={attachId} attachId={attachId} alt={alt} className={className} {...rest} />
  );
}
