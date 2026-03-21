'use client';

import type { JSX, ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { StickyNote, Sun, Heart, Cloud, Star, Mail, Shield, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CorporateNav } from './CorporateNav';
import { CorporateFooter } from './CorporateFooter';
import { ScrollReveal } from '../ScrollReveal';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

interface CorporateProject {
  id: number;
  icon: LucideIcon;
  title: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  link: string;
  adminOnly?: boolean;
}

const WORKING_PROJECTS: CorporateProject[] = [
  {
    id: 21,
    icon: StickyNote,
    title: 'Notes',
    description:
      'Rich text notes with TipTap, sharing, templates, web clipper, saved searches, attachments, and version history.',
    tags: ['Notes', 'TipTap', 'Sharing', 'Templates'],
    link: '/notes',
  },
  {
    id: 19,
    icon: Sun,
    title: 'Weather Dashboard',
    description: 'Live weather data and forecasts.',
    tags: ['Weather', 'API'],
    link: '/projects/weather',
  },
  {
    id: 17,
    icon: Heart,
    title: 'Health Tracker',
    description: 'Monitor health and wellness.',
    tags: ['Health', 'Tracking'],
    link: '/projects/health-tracker',
  },
  {
    id: 11,
    icon: Cloud,
    title: 'Cloud Infrastructure',
    description: 'Infrastructure and DevOps demos.',
    tags: ['Cloud', 'DevOps'],
    link: '/projects/cloud',
  },
  {
    id: 10,
    icon: Star,
    title: 'Featured Showcase',
    description: 'Curated project highlights.',
    tags: ['Showcase'],
    link: '/projects/showcase',
  },
];

const ADMIN_PROJECTS: CorporateProject[] = [
  {
    id: 100,
    icon: Brain,
    title: 'Second Brain',
    description:
      'Capture thoughts, semantic search, browse projects, people, ideas, and view digests.',
    tags: ['Admin', 'Second Brain', 'AI'],
    link: '/projects/second-brain',
    adminOnly: true,
  },
  {
    id: 101,
    icon: Mail,
    title: 'Send Email',
    description: 'Send emails via Brevo.',
    tags: ['Admin'],
    link: '/projects/send-email',
    adminOnly: true,
  },
  {
    id: 102,
    icon: Shield,
    title: 'Domain Auth',
    description: 'Domain-based authentication.',
    tags: ['Admin'],
    link: '/projects/domain-auth',
    adminOnly: true,
  },
];

function formatProjectNumber(index: number): string {
  return String(index + 1).padStart(3, '0');
}

function ProjectTile({
  project,
  index,
  children,
}: {
  project: CorporateProject;
  index: number;
  children: ReactNode;
}): JSX.Element {
  return (
    <Link
      href={project.link}
      className="relative flex flex-col items-center justify-center gap-3 p-6 border border-[color:var(--color-rule)] bg-[color:var(--color-white)] hover:border-[color:var(--color-text-3)] transition-all duration-200 min-h-[180px] no-underline text-inherit focus-visible:outline-none"
      aria-label={`View ${project.title}, project ${formatProjectNumber(index)}`}
    >
      <span
        className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-3)] absolute top-4 left-4"
        aria-hidden
      >
        {formatProjectNumber(index)}
      </span>
      {children}
    </Link>
  );
}

function AdminPlaceholderTile({
  project,
  index,
}: {
  project: CorporateProject;
  index: number;
}): JSX.Element {
  const IconComponent = project.icon;
  const loginTo = `/login?returnTo=${encodeURIComponent(project.link)}`;
  return (
    <Link
      href={loginTo}
      className="relative flex flex-col items-center justify-center gap-3 p-6 border border-[color:var(--color-rule)] bg-[color:var(--color-white)] hover:border-[color:var(--color-text-3)] transition-all duration-200 min-h-[180px] no-underline text-inherit focus-visible:outline-none opacity-90"
      aria-label={`Login to access ${project.title}, project ${formatProjectNumber(index)}`}
    >
      <span
        className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-3)] absolute top-4 left-4"
        aria-hidden
      >
        {formatProjectNumber(index)}
      </span>
      <IconComponent className="text-4xl text-[color:var(--color-orange)] shrink-0" aria-hidden />
      <span className="text-sm font-medium text-foreground text-center">{project.title}</span>
      <span className="text-xs text-muted">Admin only · Log in</span>
    </Link>
  );
}

interface CorporateProjectsPageProps {
  /** When true, render only content (no Nav/Footer) for embedding in shared layout */
  embedInLayout?: boolean;
}

export const CorporateProjectsPage = ({
  embedInLayout = false,
}: CorporateProjectsPageProps): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const content = (
    <section className="border-b border-[color:var(--color-rule)] bg-[color:var(--color-white)] px-8 py-14">
      <div className="mb-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-[color:var(--color-rule)]" />
        <div className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.20em] text-[color:var(--color-text-3)]">
          Selected Work
        </div>
        <div className="h-px flex-1 bg-[color:var(--color-rule)]" />
      </div>
      <h1 className="mb-7 font-display text-[1.7rem] font-black italic uppercase tracking-[-0.01em] text-[color:var(--color-text-1)]">
        Things We&apos;ve Engineered
      </h1>
      <p className="mb-7 max-w-2xl font-display text-[13px] leading-[1.75] text-[color:var(--color-text-2)]">
        A selection of web applications and tools built with modern technologies.
      </p>

      <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {WORKING_PROJECTS.filter((project) => project.id === 21) // Notes only
            .map((project, idx) => {
              const IconComponent = project.icon;
              const projectIndex = idx;
              return (
                <ProjectTile key={project.id} project={project} index={projectIndex}>
                  <div
                    className="w-16 h-16 flex items-center justify-center border border-[color:var(--color-rule)] bg-[color:var(--color-orange-bg)]"
                    aria-hidden
                  >
                    <IconComponent className="text-3xl text-[color:var(--color-orange)] shrink-0" />
                  </div>
                  <span className="font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-1)] text-center">
                    {project.title}
                  </span>
                  {(project.description || (project.tags && project.tags.length > 0)) && (
                    <div className="font-display text-[12px] text-[color:var(--color-text-2)] text-center line-clamp-2">
                      {project.description ?? project.tags?.join(' · ')}
                    </div>
                  )}
                </ProjectTile>
              );
            })}
          {ADMIN_PROJECTS.map((project, idx) => {
            const IconComponent = project.icon;
            const adminIndex = idx + 1; // Send Email is 002, Domain Auth is 003
            return isAdmin ? (
              <ProjectTile key={project.id} project={project} index={adminIndex}>
                <div
                  className="w-16 h-16 flex items-center justify-center border border-[color:var(--color-rule)] bg-[color:var(--color-orange-bg)]"
                  aria-hidden
                >
                  <IconComponent className="text-3xl text-[color:var(--color-orange)] shrink-0" />
                </div>
                <span className="font-display text-[14px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-text-1)] text-center">
                  {project.title}
                </span>
                {(project.description || (project.tags && project.tags.length > 0)) && (
                  <div className="font-display text-[12px] text-[color:var(--color-text-2)] text-center line-clamp-2">
                    {project.description ?? project.tags?.join(' · ')}
                  </div>
                )}
              </ProjectTile>
            ) : (
              <AdminPlaceholderTile key={project.id} project={project} index={adminIndex} />
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );

  if (embedInLayout) {
    return <div className="py-10 md:py-16">{content}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CorporateNav />
      <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        {content}
      </main>
      <CorporateFooter />
    </div>
  );
};
