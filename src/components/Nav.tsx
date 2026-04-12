'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BRAND_NAME } from '../config';
import { BrandName } from './BrandName';
import { useAuth } from '../contexts/AuthContext';

export const Nav = (): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const showLogin = !user;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linkClasses = (href: string): string => {
    const isActive = pathname === href;
    return [
      'font-mono',
      'text-[11px]',
      'font-semibold',
      'tracking-[0.12em]',
      'uppercase',
      'transition-colors',
      'focus-visible:outline-none',
      isActive ? 'text-[color:var(--color-orange)]' : 'text-[color:var(--color-text-inv-2)]',
      'hover:text-[color:var(--color-text-inv)]',
    ].join(' ');
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={linkClasses(href)}
      onClick={(e) => {
        e.preventDefault();
        router.push(href, { scroll: false });
        setMenuOpen(false);
      }}
    >
      {label}
    </Link>
  );

  return (
    <header className="nav bg-[color:var(--color-ink)] h-14 md:h-14 flex items-center px-7 fixed top-0 left-0 right-0 z-50">
      <nav className="flex w-full items-center justify-between" aria-label="Main navigation">
        <div className="nav-left flex items-center gap-2.5">
          <Link
            href="/"
            aria-label={BRAND_NAME}
            className="no-underline text-inherit"
            onClick={(e) => {
              e.preventDefault();
              router.push('/', { scroll: false });
            }}
          >
            <BrandName className="font-display text-[17px] font-black tracking-[0.08em] uppercase text-[color:var(--color-text-inv)] leading-none" />
          </Link>
        </div>
        <div className="nav-links hidden md:flex items-center gap-6">
          <div className="flex items-center gap-6">
            {navLink('/about', 'About')}
            {navLink('/projects', 'Projects')}
            {navLink('/contact', 'Contact')}
          </div>
          {showLogin ? (
            <Link
              href="/login"
              className={[
                'nav-cta text-[11px] font-bold tracking-[0.10em] uppercase px-[18px] py-[7px]',
                'bg-[color:var(--color-orange)] text-[color:var(--color-ink)] hover:opacity-90 transition-opacity',
              ].join(' ')}
              onClick={(e) => {
                e.preventDefault();
                router.push('/login', { scroll: false });
                setMenuOpen(false);
              }}
            >
              Login
            </Link>
          ) : null}
        </div>
        {showLogin ? (
          <Link
            href="/login"
            className={[
              'nav-cta-mobile md:hidden text-[10px] font-bold tracking-[0.10em] uppercase px-3 py-1.5',
              'bg-[color:var(--color-orange)] text-[color:var(--color-ink)] hover:opacity-90 transition-opacity',
            ].join(' ')}
            onClick={(e) => {
              e.preventDefault();
              router.push('/login', { scroll: false });
              setMenuOpen(false);
            }}
          >
            Login
          </Link>
        ) : null}
        <button
          type="button"
          className="nav-hamburger flex md:hidden flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1 ml-auto"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className="block w-5 h-0.5 bg-[color:var(--color-text-inv)]" />
          <span className="block w-5 h-0.5 bg-[color:var(--color-text-inv)]" />
          <span className="block w-5 h-0.5 bg-[color:var(--color-text-inv)]" />
        </button>
      </nav>
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-[99] bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="nav-mobile-drawer absolute top-14 left-0 right-0 bg-[color:var(--color-ink)] border-b-2 border-[color:var(--color-orange)] z-[100] py-2"
            role="dialog"
            aria-label="Mobile menu"
          >
            <Link
              href="/about"
              className="block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-text-inv-2)] py-3.5 px-5 border-b border-[color:var(--color-rule-dark)] no-underline hover:text-[color:var(--color-text-inv)]"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/projects"
              className="block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-text-inv-2)] py-3.5 px-5 border-b border-[color:var(--color-rule-dark)] no-underline hover:text-[color:var(--color-text-inv)]"
              onClick={() => setMenuOpen(false)}
            >
              Projects
            </Link>
            <Link
              href="/contact"
              className="block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-text-inv-2)] py-3.5 px-5 border-b border-[color:var(--color-rule-dark)] no-underline hover:text-[color:var(--color-text-inv)]"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
            {showLogin ? (
              <Link
                href="/login"
                className="block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--color-text-inv-2)] py-3.5 px-5 no-underline hover:text-[color:var(--color-text-inv)]"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            ) : null}
          </div>
        </>
      )}
    </header>
  );
};
