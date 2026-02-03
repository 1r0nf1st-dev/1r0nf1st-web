import { config } from '../config.js';

const VERCEL_API_BASE = 'https://api.vercel.com/v6';

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'QUEUED' | 'INITIALIZING';
  target: 'production' | 'staging' | null;
  createdAt: number;
  readyAt: number | null;
  buildingAt: number | null;
  commitSha?: string;
  commitMessage?: string;
  branch?: string;
  creator?: { username: string };
  inspectorUrl?: string;
}

export interface BuildStats {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageBuildTime: number | null;
}

export interface VercelDeploymentsData {
  deployments: VercelDeployment[];
  buildStats: BuildStats;
}

interface VercelApiDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  target: string | null;
  createdAt: number;
  ready: number | null;
  buildingAt: number | null;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
  };
  creator?: {
    username?: string;
  };
  inspectorUrl?: string;
}

interface VercelApiResponse {
  deployments: VercelApiDeployment[];
  pagination?: {
    count: number;
  };
}

function calculateBuildTime(
  buildingAt: number | null,
  readyAt: number | null,
): number | null {
  if (!buildingAt || !readyAt) {
    return null;
  }
  return readyAt - buildingAt; // Returns milliseconds
}

function calculateBuildStats(
  deployments: VercelDeployment[],
): BuildStats {
  const total = deployments.length;
  const successful = deployments.filter((d) => d.state === 'READY').length;
  const failed = deployments.filter(
    (d) => d.state === 'ERROR' || d.state === 'CANCELED',
  ).length;

  const buildTimes = deployments
    .map((d) => calculateBuildTime(d.buildingAt, d.readyAt))
    .filter((time): time is number => time !== null);

  const averageBuildTime =
    buildTimes.length > 0
      ? Math.round(buildTimes.reduce((sum, time) => sum + time, 0) / buildTimes.length)
      : null;

  return {
    totalDeployments: total,
    successfulDeployments: successful,
    failedDeployments: failed,
    averageBuildTime,
  };
}

export async function fetchDeployments(
  options?: { limit?: number; projectId?: string },
): Promise<VercelDeploymentsData> {
  const apiToken = config.vercelApiToken;

  if (!apiToken || apiToken.trim() === '') {
    throw new Error(
      'Vercel API token is not configured. Set VERCEL_API_TOKEN in your .env file.',
    );
  }

  const limit = options?.limit ?? 5;
  const projectId = options?.projectId || config.vercelProjectId;

  const searchParams = new URLSearchParams({
    limit: String(limit),
  });

  if (projectId) {
    searchParams.set('projectId', projectId);
  }

  const url = `${VERCEL_API_BASE}/deployments?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Invalid or expired Vercel API token. Please check your VERCEL_API_TOKEN in .env.',
      );
    }
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Vercel API request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as VercelApiResponse;

  const deployments: VercelDeployment[] = (data.deployments || []).map((d) => ({
    uid: d.uid,
    name: d.name,
    url: d.url || '',
    state: d.state as VercelDeployment['state'],
    target: (d.target as 'production' | 'staging') || null,
    createdAt: d.createdAt,
    readyAt: d.ready || null,
    buildingAt: d.buildingAt || null,
    commitSha: d.meta?.githubCommitSha,
    commitMessage: d.meta?.githubCommitMessage,
    branch: d.meta?.githubCommitRef,
    creator: d.creator ? { username: d.creator.username || 'unknown' } : undefined,
    inspectorUrl: d.inspectorUrl,
  }));

  const buildStats = calculateBuildStats(deployments);

  return {
    deployments,
    buildStats,
  };
}
