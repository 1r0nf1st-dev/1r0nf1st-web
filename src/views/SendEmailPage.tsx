'use client';

import type { JSX } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SendEmailCard } from '../components/SendEmailCard';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { Mail } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const SendEmailPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <section aria-label="Send Email">
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
  );
};
