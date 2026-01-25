import type { JSX } from 'react';

export interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export const InfoCard = ({ title, children }: InfoCardProps): JSX.Element => {
  return (
    <article className="card">
      <h2 className="card-title">{title}</h2>
      <p className="card-body">{children}</p>
    </article>
  );
};
