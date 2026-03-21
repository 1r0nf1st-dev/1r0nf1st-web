'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { CaptureForm } from './CaptureForm';
import { SearchForm } from './SearchForm';
import { BrowsePanel } from './BrowsePanel';
import { DigestPanel } from './DigestPanel';

type Tab = 'capture' | 'search' | 'browse' | 'digest';

export interface SecondBrainPanelProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  showTabs?: boolean;
}

export const SecondBrainPanel = ({
  activeTab: activeTabProp,
  onTabChange,
  showTabs = true,
}: SecondBrainPanelProps): JSX.Element => {
  const [uncontrolled, setUncontrolled] = useState<Tab>('capture');
  const activeTab = activeTabProp ?? uncontrolled;
  const setActiveTab = (next: Tab): void => {
    onTabChange?.(next);
    if (activeTabProp === undefined) setUncontrolled(next);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'capture', label: 'Capture' },
    { id: 'search', label: 'Search' },
    { id: 'browse', label: 'Browse' },
    { id: 'digest', label: 'Digest & Review' },
  ];

  return (
    <div className="space-y-6">
      {showTabs ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Second Brain tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={[
                'px-4',
                'py-2',
                'font-mono',
                'text-[10px]',
                'uppercase',
                'tracking-[0.12em]',
                'border',
                'border-[color:var(--color-rule)]',
                'bg-[color:var(--color-white)]',
                'text-[color:var(--color-text-2)]',
                'hover:border-[color:var(--color-text-3)]',
                activeTab === tab.id
                  ? 'bg-[color:var(--color-orange-bg)] text-[color:var(--color-orange)] border-[color:var(--color-orange)]'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

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
