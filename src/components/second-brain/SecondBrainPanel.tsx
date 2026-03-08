'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { CaptureForm } from './CaptureForm';
import { SearchForm } from './SearchForm';
import { BrowsePanel } from './BrowsePanel';
import { DigestPanel } from './DigestPanel';
import { btnBase, btnToolbar, btnToolbarActive, btnToolbarInactive } from '../../styles/buttons';

type Tab = 'capture' | 'search' | 'browse' | 'digest';

export const SecondBrainPanel = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<Tab>('capture');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'capture', label: 'Capture' },
    { id: 'search', label: 'Search' },
    { id: 'browse', label: 'Browse' },
    { id: 'digest', label: 'Digest & Review' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Second Brain tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${btnBase} ${btnToolbar} ${
              activeTab === tab.id ? btnToolbarActive : btnToolbarInactive
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="panel-capture"
        role="tabpanel"
        aria-labelledby="tab-capture"
        hidden={activeTab !== 'capture'}
      >
        {activeTab === 'capture' && <CaptureForm />}
      </div>

      <div
        id="panel-search"
        role="tabpanel"
        aria-labelledby="tab-search"
        hidden={activeTab !== 'search'}
      >
        {activeTab === 'search' && <SearchForm />}
      </div>

      <div
        id="panel-browse"
        role="tabpanel"
        aria-labelledby="tab-browse"
        hidden={activeTab !== 'browse'}
      >
        {activeTab === 'browse' && <BrowsePanel />}
      </div>

      <div
        id="panel-digest"
        role="tabpanel"
        aria-labelledby="tab-digest"
        hidden={activeTab !== 'digest'}
      >
        {activeTab === 'digest' && <DigestPanel />}
      </div>
    </div>
  );
};
