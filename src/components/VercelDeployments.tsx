'use client';

import type { JSX } from 'react';
import { useVercelDeployments, type VercelDeployment } from '../useVercelDeployments';
import { Skeleton } from './Skeleton';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

function formatBuildTime(milliseconds: number | null): string {
  if (milliseconds === null) return 'N/A';
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getStatusColor(state: VercelDeployment['state']): string {
  switch (state) {
    case 'READY':
      return '#10b981'; // green
    case 'BUILDING':
    case 'QUEUED':
    case 'INITIALIZING':
      return '#f59e0b'; // yellow/amber
    case 'ERROR':
    case 'CANCELED':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

function DeploymentItem({ deployment }: { deployment: VercelDeployment }): JSX.Element {
  const statusColor = getStatusColor(deployment.state);
  const shortSha = deployment.commitSha?.substring(0, 7) || 'N/A';
  const githubCommitUrl = deployment.commitSha
    ? `https://github.com/${deployment.name}/commit/${deployment.commitSha}`
    : null;

  return (
    <div className="p-3 mb-2 bg-white/5 rounded text-sm">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="font-medium">{deployment.state}</span>
        {deployment.target && (
          <span className="text-xs opacity-80 py-0.5 px-1.5 bg-white/10 rounded">
            {deployment.target}
          </span>
        )}
      </div>
      <div className="text-[0.85rem] opacity-90 leading-relaxed">
        {deployment.branch && (
          <div>
            Branch: <code className="text-[0.85em]">{deployment.branch}</code>
          </div>
        )}
        <div>
          Commit:{' '}
          {githubCommitUrl ? (
            <a
              href={githubCommitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary no-underline hover:underline"
            >
              <code className="text-[0.85em]">{shortSha}</code>
            </a>
          ) : (
            <code className="text-[0.85em]">{shortSha}</code>
          )}
        </div>
        {deployment.commitMessage && (
          <div
            className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap"
            title={deployment.commitMessage}
          >
            {deployment.commitMessage}
          </div>
        )}
        <div className="mt-2 flex gap-4 flex-wrap">
          <span>{formatRelativeTime(deployment.createdAt)}</span>
          {deployment.url && (
            <a
              href={`https://${deployment.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary no-underline hover:underline"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export const VercelDeployments = (): JSX.Element | null => {
  const { data, isLoading, error } = useVercelDeployments(10);

  if (isLoading) {
    return (
      <article className="card" id="vercel-deployments">
        <h2 className="card-title">Vercel Deployments</h2>
        <div className="card-body" aria-busy>
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </article>
    );
  }

  if (error) {
    return (
      <article className="card" id="vercel-deployments">
        <h2 className="card-title">Vercel Deployments</h2>
        <p className="card-body">Error: {error}</p>
      </article>
    );
  }

  if (!data || !data.deployments || data.deployments.length === 0) {
    return (
      <article className="card" id="vercel-deployments">
        <h2 className="card-title">Vercel Deployments</h2>
        <p className="card-body">
          No deployments found. Make sure VERCEL_API_TOKEN is configured in{' '}
          <code>.env</code>.
        </p>
      </article>
    );
  }

  const { deployments, buildStats } = data;
  const latestDeployment = deployments[0];
  const successRate =
    buildStats.totalDeployments > 0
      ? Math.round(
          (buildStats.successfulDeployments / buildStats.totalDeployments) * 100,
        )
      : 0;

  return (
    <article className={cardClasses} id="vercel-deployments">
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Vercel Deployments</h2>
      <div className={cardBody}>
        <div className="mb-6">
          <h3 className="m-0 mb-3 text-[0.95rem] font-medium">
            Latest Deployment
          </h3>
          <DeploymentItem deployment={latestDeployment} />
        </div>
        <div className="pt-4 border-t border-border/50">
          <h3 className="m-0 mb-3 text-[0.95rem] font-medium">
            Build Statistics
          </h3>
          <ul className="m-0 p-0 list-none text-sm opacity-90 grid grid-cols-2 gap-2">
            <li>Total: {buildStats.totalDeployments}</li>
            <li>Success Rate: {successRate}%</li>
            <li>Successful: {buildStats.successfulDeployments}</li>
            <li>Failed: {buildStats.failedDeployments}</li>
            <li className="col-span-2">
              Avg Build Time:{' '}
              {buildStats.averageBuildTime
                ? formatBuildTime(buildStats.averageBuildTime)
                : 'N/A'}
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
};
