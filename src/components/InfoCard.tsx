import type { JSX } from 'react';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

export interface InfoCardProps {
  title: string;
  children: JSX.Element | string | (JSX.Element | string)[];
}

export const InfoCard = ({ title, children }: InfoCardProps): JSX.Element => {
  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>{title}</h2>
      <p className={cardBody}>{children}</p>
    </article>
  );
};
