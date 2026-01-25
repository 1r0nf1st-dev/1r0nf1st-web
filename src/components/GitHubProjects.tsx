import type { JSX } from 'react';
import { useState } from 'react';
import { useGitHubRepos } from '../useGitHubRepos';
import { RepoCard } from './RepoCard';

export const GitHubProjects = (): JSX.Element => {
  const { repos, isLoading, error } = useGitHubRepos();
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  return (
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
  );
};
