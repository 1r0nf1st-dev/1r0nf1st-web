import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ChangePasswordPage } from '../../views/ChangePasswordPage';

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
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    </Suspense>
  );
}
