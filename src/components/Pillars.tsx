import type { JSX } from 'react';
import { BrandName } from './BrandName';
import { GhostCog } from './GhostCog';

export interface PillarValue {
  number: string;
  title: string;
  body: string;
}

const defaultPillars: PillarValue[] = [
  {
    number: '01 ——',
    title: 'Strategy',
    body: 'User-centered architecture and clear requirements before a single line is written.',
  },
  {
    number: '02 ——',
    title: 'Creativity',
    body: 'Clean design, intuitive UX, and attention to every interaction detail.',
  },
  {
    number: '03 ——',
    title: 'Speed',
    body: 'Modern stack, lean processes, rapid iteration to ship faster without cutting corners.',
  },
  {
    number: '04 ——',
    title: 'Precision',
    body: 'Quality code, meaningful tests, real performance. No shortcuts on what matters.',
  },
];

export interface PillarsProps {
  values?: PillarValue[];
  variant?: 'landing' | 'public';
}

export const Pillars = ({ values, variant = 'landing' }: PillarsProps): JSX.Element => {
  const effectiveValues = values ?? defaultPillars;
  const publicMode = variant === 'public';

  return (
    <section
      className={
        publicMode
          ? 'pillars border-b border-[color:var(--color-rule-dark)] bg-[color:var(--color-ink)] px-0 py-0'
          : 'pillars border-b border-[color:var(--color-rule-dark)] bg-[color:var(--color-ink)] px-8 py-[52px]'
      }
    >
      <div
        className={
          publicMode
            ? 'mb-7 flex items-center gap-3 px-8 py-[52px]'
            : 'mb-7 flex items-center gap-3'
        }
      >
        <div className="h-px flex-1 bg-[color:var(--color-rule-dark)]" />
        <div className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.20em] text-[color:var(--color-text-inv-2)]">
          What We Deliver
        </div>
        <div className="h-px flex-1 bg-[color:var(--color-rule-dark)]" />
      </div>

      <h2
        className={
          publicMode
            ? 'mb-7 font-display text-[1.7rem] font-black italic uppercase tracking-[-0.01em] text-[color:var(--color-text-inv)] px-8'
            : 'mb-7 font-display text-[1.7rem] font-black italic uppercase tracking-[-0.01em] text-[color:var(--color-text-inv)] px-0'
        }
      >
        The <BrandName /> Standard
      </h2>

      <div
        className={
          publicMode
            ? 'mt-7 grid grid-cols-4 gap-[1px] bg-[color:var(--color-rule-dark)] px-8 pb-[52px]'
            : 'mt-7 grid grid-cols-4 gap-[1px] bg-[color:var(--color-rule-dark)]'
        }
      >
        {effectiveValues.map((pillar, index) => (
          <div
            key={pillar.title}
            className="relative overflow-hidden bg-[color:var(--color-surface)] px-[22px] py-[26px]"
          >
            <div className="mb-6 font-mono text-[9px] text-[color:var(--color-orange)] tracking-[0.14em]">
              {pillar.number}
            </div>
            <div className="mb-1.5 font-display text-[1rem] font-black uppercase tracking-[0.06em] text-[color:var(--color-text-inv)]">
              {pillar.title}
            </div>
            <div className="font-display text-[12px] font-normal leading-[1.65] text-[color:var(--color-text-inv-2)]">
              {pillar.body}
            </div>
            <div className="pointer-events-none absolute bottom-[-18px] right-[-18px]">
              <GhostCog reverse={index % 2 === 1} light />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
