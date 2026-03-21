import type { JSX } from 'react';

const items = [
  'Next.js',
  'React',
  'TypeScript',
  'Supabase',
  'Kubernetes',
  'Playwright',
  'pgvector',
  'Datadog',
  'Claude Code',
  'Azure DevOps',
];

export const Ticker = (): JSX.Element => (
  <div className="bg-[color:var(--color-orange)] py-[9px] overflow-hidden">
    <div className="flex whitespace-nowrap animate-[marquee_22s_linear_infinite]">
      {[...items, ...items].map((item) => (
        <span
          key={item + Math.random().toString(36).slice(2)}
          className="border-r border-[rgba(255,255,255,0.25)] px-6 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[rgba(255,255,255,0.9)]"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
);
