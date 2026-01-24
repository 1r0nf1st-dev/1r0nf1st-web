import type { JSX } from 'react';
import { useGitHubRepos } from './useGitHubRepos';

const App = (): JSX.Element => {
  const { repos, isLoading, error } = useGitHubRepos();

  return (
    <div className="app-shell">
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

      <main className="main">
        <section className="card-grid" aria-label="Portfolio content">
          <article className="card">
            <h2 className="card-title">About</h2>
            <p className="card-body">
              This site is a lightweight portfolio starter built with Vite, React, and TypeScript.
              It is configured to call external APIs such as GitHub and any other public REST
              endpoints you want to integrate.
            </p>
          </article>

          <article className="card">
            <h2 className="card-title">API-ready setup</h2>
            <p className="card-body">
              Environment-driven configuration and a small API client make it easy to connect to
              GitHub and other services without leaking secrets into the front-end codebase.
            </p>
          </article>

          <article className="card" id="projects">
            <h2 className="card-title">GitHub projects</h2>
            {isLoading && <p className="card-body">Loading repositories from GitHub…</p>}
            {error && !isLoading && <p className="card-body">Error: {error}</p>}
            {!isLoading && !error && repos && repos.length === 0 && (
              <p className="card-body">
                No repositories found. Make sure the API server is running and{' '}
                <code>GITHUB_USERNAME</code> is set in <code>.env</code>.
              </p>
            )}
            {!isLoading && !error && repos && repos.length > 0 && (
              <ul className="card-body" aria-label="Recent GitHub repositories">
                {repos.map((repo) => (
                  <li key={repo.id}>
                    <a href={repo.html_url} target="_blank" rel="noreferrer">
                      {repo.name}
                    </a>
                    {repo.description ? ` — ${repo.description}` : null}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </main>

      <footer className="footer">
        <p>Portfolio powered by Vite · React · TypeScript · GitHub API</p>
      </footer>
    </div>
  );
};

export default App;
