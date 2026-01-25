import type { JSX } from 'react';
import { useState } from 'react';
import { useGitHubRepos } from './useGitHubRepos';
import { useGitHubCommits } from './useGitHubCommits';

const App = (): JSX.Element => {
  const { repos, isLoading, error } = useGitHubRepos();
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

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
              <div className="card-body">
                {repos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    isExpanded={expandedRepo === repo.name}
                    onToggle={() => {
                      setExpandedRepo(expandedRepo === repo.name ? null : repo.name);
                    }}
                  />
                ))}
              </div>
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

interface RepoCardProps {
  repo: {
    id: number;
    name: string;
    html_url: string;
    description: string | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

const RepoCard = ({ repo, isExpanded, onToggle }: RepoCardProps): JSX.Element => {
  const { commits, isLoading: commitsLoading, error: commitsError } = useGitHubCommits(
    isExpanded ? repo.name : null,
  );

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          marginBottom: '0.5rem',
        }}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <h3 style={{ margin: 0, fontSize: '1.1rem', flex: 1 }}>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {repo.name}
          </a>
        </h3>
      </div>
      {repo.description && (
        <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: '0.9rem', marginLeft: '1.5rem' }}>
          {repo.description}
        </p>
      )}
      {isExpanded && (
        <div style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
          {commitsLoading && <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Loading commits…</p>}
          {commitsError && (
            <p style={{ fontSize: '0.85rem', opacity: 0.7, color: '#ff6b6b' }}>
              Error: {commitsError}
            </p>
          )}
          {!commitsLoading && !commitsError && commits && commits.length > 0 && (
            <ul
              style={{
                fontSize: '0.85rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {commits.map((commit) => (
                <li
                  key={commit.sha}
                  style={{
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    {commit.commit.message.split('\n')[0]}
                  </a>
                  <span
                    style={{
                      opacity: 0.6,
                      fontSize: '0.8rem',
                      display: 'block',
                      marginTop: '0.25rem',
                    }}
                  >
                    {new Date(commit.commit.author.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!commitsLoading && !commitsError && commits && commits.length === 0 && (
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>No commits found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
