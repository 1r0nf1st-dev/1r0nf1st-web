'use client';

import type { JSX } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DomainAuthCheckCard } from '../components/DomainAuthCheckCard';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { Shield } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const DomainAuthPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <section aria-label="Domain Auth (DKIM / DMARC)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin ? (
            <DomainAuthCheckCard />
          ) : (
            <AdminOnlyPlaceholderCard
              title="Domain Auth (DKIM / DMARC)"
              description="Check DNS for DMARC and DKIM on your sending domain. Admin only."
              icon={Shield}
              returnTo="/projects/domain-auth"
            />
          )}
        </div>
    </section>
  );
};
