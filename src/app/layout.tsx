import type { Metadata } from 'next';
import type { JSX } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Providers } from './providers';
import { AuthHashErrorHandler } from '../components/AuthHashErrorHandler';
import './globals.css';

export const metadata: Metadata = {
  title: '1r0nf1st Website',
  description:
    'A dynamic portfolio showcasing latest projects, writing, and activity across GitHub, Medium, Spotify, and Strava. Built with Next.js, React, TypeScript, and real-time API integrations.',
  openGraph: {
    title: '1r0nf1st Website',
    description:
      'A dynamic portfolio showcasing latest projects, writing, and activity across GitHub, Medium, Spotify, and Strava.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var stored = localStorage.getItem('theme');
                var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          <Providers>
            <AuthHashErrorHandler />
            <div className="min-h-screen relative z-[1]">{children}</div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
