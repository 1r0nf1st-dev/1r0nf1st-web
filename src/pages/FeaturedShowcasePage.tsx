import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { GitHubProjects } from '../components/GitHubProjects';
import { DevToArticles } from '../components/DevToArticles';
import { MediumStories } from '../components/MediumStories';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { btnBase, btnGhost } from '../styles/buttons';

export const FeaturedShowcasePage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section
          className="w-full max-w-[1080px] mx-auto"
          aria-label="Featured Showcase"
        >
          <div className="mb-6">
            <Link
              to="/projects"
              className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
            >
              ← Back to Projects
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <GitHubProjects />
            </div>
            <div className="md:col-span-3">
              <DevToArticles />
            </div>
            <div className="md:col-span-3">
              <MediumStories />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
