'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { CogPair } from './CogPair';
import { BrandName } from './BrandName';

export const Hero = (): JSX.Element => (
  <section className="hero relative grid min-h-[320px] min-w-0 grid-cols-[minmax(0,1fr)_280px] overflow-hidden bg-[color:var(--color-ink)] border-b-[3px] border-b-[color:var(--color-orange)]">
    {/* Left column */}
    <div className="hero-content relative z-10 min-w-0 px-8 py-14">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-orange)]">
        <span className="inline-block h-px w-6 bg-[color:var(--color-orange)]" />
        <span>Second Brain Platform</span>
      </div>
      <h1 className="mb-4 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-black italic uppercase leading-[1] tracking-[-0.02em] text-[color:var(--color-text-inv)]">
        Built with
        <br />
        <BrandName className="not-italic text-[color:var(--color-orange)]" />
        <br />
        Precision.
      </h1>
      <p className="mb-7 max-w-[380px] font-display text-[13px] font-normal leading-[1.75] text-[color:var(--color-text-inv-2)]">
        Tools and web experiences engineered for performance. Next.js, React, TypeScript — every cog
        turning with intent.
      </p>
      <div className="flex gap-0">
        <Link
          href="/projects"
          className="bg-[color:var(--color-orange)] px-6 py-[11px] text-[11px] font-bold uppercase tracking-[0.12em] text-white"
        >
          View Projects
        </Link>
        <a
          href="#work"
          className="border border-[rgba(255,255,255,0.15)] px-6 py-[11px] text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--color-text-inv)] hover:border-[rgba(255,255,255,0.4)]"
        >
          Our Work ↓
        </a>
      </div>
    </div>

    {/* Right column: cog panel */}
    <div id="hero-svg" className="cog-panel relative flex h-[320px] w-[280px] items-center justify-center overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-[rgba(255,255,255,0.06)]">
      <CogPair
        // Hero variant params from Section 4c
        lx={158}
        ly={148}
        lr={72}
        lt={12}
        la={14}
        ld={10}
        sx={74}
        sy={226}
        sr={42}
        st={8}
        sa={10}
        sd={7}
        speed={0.25}
        width={280}
        height={320}
        viewBox="0 0 280 320"
        variant="hero"
      />
    </div>

    {/* Background watermark text */}
    <div
      className="hero-bg-text pointer-events-none absolute bottom-[-24px] left-[-8px] z-0 font-display text-[140px] font-black italic uppercase leading-none tracking-tight text-[color:var(--color-text-inv)]"
      style={{ opacity: 0.022 }}
      aria-hidden="true"
    >
      <BrandName />
    </div>
  </section>
);
