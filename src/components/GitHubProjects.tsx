'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useGitHubRepos } from '../useGitHubRepos';
import { RepoCard } from './RepoCard';
import { Skeleton } from './Skeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { cardClasses, cardTitle, cardBody } from '../styles/cards';

export const GitHubProjects = (): JSX.Element => {
  const { repos, isLoading, error } = useGitHubRepos();
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  return (
    <article className={cardClasses} id="projects">

      <h2 className={cardTitle}>GitHub projects</h2>
      {isLoading && (
        <div className={cardBody} aria-busy>
          <Skeleton className="mb-4 h-4 w-3/4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}
      {error && !isLoading && (
        <div className={cardBody}>
          <ErrorDisplay error={error} title="GitHub Projects" announce={false} />
        </div>
      )}
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
