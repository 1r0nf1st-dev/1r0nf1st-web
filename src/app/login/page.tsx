import type { JSX } from 'react';
import { Suspense } from 'react';
import { LoginPage } from '../../views/LoginPage';

export default function Page(): JSX.Element {
  return (
    <Suspense
          fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" aria-busy>
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted/40 dark:bg-muted/30" role="status" aria-label="Loading" />
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted/40 dark:bg-muted/30" role="status" aria-label="Loading" />
            </div>
          }
        >
      <LoginPage />
    </Suspense>
  );
}
