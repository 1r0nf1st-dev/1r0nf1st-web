import type { JSX } from 'react';
import { Hero } from '../components/Hero';
import { InfoCard } from '../components/InfoCard';
import { GitHubProjects } from '../components/GitHubProjects';
import { MediumStories } from '../components/MediumStories';
import { DevToArticles } from '../components/DevToArticles';
import { SpotifyListening } from '../components/SpotifyListening';
import { StravaStats } from '../components/StravaStats';
import { Weather } from '../components/Weather';
import { Quote } from '../components/Quote';
import { VercelDeployments } from '../components/VercelDeployments';
import { Footer } from '../components/Footer';

export const HomePage = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[1080px]"
          aria-label="Portfolio content"
        >
          <InfoCard title="About">
            Welcome to my personal portfolio. Here you'll find my latest coding projects, blog posts, music I'm listening to, fitness activities, and more. Everything is powered by live data from various APIs.
          </InfoCard>

          <InfoCard title="Tech Stack">
            Built with React, TypeScript, Express.js, and Tailwind CSS. Deployed on Vercel with serverless functions. Integrates with GitHub, Medium, Spotify, Strava, OpenWeather, and more.
          </InfoCard>
          <Quote />
          <Weather />
          <GitHubProjects />
          <VercelDeployments />
          <MediumStories />
          <DevToArticles />
          <SpotifyListening />
          <StravaStats />
          
         
        </section>
      </main>

      <Footer />
    </div>
  );
};
