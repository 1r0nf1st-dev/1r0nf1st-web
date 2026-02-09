/* global RequestInit */

export class ApiError extends Error {
  public readonly status: number;
  public readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { token?: string; refreshToken?: string };
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    // Get auth token from localStorage
    let token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((init?.headers as Record<string, string>) ?? {}),
    };

    // Add auth token if available and not already set in headers
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...init,
      headers,
    });

    // If we get a 403 and we have a token, try to refresh the token and retry once
    // Skip refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = url.includes('/api/auth/');
    if (response.status === 403 && token && !isAuthEndpoint) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        // Retry the request with the new token
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...init,
          headers,
        });
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let message = text || `Request to ${url} failed with status ${response.status}`;
      try {
        const json = JSON.parse(text) as { error?: string; message?: string };
        if (typeof json.error === 'string') message = json.error;
        else if (typeof json.message === 'string') message = json.message;
      } catch {
        // keep message as text
      }
      throw new ApiError(message, response.status, url);
    }

    // Handle 204 No Content responses
    if (response.status === 204 || response.status === 201) {
      // For DELETE requests or empty responses, return void
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return undefined as T;
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    // Wrap network errors with more context
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(
        'Network error: Unable to connect to the server. Please try again later.',
        0,
        url,
      );
    }
    // Re-throw other errors
    throw error;
  }
}
