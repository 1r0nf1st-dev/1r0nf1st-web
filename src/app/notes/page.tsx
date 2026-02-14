import type { JSX } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { NotesPage } from '../../views/NotesPage';

export default function Page(): JSX.Element {
  return (
    <ProtectedRoute>
      <NotesPage />
    </ProtectedRoute>
  );
}
