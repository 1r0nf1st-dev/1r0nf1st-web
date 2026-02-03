import type { JSX } from 'react';
import { useGitHubCommits } from '../useGitHubCommits';

export interface RepoCardProps {
  repo: {
    id: number;
    name: string;
    html_url: string;
    description: string | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

export const RepoCard = ({ repo, isExpanded, onToggle }: RepoCardProps): JSX.Element => {
  const { commits, isLoading: commitsLoading, error: commitsError } = useGitHubCommits(
    isExpanded ? repo.name : null,
  );

  return (
    <div className="mb-6 pb-6 border-b border-border/50">
      <div
        className="flex items-center gap-2 cursor-pointer mb-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
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
        <span className="text-sm opacity-70">{isExpanded ? '▼' : '▶'}</span>
        <h3 className="m-0 text-lg flex-1">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="no-underline text-inherit"
            onClick={(e) => e.stopPropagation()}
          >
            {repo.name}
          </a>
        </h3>
      </div>
      {repo.description && (
        <p className="mb-4 opacity-80 text-sm ml-6">{repo.description}</p>
      )}
      {isExpanded && (
        <div className="ml-6 mt-4">
          {commitsLoading && (
            <p className="text-[0.85rem] opacity-70">Loading commits…</p>
          )}
          {commitsError && (
            <p className="text-[0.85rem] opacity-70 text-red-400">
              Error: {commitsError}
            </p>
          )}
          {!commitsLoading && !commitsError && commits && commits.length > 0 && (
            <ul className="text-[0.85rem] list-none p-0 m-0 max-h-[400px] overflow-y-auto">
              {commits.map((commit) => (
                <li
                  key={commit.sha}
                  className="mb-3 pb-3 border-b border-border/30"
                >
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="no-underline text-inherit block"
                  >
                    {commit.commit.message.split('\n')[0]}
                  </a>
                  <span className="opacity-60 text-xs block mt-1">
                    {new Date(commit.commit.author.date).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!commitsLoading &&
            !commitsError &&
            commits &&
            commits.length === 0 && (
              <p className="text-[0.85rem] opacity-70">No commits found</p>
            )}
        </div>
      )}
    </div>
  );
};
