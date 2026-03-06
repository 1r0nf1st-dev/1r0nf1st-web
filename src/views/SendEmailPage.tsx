'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ChromeLayout } from '../components/ChromeLayout';
import { SendEmailCard } from '../components/SendEmailCard';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { btnBase, btnGhost } from '../styles/buttons';
import { Mail } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const SendEmailPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <ChromeLayout>
      <section className="w-full max-w-[1080px] mx-auto" aria-label="Send Email">
        <div className="mb-6">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <SendEmailCard />
          ) : (
            <AdminOnlyPlaceholderCard
              title="Send Email"
              description="Send transactional emails via Brevo. Admin only."
              icon={Mail}
              returnTo="/projects/send-email"
            />
          )}
        </div>
      </section>
    </ChromeLayout>
  );
};
