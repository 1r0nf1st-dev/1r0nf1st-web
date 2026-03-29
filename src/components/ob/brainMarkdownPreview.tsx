'use client';

import type { JSX } from 'react';
import type { Components } from 'react-markdown';
import { ObAttachMarkdownImg } from './ObAttachMarkdownImg';

/** react-markdown `img` renderer — passes string `src` through to attachment resolver. */
export function ObBrainMarkdownImg(props: {
  src?: string | Blob;
  alt?: string;
  className?: string;
}): JSX.Element {
  return (
    <ObAttachMarkdownImg
      src={typeof props.src === 'string' ? props.src : undefined}
      alt={typeof props.alt === 'string' ? props.alt : undefined}
      className={props.className}
    />
  );
}

export const obBrainMarkdownComponents: Partial<Components> = {
  img: ObBrainMarkdownImg,
};

export { brainMarkdownUrlTransform } from '../../utils/brainMarkdownUrlTransform';
