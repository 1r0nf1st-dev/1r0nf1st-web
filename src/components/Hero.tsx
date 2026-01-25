import type { JSX } from 'react';

export const Hero = (): JSX.Element => {
  return (
    <header className="hero">
      <div className="hero-inner">
        <span className="pill">Portfolio · React + Vite</span>
        <h1 className="hero-title">1r0nf1st</h1>
        <p className="hero-subtitle">
          Building fast, type-safe experiences with React, TypeScript, and modern tooling. This
          portfolio is powered by live data from public APIs.
        </p>
        <div className="hero-actions">
          <a href="#projects" className="button button-primary">
            View projects
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="button button-ghost"
          >
            GitHub profile
          </a>
        </div>
      </div>
    </header>
  );
};
