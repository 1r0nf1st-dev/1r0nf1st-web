'use client';

import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

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

interface VercelDeploymentsState {
  data: VercelDeploymentsData | null;
  isLoading: boolean;
  error: string | null;
}

function getApiBase(): string {
  let apiBase = '/api';
  if (env.apiBaseUrl && env.apiBaseUrl.trim()) {
    const trimmed = env.apiBaseUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    } else {
      apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    }
  }
  return apiBase;
}

export function useVercelDeployments(limit?: number): VercelDeploymentsState {
  const [state, setState] = useState<VercelDeploymentsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const searchParams = new URLSearchParams();
    if (limit) {
      searchParams.set('limit', String(limit));
    }

    const url = `${getApiBase()}/vercel/deployments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    getJson<VercelDeploymentsData>(url)
      .then((data) => {
        if (isCancelled) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching Vercel deployments.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ data: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [limit]);

  return state;
}
