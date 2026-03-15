import type { JSX } from 'react';
import { VercelDeployments } from '../components/VercelDeployments';
import { GitHubProjects } from '../components/GitHubProjects';
export const CloudInfrastructurePage = (): JSX.Element => {
  return (
    <section aria-label="Cloud Infrastructure">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <VercelDeployments />
          </div>
          <div className="md:col-span-3">
            <GitHubProjects />
          </div>
        </div>
    </section>
  );
};
