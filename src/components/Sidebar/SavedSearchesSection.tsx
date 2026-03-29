'use client';

import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createSavedSearch, deleteSavedSearch, useSavedSearches } from '../../useSavedSearches';

export const SavedSearchesSection = (): JSX.Element => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { savedSearches, isLoading, refetch } = useSavedSearches();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchParams.get('q')) ||
      Boolean(searchParams.get('tag')) ||
      Boolean(searchParams.get('notebook')) ||
      Boolean(searchParams.get('archived'))
    );
  }, [searchParams]);

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return params.toString();
  }, [searchParams]);

  const handleSave = async () => {
    if (!hasActiveFilters || !currentQuery) return;
    await createSavedSearch({
      name: 'Saved search',
      query: currentQuery,
    });
    await refetch();
  };

  const handleApply = (query: string) => {
    const nextPath = query ? `/notes?${query}` : '/notes';
    if (pathname !== '/notes') {
      router.push(nextPath);
      return;
    }
    router.push(nextPath);
  };

  return (
    <div>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => {
            handleSave().catch(() => {});
          }}
          className="sidebar-tools-text-btn"
        >
          Save current search
        </button>
      ) : null}

      {isLoading ? (
        <div>
          <div className="sidebar-skeleton-bar" />
          <div className="sidebar-skeleton-bar" />
        </div>
      ) : savedSearches && savedSearches.length > 0 ? (
        <ul className="m-0 list-none p-0">
          {savedSearches.map((saved) => {
            const queryParams = new URLSearchParams(saved.query);
            const searchText = queryParams.get('q') || queryParams.get('search') || '';
            const hasEmailInQuery = /@/.test(searchText);
            const displayName =
              saved.name === 'Saved search' && searchText ? searchText : saved.name;

            return (
              <li key={saved.id}>
                <div className="flex min-w-0 items-stretch">
                  <button
                    type="button"
                    className="nav-item min-w-0 flex-1 border-0 bg-transparent text-left"
                    onClick={() => handleApply(saved.query)}
                    title={saved.query}
                  >
                    <span className="nav-item-icon nav-item-icon--svg" aria-hidden>
                      <Search />
                    </span>
                    <span className="nav-item-label nav-item-label--multiline">
                      <span className="max-w-full truncate">{displayName}</span>
                      {hasEmailInQuery && searchText !== displayName ? (
                        <span className="max-w-full truncate text-[10px] font-normal text-[color:var(--color-text-inv-2)]">
                          {searchText}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete saved search ${saved.name}`}
                    onClick={() => setConfirmDeleteId(saved.id)}
                    className="sidebar-tools-icon-btn"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                {confirmDeleteId === saved.id ? (
                  <div aria-live="polite" className="sidebar-tools-confirm">
                    <span>Delete?</span>
                    <button
                      type="button"
                      className="sidebar-tools-confirm-yes"
                      onClick={() => {
                        deleteSavedSearch(saved.id)
                          .then(() => refetch())
                          .finally(() => setConfirmDeleteId(null));
                      }}
                    >
                      Yes
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="sidebar-tools-hint">Your saved searches will appear here.</p>
      )}
    </div>
  );
};
