import type { JSX } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Offline | 1r0nf1st',
  description: 'You are offline. Some features may be unavailable.',
};

export default function OfflinePage(): JSX.Element {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="rounded-full bg-amber-500/20 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-center text-zinc-600 dark:text-zinc-400">
        This page couldn&apos;t be loaded. Check your connection and try again.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        Go to home
      </Link>
    </main>
  );
}
