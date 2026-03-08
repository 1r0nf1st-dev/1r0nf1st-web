'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ChromeLayout } from '../components/ChromeLayout';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { SecondBrainPanel } from '../components/second-brain/SecondBrainPanel';
import { btnBase, btnGhost } from '../styles/buttons';
import { Brain } from 'lucide-react';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const SecondBrainPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <ChromeLayout>
      <section
        className="w-full max-w-[1080px] mx-auto"
        aria-label="Second Brain"
      >
        <div className="mb-6">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
        </div>
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
    </ChromeLayout>
  );
};
