import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface StravaTotalsPeriod {
  distanceKm: number;
  movingTimeSeconds: number;
  elevationGainM: number;
}

export interface StravaTotals {
  recent: StravaTotalsPeriod;
  ytd: StravaTotalsPeriod;
  allTime: StravaTotalsPeriod;
}

interface StravaStatsState {
  totals: StravaTotals | null;
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

export function useStravaStats(): StravaStatsState {
  const [state, setState] = useState<StravaStatsState>({
    totals: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const url = `${getApiBase()}/strava/totals`;

    getJson<StravaTotals>(url)
      .then((totals) => {
        if (isCancelled) return;
        setState({ totals, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching Strava data.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ totals: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
}
