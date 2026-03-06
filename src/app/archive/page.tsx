import type { JSX } from 'react';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const dynamic = 'force-dynamic';

/**
 * Archive page - redirects to notes page with archived filter
 */
export default function ArchivePage(): never {
  // Redirect to notes page with archived filter
  redirect('/notes?archived=true');
}
