'use client';

import type { JSX } from 'react';
import { PublicPageShell } from './PublicPageShell';

interface PublicProjectCard {
  number: string;
  title: string;
  description: string;
  tags: string[];
  statusLabel: string;
  statusPending?: boolean;
}

const projects: PublicProjectCard[] = [
  {
    number: '01',
    title: 'Second Brain',
    description:
      'Supabase-powered personal knowledge system with semantic vector search, note capture, and AI-powered retrieval.',
    tags: ['Next.js', 'Supabase', 'pgvector'],
    statusLabel: '● Live',
  },
  {
    number: '02',
    title: 'Mobile QA Agent',
    description:
      'Playwright-powered automated mobile UI testing pipeline running on Kubernetes with Datadog monitoring.',
    tags: ['TypeScript', 'Playwright', 'K8s'],
    statusLabel: '● Live',
  },
  {
    number: '03',
    title: 'Dev Dashboard',
    description:
      'Internal developer tooling with real-time Datadog log monitoring, Azure DevOps integration, and Vercel deployment tracking.',
    tags: ['React', 'Datadog', 'Azure'],
    statusLabel: '● Live',
  },
  {
    number: '04',
    title: 'OpenBrain',
    description:
      'Public AI-linked knowledge graph with Next.js, Express, Supabase with pgvector, and Gemini as the AI provider.',
    tags: ['Next.js', 'Gemini', 'pgvector'],
    statusLabel: '◌ In Progress',
    statusPending: true,
  },
  {
    number: '05',
    title: 'Auto Bug Fixer',
    description:
      'Automated daily bug-fixing pipeline using GitHub Actions, Vercel and Supabase logs, Gemini Flash for fix generation, auto PR opening.',
    tags: ['GitHub Actions', 'Gemini'],
    statusLabel: '● Live',
  },
  {
    number: '06',
    title: 'Claude Code Setup',
    description:
      'Custom Claude Code configuration with morning standup slash commands pulling from Azure DevOps and on-prem Datadog.',
    tags: ['Claude Code', 'Azure DevOps'],
    statusLabel: '● Live',
  },
];

export const PublicProjectsPage = (): JSX.Element => {
  return (
    <PublicPageShell
      mode="embedded"
      hero={{
        flagLabel: 'Selected Work',
        watermark: 'Projects',
        title: (
          <>
            Things We&apos;ve <em>Engineered.</em>
          </>
        ),
        subtitle:
          'A focused collection of tools and web applications. Every project built with the same precision and intent.',
        primaryBtn: { label: 'Get In Touch', href: '/contact' },
        secondaryBtn: { label: 'About Us', href: '/about' },
      }}
    >
      <div className="projects-grid" aria-label="Projects list">
        {projects.map((p) => (
          <button key={p.number} type="button" className="project-card" aria-label={p.title}>
            <div className="proj-number">{p.number}</div>
            <div className="proj-title">{p.title}</div>
            <div className="proj-desc">{p.description}</div>
            <div className="proj-tags">
              {p.tags.map((tag) => (
                <span key={tag} className="proj-tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="proj-footer">
              <span className={p.statusPending ? 'proj-status pending' : 'proj-status'}>
                {p.statusLabel}
              </span>
              <span className="proj-arrow" aria-hidden>
                →
              </span>
            </div>
          </button>
        ))}
      </div>
    </PublicPageShell>
  );
};
