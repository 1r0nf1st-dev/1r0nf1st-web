import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Redirect legacy /templates to /notes/templates (keeps sidebar in notes layout)
 */
export default function TemplatesPage(): never {
  redirect('/notes/templates');
}
