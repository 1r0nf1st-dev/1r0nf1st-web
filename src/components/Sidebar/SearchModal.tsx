'use client';

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import { cardClasses, cardTitle } from '../../styles/cards';
import { btnBase, btnGhost } from '../../styles/buttons';
import { useNotebooks } from '../../useNotebooks';
import { useTags } from '../../useTags';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps): JSX.Element | null => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { notebooks } = useNotebooks();
  const { tags } = useTags();

  // Focus management - focus input instead of first element
  useFocusManagement({
    isOpen,
    containerRef: modalRef,
    triggerRef: inputRef,
    trapFocus: true,
    autoFocus: false, // We'll handle focus manually on input
  });

  // Initialize state from URL params
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(searchParams.get('q') ?? searchParams.get('search') ?? '');
      setSelectedNotebookId(searchParams.get('notebook') ?? '');
      setSelectedTagId(searchParams.get('tag') ?? '');
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchParams]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (selectedNotebookId) {
      params.set('notebook', selectedNotebookId);
    }
    if (selectedTagId) {
      params.set('tag', selectedTagId);
    }
    const queryString = params.toString();
    router.push(queryString ? `/notes?${queryString}` : '/notes');
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedNotebookId('');
    setSelectedTagId('');
    router.push('/notes');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute top-0 left-0 z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <article className={`${cardClasses} max-w-md w-full`} onClick={(e) => e.stopPropagation()}>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 id="search-modal-title" className={cardTitle}>
              Search Notes
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`${btnBase} ${btnGhost} text-sm`}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search-input" className="block text-sm font-medium mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  placeholder="Search notes..."
                  className="w-full rounded-xl border border-primary/20 bg-background pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Notebook Filter */}
            {notebooks && notebooks.length > 0 && (
              <div>
                <label htmlFor="notebook-filter" className="block text-sm font-medium mb-2">
                  Notebook
                </label>
                <select
                  id="notebook-filter"
                  value={selectedNotebookId}
                  onChange={(e) => setSelectedNotebookId(e.target.value)}
                  className="w-full rounded-xl border border-primary/20 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All notebooks</option>
                  {notebooks.map((notebook) => (
                    <option key={notebook.id} value={notebook.id}>
                      {notebook.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tag Filter */}
            {tags && tags.length > 0 && (
              <div>
                <label htmlFor="tag-filter" className="block text-sm font-medium mb-2">
                  Tag
                </label>
                <select
                  id="tag-filter"
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="w-full rounded-xl border border-primary/20 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
              >
                <Search className="h-4 w-4" aria-hidden />
                Apply
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-primary/20 px-4 py-2 text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};
