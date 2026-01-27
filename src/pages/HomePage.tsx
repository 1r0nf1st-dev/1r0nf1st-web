import type { JSX } from 'react';
import { Hero } from '../components/Hero';
import { InfoCard } from '../components/InfoCard';
import { GitHubProjects } from '../components/GitHubProjects';
import { Footer } from '../components/Footer';

export const HomePage = (): JSX.Element => {
  return (
    <div className="app-shell">
      <Hero />

      <main className="main">
        <section className="card-grid" aria-label="Portfolio content">
          <InfoCard title="About">
            This site is a lightweight portfolio starter built with Vite, React, and TypeScript. It
            is configured to call external APIs such as GitHub and any other public REST endpoints
            you want to integrate.
          </InfoCard>

          <InfoCard title="API-ready setup">
            Environment-driven configuration and a small API client make it easy to connect to
            GitHub and other services without leaking secrets into the front-end codebase.
          </InfoCard>

          <GitHubProjects />
        </section>
      </main>

      <Footer />
    </div>
  );
};
