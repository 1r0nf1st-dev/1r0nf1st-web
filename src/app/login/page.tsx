import type { JSX } from 'react';
import { Suspense } from 'react';
import { LoginPage } from '../../views/LoginPage';

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
