'use client';

import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ fontSize: '1.1rem', opacity: 0.7 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return children;
};
