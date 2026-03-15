import type { Metadata } from 'next';
import type { JSX } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Providers } from './providers';
import { AuthHashErrorHandler } from '../components/AuthHashErrorHandler';
import { SkipLink } from '../components/SkipLink';
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
                var colorMode = 'dark';
                if (stored) {
                  try {
                    var parsed = JSON.parse(stored);
                    if (parsed.colorMode && (parsed.colorMode === 'light' || parsed.colorMode === 'dark')) {
                      colorMode = parsed.colorMode;
                    }
                  } catch (e) {
                    if (stored === 'light' || stored === 'dark') {
                      colorMode = stored;
                    }
                  }
                } else {
                  colorMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (colorMode === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
                var favicon = '/favicon.ico?v=5';
                var links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
                if (links.length) { links.forEach(function(l) { l.href = favicon; }); }
                else { var l = document.createElement('link'); l.rel = 'icon'; l.href = favicon; document.head.appendChild(l); }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          <Providers>
            <SkipLink />
            <AuthHashErrorHandler />
            <div className="min-h-screen min-w-0 overflow-x-hidden relative z-[1]">{children}</div>
          </Providers>
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
