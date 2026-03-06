import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Settings page - redirects to change password page
 * Future: Can be expanded to include more settings
 */
export default function SettingsPage(): never {
  // Redirect to change password page (main settings page for now)
  redirect('/change-password');
}
