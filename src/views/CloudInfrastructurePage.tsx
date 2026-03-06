import type { JSX } from 'react';
import Link from 'next/link';
import { VercelDeployments } from '../components/VercelDeployments';
import { GitHubProjects } from '../components/GitHubProjects';
import { ChromeLayout } from '../components/ChromeLayout';
import { btnBase, btnGhost } from '../styles/buttons';

export const CloudInfrastructurePage = (): JSX.Element => {
  return (
    <ChromeLayout>
      <section className="w-full max-w-[1080px] mx-auto" aria-label="Cloud Infrastructure">
        <div className="mb-6">
          <Link
            href="/projects"
            className={`${btnBase} ${btnGhost} text-sm py-2 px-4 inline-flex items-center gap-2`}
          >
            ← Back to Projects
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <VercelDeployments />
          </div>
          <div className="md:col-span-3">
            <GitHubProjects />
          </div>
        </div>
      </section>
    </ChromeLayout>
  );
};
