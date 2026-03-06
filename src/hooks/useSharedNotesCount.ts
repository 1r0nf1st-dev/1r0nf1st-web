'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getJson } from '../apiClient';
import { useAuth } from '../contexts/AuthContext';

interface SharedCountResponse {
  data: { count: number } | null;
  error: { message: string; code: string } | null;
}

/**
 * Hook to fetch and manage shared notes count.
 * Refetches when pathname changes to '/notes/shared'.
 */
export const useSharedNotesCount = (): number | undefined => {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [sharedUnreadCount, setSharedUnreadCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Don't make API calls if auth is still loading or user is not authenticated
    if (authLoading || !user) {
      setSharedUnreadCount(undefined);
      return;
    }

    let isCancelled = false;

    const fetchSharedCount = async () => {
      try {
        const response = await getJson<SharedCountResponse>('/api/v1/notes/shared/count');
        if (isCancelled) return;
        const count = response.data?.count;
        setSharedUnreadCount(typeof count === 'number' ? count : undefined);
      } catch {
        if (isCancelled) return;
        setSharedUnreadCount(undefined);
      }
    };

    fetchSharedCount().catch(() => {});
    if (pathname === '/notes/shared') {
      fetchSharedCount().catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [pathname, authLoading, user]);

  return sharedUnreadCount;
};
