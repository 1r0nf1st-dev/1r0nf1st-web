import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { InfoCard } from '../components/InfoCard';
import { GitHubProjects } from '../components/GitHubProjects';
import { MediumStories } from '../components/MediumStories';
import { DevToArticles } from '../components/DevToArticles';
import { SpotifyListening } from '../components/SpotifyListening';
import { Weather } from '../components/Weather';
import { Quote } from '../components/Quote';
import { Joke } from '../components/Joke';
import { Footer } from '../components/Footer';
import { RobotWalkRaiseAnimation } from '../components/RobotWalkRaiseAnimation';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';

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
            Welcome to my personal portfolio. Here you&apos;ll find my latest coding projects, blog posts, music I&apos;m listening to, fitness activities, and more. Everything is powered by live data from various APIs.
          </InfoCard>

          <InfoCard title="Tech Stack">
            Built with React, TypeScript, Express.js, and Tailwind CSS. Deployed on Vercel with serverless functions. Integrates with GitHub, Medium, Spotify, Strava, OpenWeather, and more.
          </InfoCard>
          <Link
            to="/experience"
            className="no-underline text-inherit block"
            aria-label="Go to Meet 1r0nf1st experience"
          >
            <article className={`${cardClasses} h-full flex flex-col`} id="meet-1r0nf1st">
              <div className={cardOverlay} aria-hidden />
              <div className="flex justify-center mb-3">
                <RobotWalkRaiseAnimation width={140} loop />
              </div>
              <h2 className={cardTitle}>Meet 1r0nf1st</h2>
              <p className={cardBody}>
                Go through the robot experience: boot sequence, a short cutscene, theme picker, and more. 1r0nf1st is a friendly robot who loves to help.
              </p>
              <span className={`${btnBase} ${btnPrimary} mt-auto self-start pointer-events-none`} aria-hidden>
                Start experience
              </span>
            </article>
          </Link>
          <Quote />
          <Joke />
          <Weather />
          <GitHubProjects />
          <MediumStories />
          <DevToArticles />
          <SpotifyListening />
        </section>
      </main>

      <Footer />
    </div>
  );
};
