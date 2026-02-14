import type { JSX } from 'react';
import Link from 'next/link';
import { FaLock } from 'react-icons/fa';
import { btnBase, btnPrimary } from '../styles/buttons';

export interface AdminOnlyPlaceholderCardProps {
  title: string;
  description: string;
  /** Optional icon component to show (e.g. FaEnvelope). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Redirect path after login (e.g. /projects/send-email). Defaults to /projects. */
  returnTo?: string;
}

/**
 * Shown on Projects page for admin-only tools when the user is not logged in as admin.
 * Displays the tool name, description, and a message with link to log in.
 */
export const AdminOnlyPlaceholderCard = ({
  title,
  description,
  icon: Icon = FaLock,
  returnTo = '/projects',
}: AdminOnlyPlaceholderCardProps): JSX.Element => {
  const loginTo = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div
      className="block p-6 border border-border rounded-lg bg-surface-soft/30 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      aria-label={title}
    >
      <div className="flex items-center gap-4 mb-3">
        <Icon className="text-3xl text-primary shrink-0" />
        <h3 className="m-0 text-xl font-semibold">{title}</h3>
      </div>
      <p className="m-0 mb-4 opacity-80 text-sm leading-relaxed">{description}</p>
      <p className="m-0 mb-4 text-sm text-amber-600 dark:text-amber-400">
        Sorry, you need to be logged in as admin to access this.
      </p>
      <Link href={loginTo} className={`${btnBase} ${btnPrimary} text-sm`}>
        Log in
      </Link>
    </div>
  );
};
