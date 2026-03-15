import type { JSX } from 'react';
import { GoalTracker } from '../components/GoalTracker';
export const GoalTrackerPage = (): JSX.Element => {
  return (
    <section aria-label="Goal Tracker">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GoalTracker />
        </div>
    </section>
  );
};
