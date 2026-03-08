'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';
import {
  Rocket,
  Code,
  Palette,
  Smartphone,
  Wrench,
  Zap,
  Globe,
  BarChart3,
  Star,
  Cloud,
  Shield,
  Database,
  Server,
  Lock,
  Bell,
  Brain,
  Heart,
  Flame,
  Sun,
  Leaf,
  StickyNote,
  Mail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Hero } from './Hero';
import { Footer } from './Footer';
import { AdminOnlyPlaceholderCard } from './AdminOnlyPlaceholderCard';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

interface Project {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
}

function formatProjectNumber(index: number): string {
  return String(index + 1).padStart(3, '0');
}

export const ProjectsPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const projects: Project[] = [
    // Working projects first
    {
      id: 21,
      icon: StickyNote,
      title: 'Notes',
      description:
        'A comprehensive note-taking application with rich text editing, notebooks, tags, templates, note sharing, web clipper, saved searches, attachments, version history, and full-text search. Organize, collaborate, and manage your thoughts effortlessly.',
      link: '/notes',
    },
    {
      id: 19,
      icon: Sun,
      title: 'Weather Dashboard',
      description:
        'Beautiful weather application with detailed forecasts, interactive maps, and location-based recommendations.',
      link: '/projects/weather',
    },
    {
      id: 17,
      icon: Heart,
      title: 'Health Tracker',
      description:
        'Personal health and wellness application with activity tracking, goal setting, and progress visualization.',
      link: '/projects/health-tracker',
    },
    {
      id: 11,
      icon: Cloud,
      title: 'Cloud Infrastructure',
      description:
        'A scalable cloud-based solution designed for modern applications. Features include automated deployment and resource management.',
      link: '/projects/cloud',
    },
    {
      id: 10,
      icon: Star,
      title: 'Featured Showcase',
      description:
        'A curated collection platform that highlights top-rated content, products, and services with user reviews and recommendations.',
      link: '/projects/showcase',
    },
    // Placeholder projects
    {
      id: 1,
      icon: Rocket,
      title: 'Launch Platform',
      description:
        'A powerful deployment and launch management system that streamlines the process of releasing applications to production environments.',
      link: '#project-1',
    },
    {
      id: 2,
      icon: Code,
      title: 'Code Editor Pro',
      description:
        'An advanced code editor with syntax highlighting, intelligent autocomplete, and seamless integration with version control systems.',
      link: '#project-2',
    },
    {
      id: 3,
      icon: Palette,
      title: 'Design Studio',
      description:
        'A comprehensive design tool for creating beautiful interfaces, mockups, and prototypes with collaborative features for teams.',
      link: '#project-3',
    },
    {
      id: 4,
      icon: Smartphone,
      title: 'Mobile App Builder',
      description:
        'Cross-platform mobile application development framework that enables rapid prototyping and deployment for iOS and Android.',
      link: '#project-4',
    },
    {
      id: 5,
      icon: Wrench,
      title: 'DevOps Toolkit',
      description:
        'A collection of essential development and operations tools for automating workflows, managing infrastructure, and improving productivity.',
      link: '#project-5',
    },
    {
      id: 6,
      icon: Zap,
      title: 'Speed Optimizer',
      description:
        'Performance enhancement tool that accelerates application load times and optimizes resource usage for maximum efficiency.',
      link: '#project-6',
    },
    {
      id: 7,
      icon: Globe,
      title: 'Global Network',
      description:
        'Worldwide connectivity platform that enables seamless communication and data exchange across international boundaries.',
      link: '#project-7',
    },
    {
      id: 8,
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description:
        'Comprehensive analytics platform with real-time data visualization, custom reports, and actionable insights for business intelligence.',
      link: '#project-8',
    },
    {
      id: 12,
      icon: Shield,
      title: 'Security Platform',
      description:
        'Enterprise-grade security system with advanced threat detection and real-time monitoring capabilities.',
      link: '#project-12',
    },
    {
      id: 13,
      icon: Database,
      title: 'Data Analytics',
      description:
        'Powerful data processing and visualization tool that transforms raw data into actionable insights.',
      link: '#project-13',
    },
    {
      id: 14,
      icon: Server,
      title: 'Server Management',
      description:
        'Comprehensive server monitoring and management platform with automated scaling and health checks.',
      link: '#project-14',
    },
    {
      id: 15,
      icon: Lock,
      title: 'Authentication System',
      description:
        'Secure authentication and authorization framework with multi-factor support and session management.',
      link: '#project-15',
    },
    {
      id: 16,
      icon: Bell,
      title: 'Notification Service',
      description:
        'Real-time notification system supporting multiple channels including email, SMS, and push notifications.',
      link: '#project-16',
    },
    {
      id: 18,
      icon: Flame,
      title: 'Performance Optimizer',
      description:
        'Advanced performance optimization tool that identifies bottlenecks and suggests improvements for faster execution.',
      link: '#project-18',
    },
    {
      id: 20,
      icon: Leaf,
      title: 'Eco Tracker',
      description:
        'Sustainability tracking application that helps users monitor their environmental impact and reduce their carbon footprint.',
      link: '#project-20',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section className="w-full max-w-[1080px] mx-auto" aria-label="Projects">
          <article className={cardClasses}>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className={`${cardTitle} m-0`}>Projects</h2>
              <Link href="/" className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}>
                ← Back to Home
              </Link>
            </div>
            <div className={cardBody}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-4 w-full">
                {projects
                  .filter((project) => project.id === 21) // Only show Notes project
                  .map((project) => {
                  const IconComponent = project.icon;
                  const isInternalLink = project.link.startsWith('/');
                  const projectNumber = formatProjectNumber(0); // Notes is 001
                  const cardContent = (
                    <>
                      <span
                        className="text-xs font-mono text-muted absolute top-4 right-4"
                        aria-hidden
                      >
                        {projectNumber}
                      </span>
                      <div className="flex items-center gap-4 mb-3">
                        <IconComponent className="text-3xl text-primary shrink-0" />
                        <h3 className="m-0 text-xl font-semibold">{project.title}</h3>
                      </div>
                      <p className="m-0 mb-4 opacity-80 text-sm leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm opacity-70 text-primary">
                        <span>View project</span>
                        <span>→</span>
                      </div>
                    </>
                  );

                  return isInternalLink ? (
                    <Link
                      key={project.id}
                      href={project.link}
                      className="relative block p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg glass-card-fallback no-underline text-inherit transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <a
                      key={project.id}
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg glass-card-fallback no-underline text-inherit transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                    >
                      {cardContent}
                    </a>
                  );
                })}
                {isAdmin ? (
                  <Link
                    href="/projects/second-brain"
                    className="relative block p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg glass-card-fallback no-underline text-inherit transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  >
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4"
                      aria-hidden
                    >
                      {formatProjectNumber(1)}
                    </span>
                    <div className="flex items-center gap-4 mb-3">
                      <Brain className="text-3xl text-primary shrink-0" />
                      <h3 className="m-0 text-xl font-semibold">Second Brain</h3>
                    </div>
                    <p className="m-0 mb-4 opacity-80 text-sm leading-relaxed">
                      Capture thoughts, semantic search, browse projects, people, ideas, and view digests. Admin only.
                    </p>
                    <div className="flex items-center gap-2 text-sm opacity-70 text-primary">
                      <span>View project</span>
                      <span>→</span>
                    </div>
                  </Link>
                ) : (
                  <div className="relative">
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4 z-10"
                      aria-hidden
                    >
                      {formatProjectNumber(0)}
                    </span>
                    <AdminOnlyPlaceholderCard
                      title="Second Brain"
                      description="Capture thoughts, semantic search, browse. Admin only."
                      icon={Brain}
                    />
                  </div>
                )}
                {isAdmin ? (
                  <Link
                    href="/projects/send-email"
                    className="relative block p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg glass-card-fallback no-underline text-inherit transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  >
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4"
                      aria-hidden
                    >
                      {formatProjectNumber(2)}
                    </span>
                    <div className="flex items-center gap-4 mb-3">
                      <Mail className="text-3xl text-primary shrink-0" aria-hidden />
                      <h3 className="m-0 text-xl font-semibold">Send Email</h3>
                    </div>
                    <p className="m-0 mb-4 opacity-80 text-sm leading-relaxed">
                      Send transactional emails via Brevo. Admin only.
                    </p>
                    <div className="flex items-center gap-2 text-sm opacity-70 text-primary">
                      <span>View project</span>
                      <span>→</span>
                    </div>
                  </Link>
                ) : (
                  <div className="relative">
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4 z-10"
                      aria-hidden
                    >
                      {formatProjectNumber(1)}
                    </span>
                    <AdminOnlyPlaceholderCard
                      title="Send Email"
                      description="Send transactional emails via Brevo. Admin only."
                      icon={Mail}
                    />
                  </div>
                )}
                {isAdmin ? (
                  <Link
                    href="/projects/domain-auth"
                    className="relative block p-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm md:backdrop-blur-md shadow-lg glass-card-fallback no-underline text-inherit transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xl focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  >
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4"
                      aria-hidden
                    >
                      {formatProjectNumber(3)}
                    </span>
                    <div className="flex items-center gap-4 mb-3">
                      <Shield className="text-3xl text-primary shrink-0" />
                      <h3 className="m-0 text-xl font-semibold">Domain Auth (DKIM / DMARC)</h3>
                    </div>
                    <p className="m-0 mb-4 opacity-80 text-sm leading-relaxed">
                      Check DNS for DMARC and DKIM on your sending domain. Admin only.
                    </p>
                    <div className="flex items-center gap-2 text-sm opacity-70 text-primary">
                      <span>View project</span>
                      <span>→</span>
                    </div>
                  </Link>
                ) : (
                  <div className="relative">
                    <span
                      className="text-xs font-mono text-muted absolute top-4 right-4 z-10"
                      aria-hidden
                    >
                      {formatProjectNumber(3)}
                    </span>
                    <AdminOnlyPlaceholderCard
                      title="Domain Auth (DKIM / DMARC)"
                      description="Check DNS for DMARC and DKIM on your sending domain. Admin only."
                      icon={Shield}
                    />
                  </div>
                )}
              </div>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
};
