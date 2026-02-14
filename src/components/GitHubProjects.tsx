'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useGitHubRepos } from '../useGitHubRepos';
import { RepoCard } from './RepoCard';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

export const GitHubProjects = (): JSX.Element => {
  const { repos, isLoading, error } = useGitHubRepos();
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  return (
    <article className={cardClasses} id="projects">
      <div className={cardOverlay} aria-hidden="true" />
      <h2 className={cardTitle}>GitHub projects</h2>
      {isLoading && <p className={cardBody}>Loading repositories from GitHub…</p>}
      {error && !isLoading && <p className={cardBody}>Error: {error}</p>}
      {!isLoading && !error && repos && repos.length === 0 && (
        <p className={cardBody}>
          No repositories found. Make sure the API server is running and{' '}
          <code>GITHUB_USERNAME</code> is set in <code>.env</code>.
        </p>
      )}
      {!isLoading && !error && repos && repos.length > 0 && (
        <div className={cardBody}>
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
  );
};
