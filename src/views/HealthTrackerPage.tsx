import type { JSX } from 'react';
import { StravaStats } from '../components/StravaStats';
export const HealthTrackerPage = (): JSX.Element => {
  return (
    <section aria-label="Health Tracker">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <StravaStats />
          </div>
        </div>
    </section>
  );
};
