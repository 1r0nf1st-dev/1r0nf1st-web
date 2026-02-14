import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ChangePasswordPage } from '../../views/ChangePasswordPage';

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    </Suspense>
  );
}
