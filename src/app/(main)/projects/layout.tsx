'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { btnBase, btnGhost } from '../../../styles/buttons';

/**
 * Shared layout for all /projects/* routes.
 * - "Back to Projects" link (hidden on /projects itself and on Second Brain)
 * - Max-width container with consistent padding
 */
export default function ProjectsLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const pathname = usePathname();
  const isProjectSubpage =
    pathname !== '/projects' &&
    pathname?.startsWith('/projects') &&
    pathname !== '/projects/second-brain';

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {isProjectSubpage && (
        <div className="mb-6">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
