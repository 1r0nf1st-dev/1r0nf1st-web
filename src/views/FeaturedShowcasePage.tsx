import type { JSX } from 'react';
import { DevToArticles } from '../components/DevToArticles';
import { MediumStories } from '../components/MediumStories';
export const FeaturedShowcasePage = (): JSX.Element => {
  return (
    <section aria-label="Featured Showcase">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <DevToArticles />
          </div>
          <div className="md:col-span-3">
            <MediumStories />
          </div>
        </div>
    </section>
  );
};
