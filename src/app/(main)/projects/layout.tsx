'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Shared layout for all /projects/* routes.
 * - "Back to Projects" link (hidden on /projects itself and on Second Brain)
 * - Max-width container with consistent padding
 */
export default function ProjectsLayout({ children }: { children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const isProjectSubpage =
    pathname !== '/projects' &&
    pathname?.startsWith('/projects') &&
    pathname !== '/projects/second-brain';

  return (
    <div className="w-full min-w-0 flex flex-1 flex-col min-h-0">
      {isProjectSubpage && (
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 border border-[color:var(--color-rule)] bg-[color:var(--color-white)] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-1)] hover:border-[color:var(--color-text-3)]"
          >
            ← Back to Projects
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
