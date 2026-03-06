'use client';

import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createSavedSearch,
  deleteSavedSearch,
  useSavedSearches,
} from '../../useSavedSearches';

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
    <div className="space-y-2">
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => {
            handleSave().catch(() => {});
          }}
          className="w-full rounded-xl border border-primary/20 px-2 py-1 text-left text-xs hover:bg-primary/5"
        >
          Save current search
        </button>
      ) : null}

      {isLoading ? (
        <div className="space-y-1">
          <div className="h-8 animate-pulse rounded-xl bg-primary/10" />
          <div className="h-8 animate-pulse rounded-xl bg-primary/10" />
        </div>
      ) : savedSearches && savedSearches.length > 0 ? (
        <ul className="space-y-1">
          {savedSearches.map((saved) => {
            // Extract search query details for better display
            const queryParams = new URLSearchParams(saved.query);
            const searchText = queryParams.get('q') || queryParams.get('search') || '';
            const hasEmailInQuery = /@/.test(searchText);
            const displayName = saved.name === 'Saved search' && searchText ? searchText : saved.name;
            
            return (
              <li key={saved.id} className="rounded-xl p-1 hover:bg-primary/5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex flex-1 flex-col gap-0.5 truncate px-1 py-1 text-left text-sm min-w-0"
                    onClick={() => handleApply(saved.query)}
                    title={saved.query}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                      <span className="truncate font-medium">{displayName}</span>
                    </div>
                    {hasEmailInQuery && searchText !== displayName && (
                      <span className="truncate text-xs text-muted pl-5">{searchText}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete saved search ${saved.name}`}
                    onClick={() => setConfirmDeleteId(saved.id)}
                    className="rounded-xl p-1 text-muted hover:bg-red-500/10 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                {confirmDeleteId === saved.id ? (
                  <div aria-live="polite" className="mt-1 flex items-center gap-2 px-1 text-xs">
                    <span>Delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        deleteSavedSearch(saved.id)
                          .then(() => refetch())
                          .finally(() => setConfirmDeleteId(null));
                      }}
                      className="rounded-xl bg-red-500/10 px-2 py-1 text-red-600"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-xl px-2 py-1 hover:bg-primary/10"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted">Your saved searches will appear here.</p>
      )}
    </div>
  );
};
