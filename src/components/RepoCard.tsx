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
