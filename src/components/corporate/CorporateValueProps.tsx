'use client';

import type { JSX } from 'react';
import { LayoutGrid, Palette, Zap, Crosshair } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: LayoutGrid,
    title: 'STRATEGY',
    description: 'User-centered architecture and clear requirements before we build.',
  },
  {
    icon: Palette,
    title: 'CREATIVITY',
    description: 'Clean design, intuitive UX, and attention to visual and interaction detail.',
  },
  {
    icon: Zap,
    title: 'SPEED',
    description: 'Modern stack, lean processes, and rapid iteration to ship faster.',
  },
  {
    icon: Crosshair,
    title: 'PRECISION',
    description: 'Quality code, tests, and performance—no shortcuts on what matters.',
  },
];

function ValuePropBlock({ icon: Icon, title, description }: ValueProp): JSX.Element {
  return (
    <article className="flex flex-col items-start gap-3 p-6 rounded-xl border border-border bg-surface-soft/30">
      <Icon
        className="text-2xl text-primary shrink-0"
        aria-hidden
      />
      <h3
        className="text-sm font-semibold text-foreground uppercase tracking-wider"
        style={{ letterSpacing: 'var(--letter-spacing-wider)' }}
      >
        {title}
      </h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </article>
  );
}

export const CorporateValueProps = (): JSX.Element => {
  return (
    <section
      className="py-16 md:py-24 px-4 sm:px-6"
      aria-labelledby="value-props-heading"
    >
      <div className="max-w-6xl mx-auto">
        <h2
          id="value-props-heading"
          className="text-2xl md:text-3xl font-bold text-foreground mb-10 tracking-tight"
          style={{ letterSpacing: 'var(--letter-spacing-tight)' }}
        >
          What we deliver
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUE_PROPS.map((prop) => (
            <ValuePropBlock key={prop.title} {...prop} />
          ))}
        </div>
      </div>
    </section>
  );
};
