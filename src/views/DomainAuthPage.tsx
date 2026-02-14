'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { DomainAuthCheckCard } from '../components/DomainAuthCheckCard';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { btnBase, btnGhost } from '../styles/buttons';
import { FaShieldAlt } from 'react-icons/fa';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const DomainAuthPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <div className="w-full max-w-[1080px] mx-auto">
        <Hero />
      </div>

      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section
          className="w-full max-w-[1080px] mx-auto"
          aria-label="Domain Auth (DKIM / DMARC)"
        >
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
              <DomainAuthCheckCard />
            ) : (
              <AdminOnlyPlaceholderCard
                title="Domain Auth (DKIM / DMARC)"
                description="Check DNS for DMARC and DKIM on your sending domain. Admin only."
                icon={FaShieldAlt}
                returnTo="/projects/domain-auth"
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
