import { Router } from 'express';
import { fetchCurrentWeather } from '../services/weatherService.js';
import { config } from '../config.js';

export const weatherRouter = Router();

// Debug endpoint to check API key configuration (development only)
weatherRouter.get('/debug', (_req, res) => {
  if (config.nodeEnv === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const apiKey = config.openWeatherApiKey;
  res.json({
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPreview: apiKey
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : 'not set',
    note: 'OpenWeather API keys are typically 32 characters long',
  });
});

weatherRouter.get('/current', async (req, res) => {
  try {
    const city = (req.query.city as string) || 'London';
    const weather = await fetchCurrentWeather(city);
    res.json(weather);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch weather';
    const status = error instanceof Error && 'status' in error ? (error.status as number) : 500;
    res.status(status).json({ error: message });
  }
});
