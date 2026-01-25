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

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new ApiError(
        text || `Request to ${url} failed with status ${response.status}`,
        response.status,
        url,
      );
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
        `Network error: Unable to reach ${url}. Make sure the API server is running.`,
        0,
        url,
      );
    }
    // Re-throw other errors
    throw error;
  }
}
