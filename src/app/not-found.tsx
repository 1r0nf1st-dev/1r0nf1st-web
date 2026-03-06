import type { JSX } from 'react';
import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Back to Home
      </Link>
    </div>
  );
}
