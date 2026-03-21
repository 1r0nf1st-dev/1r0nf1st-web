import type { JSX } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

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
  icon: Icon = Lock,
  returnTo = '/projects',
}: AdminOnlyPlaceholderCardProps): JSX.Element => {
  const loginTo = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div
      className="block border border-[color:var(--color-rule)] bg-[color:var(--color-white)] px-6 py-5 text-[color:var(--color-text-1)]"
      aria-label={title}
    >
      <div className="mb-3 flex items-center gap-3">
        <Icon className="text-2xl text-[color:var(--color-orange)] shrink-0" />
        <h3 className="m-0 font-display text-[14px] font-bold uppercase tracking-[0.06em]">
          {title}
        </h3>
      </div>
      <p className="m-0 mb-3 font-display text-[12px] leading-[1.7] text-[color:var(--color-text-2)]">
        {description}
      </p>
      <p className="m-0 mb-4 font-display text-[12px] text-[color:var(--color-orange)]">
        Admin access required. Log in with an admin account to continue.
      </p>
      <Link
        href={loginTo}
        className="inline-flex px-4 py-[9px] bg-[color:var(--color-orange)] font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white"
      >
        Log in
      </Link>
    </div>
  );
};
