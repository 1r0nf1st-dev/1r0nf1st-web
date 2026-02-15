import type { JSX } from 'react';

export const Footer = (): JSX.Element => {
  const buildVersion =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BUILD_VERSION
      ? process.env.NEXT_PUBLIC_BUILD_VERSION
      : 'dev';

  return (
    <footer className="mt-8 text-center text-muted text-sm">
      <p>
        Portfolio powered by Next.js · React · TypeScript · Supabase · Tailwind · Version:{' '}
        <span className="font-mono font-semibold text-muted opacity-90">
          {buildVersion}
        </span>
      </p>
    </footer>
  );
};
