'use client';

import type { JSX } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './Skeleton';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Redirect to login with returnTo parameter when user is not authenticated
  useEffect(() => {
    if (!isLoading && !user && pathname && pathname !== '/login') {
      // Build returnTo URL with current pathname and search params
      const currentSearch = searchParams.toString();
      const returnTo = currentSearch ? `${pathname}?${currentSearch}` : pathname;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [user, isLoading, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8" aria-busy>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!user) {
    // Show loading state while redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8" aria-busy>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return children;
};
