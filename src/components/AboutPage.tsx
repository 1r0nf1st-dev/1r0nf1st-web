'use client';

import type { JSX } from 'react';
import { BrandName } from './BrandName';
import { PublicPageShell } from './PublicPageShell';
import { Pillars, type PillarValue } from './Pillars';

const aboutValues: PillarValue[] = [
  {
    number: '01',
    title: 'Strategy',
    body: 'Architecture and clear requirements before a single line is written.',
  },
  {
    number: '02',
    title: 'Creativity',
    body: 'Clean design, intuitive UX, and attention to every interaction detail.',
  },
  {
    number: '03',
    title: 'Speed',
    body: 'Modern stack, lean processes, rapid iteration without cutting corners.',
  },
  {
    number: '04',
    title: 'Precision',
    body: 'Quality code, meaningful tests, real performance. No shortcuts.',
  },
];

export const AboutPage = (): JSX.Element => {
  return (
    <PublicPageShell
      hero={{
        flagLabel: 'About',
        watermark: '1r0nf1st',
        title: (
          <>
            Precision
            <br />
            <em>Engineered.</em>
          </>
        ),
        subtitle:
          'We build tools and web experiences that work the way they should — fast, focused, and built to last.',
        primaryBtn: { label: 'View Projects', href: '/projects' },
        secondaryBtn: { label: 'Get In Touch', href: '/contact' },
      }}
    >
      <div>
        <div className="stats-row" role="group" aria-label="About stats">
          <div className="stat-block">
            <span className="stat-value accent">5+</span>
            <span className="stat-label">Years Building</span>
          </div>
          <div className="stat-block">
            <span className="stat-value">100s</span>
            <span className="stat-label">Projects Shipped</span>
          </div>
          <div className="stat-block">
            <span className="stat-value accent">100%</span>
            <span className="stat-label">Any language</span>
          </div>
          <div className="stat-block">
            <span className="stat-value">0</span>
            <span className="stat-label">Shortcuts Taken</span>
          </div>
        </div>

        <div className="about-copy-grid" aria-label="About copy">
          <div className="font-display text-[13px] leading-[1.75] text-[color:var(--color-text-inv-2)]">
            <BrandName /> is a focused web development practice built around one principle — every cog
            turns with intent. We build Second Brain platforms, AI-powered pipelines, developer
            tooling, and production-grade web applications. Nothing half-finished. Nothing that
            doesn&apos;t earn its place. Our stack is modern and deliberate — Next.js, React,
            TypeScript, Supabase with pgvector, Kubernetes for orchestration, Playwright for quality
            assurance. We ship with confidence because we test everything.
          </div>
          <div className="font-display text-[13px] leading-[1.75] text-[color:var(--color-text-inv-2)]">
            We operate as a small, sharp team. That means direct communication, fast decisions, and
            no bureaucracy between an idea and its execution. Every project starts with
            architecture. Every sprint ends with a working deployment. Every release goes through a
            tested pipeline. Precision is not a feature. It&apos;s the baseline.
          </div>
        </div>

        <Pillars values={aboutValues} variant="public" />
      </div>
    </PublicPageShell>
  );
};
