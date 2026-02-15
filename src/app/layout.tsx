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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
