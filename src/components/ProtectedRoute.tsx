'use client';

import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './Skeleton';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 p-8"
        aria-busy
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return children;
};
