import type { JSX } from 'react';
import { SharedNoteViewPage } from '../../../../../components/SharedNoteViewPage';

interface PageProps {
  params: Promise<{ token: string }>;
}

/** Public share link page - no auth required. Winston: token in URL maps to view-only. */
export default async function SharedNotePage({ params }: PageProps): Promise<JSX.Element> {
  const { token } = await params;
  return <SharedNoteViewPage token={token} />;
}
