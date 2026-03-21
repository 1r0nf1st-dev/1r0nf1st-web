'use client';

import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminOnlyPlaceholderCard } from '../components/AdminOnlyPlaceholderCard';
import { SecondBrainPanel } from '../components/second-brain/SecondBrainPanel';
import { Brain } from 'lucide-react';
import { PageHero } from '../components/PageHero';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

export const SecondBrainPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [tab, setTab] = useState<'capture' | 'search' | 'browse' | 'digest'>('capture');

  const hero = useMemo(() => {
    const title =
      tab === 'capture'
        ? 'Quick Capture'
        : tab === 'search'
          ? 'Semantic Search'
          : tab === 'browse'
            ? 'Browse'
            : 'Digest & Review';
    const watermark =
      tab === 'capture'
        ? 'Capture'
        : tab === 'search'
          ? 'Search'
          : tab === 'browse'
            ? 'Browse'
            : 'Digest';
    return (
      <PageHero
        flagLabel="Intelligence"
        title={title}
        watermark={watermark}
        tabs={[
          { id: 'capture', label: 'Capture' },
          { id: 'search', label: 'Search' },
          { id: 'browse', label: 'Browse' },
          { id: 'digest', label: 'Digest & Review' },
        ]}
        activeTabId={tab}
        onTabChange={(id) => setTab(id as typeof tab)}
      />
    );
  }, [tab]);

  return (
    <section
      aria-label="Second Brain"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      {hero}
      <div className="page-content min-h-0">
        {isAdmin ? (
          <SecondBrainPanel activeTab={tab} onTabChange={setTab} showTabs={false} />
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
