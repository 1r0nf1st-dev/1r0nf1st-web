'use client';

import type { JSX, ReactNode } from 'react';
import Link from 'next/link';

export interface PageHeroTab {
  id: string;
  label: string;
}

export interface PageHeroProps {
  flagLabel: string;
  title: ReactNode;
  watermark: string;
  subtitle?: string;
  primaryBtn?: {
    label: string;
    href: string;
  };
  secondaryBtn?: {
    label: string;
    href: string;
  };
  variant?: 'interior' | 'public';
  actions?: ReactNode;
  tabs?: PageHeroTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export const PageHero = ({
  flagLabel,
  title,
  watermark,
  subtitle,
  primaryBtn,
  secondaryBtn,
  variant = 'interior',
  actions,
  tabs,
  activeTabId,
  onTabChange,
}: PageHeroProps): JSX.Element => {
  const renderCta = (btn?: { label: string; href: string }, className?: string): ReactNode => {
    if (!btn) return null;

    const { label, href } = btn;

    if (href.startsWith('#')) {
      return (
        <a href={href} className={className}>
          {label}
        </a>
      );
    }

    if (href.startsWith('/')) {
      return (
        <Link href={href} className={className}>
          {label}
        </Link>
      );
    }

    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  };

  const publicButtons =
    variant === 'public' ? (
      <div className="page-hero-btns">
        {renderCta(primaryBtn, 'btn-primary')}
        {renderCta(secondaryBtn, 'btn-outline')}
      </div>
    ) : null;

  return (
    <div className={variant === 'public' ? 'page-hero page-hero--public' : 'page-hero'}>
      <div className="page-hero-watermark">{watermark}</div>
      <div className="page-hero-inner">
        <div className="page-flag">
          <div className="flag-line" />
          <span className="flag-label">{flagLabel}</span>
          <div className="flag-line" />
        </div>

        <div className="page-hero-actions">
          <h1 className={variant === 'public' ? 'page-hero-title' : 'page-h1'}>{title}</h1>
          {variant === 'public' && subtitle ? (
            <p className="page-hero-subtitle">{subtitle}</p>
          ) : null}
          {variant === 'public' ? (
            publicButtons
          ) : actions ? (
            <div className="hero-page-btns">{actions}</div>
          ) : null}
        </div>

        {tabs && tabs.length ? (
          <div
            className="tab-bar"
            role="tablist"
            aria-label={`${typeof title === 'string' ? title : flagLabel} tabs`}
          >
            {tabs.map((t) => {
              const isActive = t.id === activeTabId;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={isActive ? 'tab active' : 'tab'}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange?.(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};
