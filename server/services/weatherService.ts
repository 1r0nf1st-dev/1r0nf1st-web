import { config } from '../config.js';

const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

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

interface OpenWeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  visibility: number;
}

export async function fetchCurrentWeather(
  city: string = 'London',
): Promise<WeatherData> {
  const apiKey = config.openWeatherApiKey?.trim();

  if (!apiKey || apiKey === '') {
    throw new Error(
      'OpenWeather API key is not configured. Set OPENWEATHER_API_KEY in your .env file and restart the server.',
    );
  }

  // Debug: Log key length (but not the actual key) to help diagnose issues
  // Note: This is logged at debug level, so it won't appear in production

  const url = `${OPENWEATHER_API}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = (await response.json()) as { message?: string; cod?: string | number };
      errorMessage = errorData.message || errorData.cod?.toString() || '';
    } catch {
      // If JSON parsing fails, try text
      errorMessage = await response.text().catch(() => '');
    }

    if (response.status === 401) {
      throw new Error(
        `Invalid OpenWeather API key${errorMessage ? `: ${errorMessage}` : ''}. Please check your OPENWEATHER_API_KEY in .env`,
      );
    }
    if (response.status === 404) {
      throw new Error(`City "${city}" not found${errorMessage ? `: ${errorMessage}` : ''}`);
    }
    throw new Error(
      errorMessage || `OpenWeather API request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as OpenWeatherResponse;

  const weather = data.weather[0];

  return {
    location: data.name,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    description:
      weather.description.charAt(0).toUpperCase() + weather.description.slice(1),
    icon: weather.icon,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 10) / 10, // Keep in m/s (metric)
    visibility: Math.round((data.visibility / 1000) * 10) / 10, // Convert meters to km
    pressure: data.main.pressure,
    updatedAt: new Date().toISOString(),
  };
}
