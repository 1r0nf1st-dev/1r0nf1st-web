import type { JSX } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Weather } from '../components/Weather';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { btnBase, btnGhost } from '../styles/buttons';

export const WeatherPage = (): JSX.Element => {
  const [city, setCity] = useState('London');

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section
          className="w-full max-w-[1080px] mx-auto"
          aria-label="Weather Dashboard"
        >
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Link
              to="/projects"
              className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
            >
              ← Back to Projects
            </Link>
            <label className="flex items-center gap-2 text-sm">
              <span className="opacity-80">City:</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value.trim() || 'London')}
                onBlur={(e) => !e.target.value.trim() && setCity('London')}
                placeholder="e.g. London"
                className="px-3 py-2 rounded-lg border-2 border-primary/35 dark:border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary/55 dark:focus:border-transparent w-40"
                aria-label="City for weather"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Weather city={city || 'London'} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
