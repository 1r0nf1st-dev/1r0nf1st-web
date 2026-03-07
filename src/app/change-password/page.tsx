import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Redirect legacy /change-password to /notes/change-password (keeps sidebar in notes layout)
 */
export default function Page(): never {
  redirect('/notes/change-password');
}
