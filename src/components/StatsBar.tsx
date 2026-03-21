'use client';

import type { JSX } from 'react';

export interface StatItem {
  label: string;
  value: string | number;
  accent?: boolean;
}

export interface StatsBarProps {
  items: StatItem[];
}

export const StatsBar = ({ items }: StatsBarProps): JSX.Element => {
  return (
    <div className="stats-bar" role="group" aria-label="Stats">
      {items.map((item) => (
        <div key={item.label} className="stat">
          <span className={item.accent ? 'stat-value accent' : 'stat-value'}>{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
