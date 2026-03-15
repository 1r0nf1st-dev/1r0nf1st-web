'use client';

import type { JSX } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { SecondBrainPanel } from '../components/second-brain/SecondBrainPanel';
import { Brain } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const SecondBrainPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <section aria-label="Second Brain">
      <div className="space-y-6">
        {isAdmin ? (
          <SecondBrainPanel />
        ) : (
          <AdminOnlyPlaceholderCard
            title="Second Brain"
            description="Capture thoughts, semantic search, browse projects, people, ideas, and view digests. Admin only."
            icon={Brain}
            returnTo="/projects/second-brain"
          />
        )}
      </div>
    </section>
  );
};
