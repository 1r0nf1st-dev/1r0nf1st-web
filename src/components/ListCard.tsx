'use client';

import type { JSX, ReactNode } from 'react';

export interface ListCardProps {
  icon?: ReactNode;
  title: string;
  tag?: string;
  date?: string;
  onClick?: () => void;
  right?: ReactNode;
}

export const ListCard = ({
  icon,
  title,
  tag,
  date,
  onClick,
  right,
}: ListCardProps): JSX.Element => {
  return (
    <button type="button" className="list-card" onClick={onClick}>
      <div className="card-icon" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <div className="card-title">{title}</div>
        <div className="card-meta">
          {tag ? <span className="card-tag">{tag}</span> : null}
          {date ? <span className="card-date">{date}</span> : null}
        </div>
      </div>
      <div className="card-arrow" aria-hidden>
        {right ?? '→'}
      </div>
    </button>
  );
};
