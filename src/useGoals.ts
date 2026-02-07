import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson, ApiError } from './apiClient';

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  milestones?: GoalMilestone[];
}

interface GoalsState {
  goals: Goal[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

export function useGoals(): GoalsState {
  const [state, setState] = useState<Omit<GoalsState, 'refetch'>>({
    goals: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;
    // Initialize loading state before async fetch - this is a valid pattern for data fetching hooks
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const url = `${getApiBase()}/goals`;
    getJson<Goal[]>(url)
      .then((goals) => {
        if (!isCancelled) {
          setState({ goals, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching goals.';
          if (error instanceof ApiError) {
            if (error.status === 401) {
              message = 'Please log in to view your goals.';
            } else {
              message = error.message;
            }
          } else if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === 'string') {
            message = error;
          }
          setState({ goals: null, isLoading: false, error: message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchGoals = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = `${getApiBase()}/goals`;
      const goals = await getJson<Goal[]>(url);
      setState({ goals, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching goals.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view your goals.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ goals: null, isLoading: false, error: message });
    }
  };

  return {
    ...state,
    refetch: async () => {
      await fetchGoals();
    },
  };
}

export async function createGoal(
  title: string,
  description?: string,
  target_date?: string,
  progress_percentage?: number,
  status?: 'active' | 'completed' | 'paused' | 'cancelled',
): Promise<Goal> {
  const url = `${getApiBase()}/goals`;
  return getJson<Goal>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      target_date,
      progress_percentage,
      status,
    }),
  });
}

export async function updateGoal(
  goalId: string,
  updates: {
    title?: string;
    description?: string;
    target_date?: string;
    progress_percentage?: number;
    status?: 'active' | 'completed' | 'paused' | 'cancelled';
  },
): Promise<Goal> {
  const url = `${getApiBase()}/goals/${goalId}`;
  return getJson<Goal>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  const url = `${getApiBase()}/goals/${goalId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}

export async function createMilestone(
  goalId: string,
  title: string,
  description?: string,
): Promise<GoalMilestone> {
  const url = `${getApiBase()}/goals/${goalId}/milestones`;
  return getJson<GoalMilestone>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description }),
  });
}

export async function updateMilestone(
  milestoneId: string,
  updates: {
    title?: string;
    description?: string;
    completed?: boolean;
  },
): Promise<GoalMilestone> {
  const url = `${getApiBase()}/goals/milestones/${milestoneId}`;
  return getJson<GoalMilestone>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const url = `${getApiBase()}/goals/milestones/${milestoneId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}
