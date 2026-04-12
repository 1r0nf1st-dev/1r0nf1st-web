import type { JSX } from 'react';
import Link from 'next/link';
import { CogPair } from './CogPair';
import { BrandName } from './BrandName';

export const Footer = (): JSX.Element => (
  <footer className="footer flex items-center justify-between bg-[color:var(--color-ink)] px-7 py-5">
    <div className="flex items-center gap-2.5">
      <div className="opacity-50">
        <CogPair
          // Footer variant from Section 4c
          lx={24}
          ly={18}
          lr={14}
          lt={7}
          la={4}
          ld={3}
          sx={11}
          sy={30}
          sr={8}
          st={5}
          sa={2.5}
          sd={2}
          speed={0.15}
          width={32}
          height={32}
          viewBox="0 0 44 44"
          variant="footer"
        />
      </div>
      <BrandName className="font-display text-[13px] font-black uppercase tracking-[0.10em] text-[color:var(--color-text-inv)] leading-none" />
    </div>
    <div className="footer-links flex items-center gap-[22px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-inv-2)]">
      <Link href="/about" className="hover:text-[color:var(--color-text-inv)]">
        About
      </Link>
      <Link href="/projects" className="hover:text-[color:var(--color-text-inv)]">
        Projects
      </Link>
      <Link href="/contact" className="hover:text-[color:var(--color-text-inv)]">
        Contact
      </Link>
    </div>
    <div className="footer-ver font-mono text-[9px] text-[color:var(--color-text-inv-2)]">
      v{typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BUILD_VERSION
        ? process.env.NEXT_PUBLIC_BUILD_VERSION
        : 'dev'}
    </div>
  </footer>
);
