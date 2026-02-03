import type { JSX } from 'react';

export const Footer = (): JSX.Element => {
  return (
    <footer className="mt-8 text-center text-muted text-sm">
      <p>
        Portfolio powered by Vite · React · TypeScript · GitHub API · Version:{' '}
        <span className="font-mono font-semibold text-muted opacity-90">
          {__BUILD_VERSION__}
        </span>
      </p>
    </footer>
  );
};
