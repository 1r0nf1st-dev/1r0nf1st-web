import type { JSX } from 'react';
import { Suspense } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { NotesActionsProvider } from '../../contexts/NotesActionsContext';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NotesPage } from '../../views/NotesPage';

export const dynamic = 'force-dynamic';

/**
 * Templates page - shows notes page where templates can be accessed
 * Templates are managed within the notes interface via sidebar accordion
 */
export default function TemplatesPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <NotesActionsProvider>
        <SidebarProvider>
          <Suspense fallback={<div className="p-4 text-sm text-muted">Loading templates...</div>}>
            <NotesPage useChrome={false} />
          </Suspense>
        </SidebarProvider>
      </NotesActionsProvider>
    </ProtectedRoute>
  );
}
