import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnGhost } from '../styles/buttons';
import {
  FaRocket,
  FaCode,
  FaPalette,
  FaMobileAlt,
  FaTools,
  FaBolt,
  FaGlobe,
  FaChartBar,
  FaBullseye,
  FaStar,
  FaCloud,
  FaShieldAlt,
  FaDatabase,
  FaServer,
  FaLock,
  FaBell,
  FaHeart,
  FaFire,
  FaSun,
  FaLeaf,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { Hero } from './Hero';
import { Footer } from './Footer';

interface Project {
  id: number;
  icon: IconType;
  title: string;
  description: string;
  link: string;
}

export const ProjectsPage = (): JSX.Element => {
  const projects: Project[] = [
    {
      id: 1,
      icon: FaRocket,
      title: 'Launch Platform',
      description: "A powerful deployment and launch management system that streamlines the process of releasing applications to production environments.",
      link: '#project-1',
    },
    {
      id: 2,
      icon: FaCode,
      title: 'Code Editor Pro',
      description: "An advanced code editor with syntax highlighting, intelligent autocomplete, and seamless integration with version control systems.",
      link: '#project-2',
    },
    {
      id: 3,
      icon: FaPalette,
      title: 'Design Studio',
      description: "A comprehensive design tool for creating beautiful interfaces, mockups, and prototypes with collaborative features for teams.",
      link: '#project-3',
    },
    {
      id: 4,
      icon: FaMobileAlt,
      title: 'Mobile App Builder',
      description: "Cross-platform mobile application development framework that enables rapid prototyping and deployment for iOS and Android.",
      link: '#project-4',
    },
    {
      id: 5,
      icon: FaTools,
      title: 'DevOps Toolkit',
      description: "A collection of essential development and operations tools for automating workflows, managing infrastructure, and improving productivity.",
      link: '#project-5',
    },
    {
      id: 6,
      icon: FaBolt,
      title: 'Speed Optimizer',
      description: "Performance enhancement tool that accelerates application load times and optimizes resource usage for maximum efficiency.",
      link: '#project-6',
    },
    {
      id: 7,
      icon: FaGlobe,
      title: 'Global Network',
      description: "Worldwide connectivity platform that enables seamless communication and data exchange across international boundaries.",
      link: '#project-7',
    },
    {
      id: 8,
      icon: FaChartBar,
      title: 'Analytics Dashboard',
      description: "Comprehensive analytics platform with real-time data visualization, custom reports, and actionable insights for business intelligence.",
      link: '#project-8',
    },
    {
      id: 9,
      icon: FaBullseye,
      title: 'Goal Tracker',
      description: "Precision goal-setting and tracking application that helps users achieve their objectives with detailed progress monitoring and milestones.",
      link: '/projects/goal-tracker',
    },
    {
      id: 10,
      icon: FaStar,
      title: 'Featured Showcase',
      description: "A curated collection platform that highlights top-rated content, products, and services with user reviews and recommendations.",
      link: '#project-10',
    },
    {
      id: 11,
      icon: FaCloud,
      title: 'Cloud Infrastructure',
      description: "A scalable cloud-based solution designed for modern applications. Features include automated deployment and resource management.",
      link: '#project-11',
    },
    {
      id: 12,
      icon: FaShieldAlt,
      title: 'Security Platform',
      description: "Enterprise-grade security system with advanced threat detection and real-time monitoring capabilities.",
      link: '#project-12',
    },
    {
      id: 13,
      icon: FaDatabase,
      title: 'Data Analytics',
      description: "Powerful data processing and visualization tool that transforms raw data into actionable insights.",
      link: '#project-13',
    },
    {
      id: 14,
      icon: FaServer,
      title: 'Server Management',
      description: "Comprehensive server monitoring and management platform with automated scaling and health checks.",
      link: '#project-14',
    },
    {
      id: 15,
      icon: FaLock,
      title: 'Authentication System',
      description: "Secure authentication and authorization framework with multi-factor support and session management.",
      link: '#project-15',
    },
    {
      id: 16,
      icon: FaBell,
      title: 'Notification Service',
      description: "Real-time notification system supporting multiple channels including email, SMS, and push notifications.",
      link: '#project-16',
    },
    {
      id: 17,
      icon: FaHeart,
      title: 'Health Tracker',
      description: "Personal health and wellness application with activity tracking, goal setting, and progress visualization.",
      link: '#project-17',
    },
    {
      id: 18,
      icon: FaFire,
      title: 'Performance Optimizer',
      description: "Advanced performance optimization tool that identifies bottlenecks and suggests improvements for faster execution.",
      link: '#project-18',
    },
    {
      id: 19,
      icon: FaSun,
      title: 'Weather Dashboard',
      description: "Beautiful weather application with detailed forecasts, interactive maps, and location-based recommendations.",
      link: '#project-19',
    },
    {
      id: 20,
      icon: FaLeaf,
      title: 'Eco Tracker',
      description: "Sustainability tracking application that helps users monitor their environmental impact and reduce their carbon footprint.",
      link: '#project-20',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <Hero />

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section
          className="w-full max-w-[1080px] mx-auto"
          aria-label="Projects"
        >
          <article className={cardClasses}>
            <div className={cardOverlay} aria-hidden />
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className={`${cardTitle} m-0`}>Projects</h2>
              <Link to="/" className={`${btnBase} ${btnGhost} text-sm py-2 px-4`}>
                ← Back to Home
              </Link>
            </div>
            <div className={cardBody}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-4 w-full">
                {projects.map((project) => {
                  const IconComponent = project.icon;
                  const isInternalLink = project.link.startsWith('/');
                  const cardContent = (
                    <>
                      <div className="flex items-center gap-4 mb-3">
                        <IconComponent className="text-3xl text-primary shrink-0" />
                        <h3 className="m-0 text-xl font-semibold">
                          {project.title}
                        </h3>
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
                      to={project.link}
                      className="block p-6 border border-border rounded-lg bg-surface-soft/30 no-underline text-inherit transition-all duration-200 hover:bg-surface-soft/60 hover:border-border-strong hover:-translate-y-0.5 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg"
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <a
                      key={project.id}
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-6 border border-border rounded-lg bg-surface-soft/30 no-underline text-inherit transition-all duration-200 hover:bg-surface-soft/60 hover:border-border-strong hover:-translate-y-0.5 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg"
                    >
                      {cardContent}
                    </a>
                  );
                })}
              </div>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
};
