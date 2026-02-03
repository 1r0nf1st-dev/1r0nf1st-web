import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  updatedAt: string;
}

interface WeatherState {
  weather: WeatherData | null;
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

export function useWeather(city: string = 'London'): WeatherState {
  const [state, setState] = useState<WeatherState>({
    weather: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const url = `${getApiBase()}/weather/current?city=${encodeURIComponent(city)}`;

    getJson<WeatherData>(url)
      .then((weather) => {
        if (isCancelled) return;
        setState({ weather, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching weather data.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ weather: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [city]);

  return state;
}
