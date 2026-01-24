import type { JSX } from 'react';

const features = [
  {
    title: 'Type-safe by default',
    body: 'Built with modern React and TypeScript, so every component and hook is strongly typed.',
  },
  {
    title: 'Fast local dev',
    body: 'Vite dev server gives instant HMR so you can iterate on UI and interactions quickly.',
  },
  {
    title: 'Opinioned linting & style',
    body: 'ESLint and Prettier keep your codebase consistent, readable, and easy to review.',
  },
];

const App = (): JSX.Element => {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-inner">
          <span className="pill">New · React + Vite + TypeScript</span>
          <h1 className="hero-title">1r0nf1st website starter</h1>
          <p className="hero-subtitle">
            A modern, batteries-included React stack powered by Vite, TypeScript, ESLint, and
            Prettier. Ready for your next idea in a single command.
          </p>
          <div className="hero-actions">
            <a href="/" className="button button-primary">
              Get started
            </a>
            <a href="/docs" className="button button-ghost">
              View docs
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="card-grid" aria-label="Starter highlights">
          {features.map((feature) => (
            <article key={feature.title} className="card">
              <h2 className="card-title">{feature.title}</h2>
              <p className="card-body">{feature.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="footer">
        <p>Scaffolded with Vite · Styled with modern CSS · Powered by pnpm</p>
      </footer>
    </div>
  );
};

export default App;
