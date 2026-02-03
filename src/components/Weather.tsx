import type { JSX } from 'react';
import { useWeather } from '../useWeather';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';

export const Weather = (): JSX.Element | null => {
  const { weather, isLoading, error } = useWeather('London');

  if (isLoading) {
    return (
      <article className={cardClasses} id="weather">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Weather</h2>
        <p className={cardBody}>Loading current weather…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className={cardClasses} id="weather">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Weather</h2>
        <p className={cardBody}>Error: {error}</p>
      </article>
    );
  }

  if (!weather) {
    return (
      <article className={cardClasses} id="weather">
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Weather</h2>
        <p className={cardBody}>
          No weather data. Make sure the API server is running and OpenWeather is
          configured in <code>.env</code>.
        </p>
      </article>
    );
  }

  const weatherIconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <article className={cardClasses} id="weather">
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Weather</h2>
      <div className={cardBody}>
        <div className="flex items-center gap-4 mb-4 relative z-20">
          <div className="relative flex-shrink-0 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/15 dark:from-primary/10 dark:to-primary/5 rounded-full border border-primary/30 dark:border-primary/10" />
            <img
              src={weatherIconUrl}
              alt={weather.description}
              className="w-16 h-16 relative z-10 drop-shadow-xl brightness-110 contrast-125 dark:brightness-100 dark:contrast-100"
            />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">
              {weather.temperature}°C
            </div>
            <div className="text-sm opacity-90">
              Feels like {weather.feelsLike}°C
            </div>
          </div>
        </div>
        <div className="text-lg font-medium mb-3">
          {weather.location} · {weather.description}
        </div>
        <ul className="m-0 p-0 list-none text-sm opacity-90 grid grid-cols-2 gap-2">
          <li>Humidity: {weather.humidity}%</li>
          <li>Wind: {weather.windSpeed} m/s</li>
          <li>Visibility: {weather.visibility} km</li>
          <li>Pressure: {weather.pressure} hPa</li>
        </ul>
      </div>
    </article>
  );
};
