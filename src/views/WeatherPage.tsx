'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Weather } from '../components/Weather';
import { ChromeLayout } from '../components/ChromeLayout';
import { btnBase, btnGhost } from '../styles/buttons';

export const WeatherPage = (): JSX.Element => {
  const [city, setCity] = useState('London');

  return (
    <ChromeLayout>
      <section className="w-full max-w-[1080px] mx-auto" aria-label="Weather Dashboard">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
          <label className="flex items-center gap-2 text-sm">
            <span className="opacity-80">City:</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value.trim())}
              onBlur={(e) => !e.target.value.trim() && setCity('London')}
              placeholder="e.g. London"
              className="px-3 py-2 rounded-xl border-2 border-primary/35 dark:border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary/55 dark:focus:border-transparent w-40"
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
    </ChromeLayout>
  );
};
