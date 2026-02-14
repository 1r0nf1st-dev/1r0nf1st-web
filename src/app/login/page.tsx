import type { JSX } from 'react';
import { Suspense } from 'react';
import { LoginPage } from '../../views/LoginPage';

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
