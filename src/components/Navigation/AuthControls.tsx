'use client';

import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { btnBase, btnGhost } from '../../styles/buttons';

interface AuthControlsProps {
  /** Variant: 'default' for Hero style, 'corporate' for CorporateNav style */
  variant?: 'default' | 'corporate';
  /** Callback when menu closes (for mobile) */
  onMenuClose?: () => void;
}

/**
 * Authentication controls component.
 * Shows login button or user menu based on auth state.
 */
export const AuthControls = ({ variant = 'default', onMenuClose }: AuthControlsProps): JSX.Element => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = (): void => {
    logout();
    router.push('/');
    setIsUserMenuOpen(false);
    onMenuClose?.();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const userLabel = user?.username || user?.email || '';

  if (!user) {
    return (
      <Link
        href="/login"
        className={`${btnBase} ${btnGhost} text-sm py-2 px-3 min-h-[44px] min-w-[44px]`}
        onClick={onMenuClose}
      >
        Login
      </Link>
    );
  }

  if (variant === 'default') {
    return (
      <>
        <span className="text-sm opacity-80 text-muted">
          Logged in as <strong>{userLabel}</strong>
        </span>
        <Link href="/notes/change-password" className={`${btnBase} ${btnGhost}`}>
          Change Password
        </Link>
        <button type="button" onClick={handleLogout} className={`${btnBase} ${btnGhost}`}>
          Logout
        </button>
      </>
    );
  }

  // Corporate variant with dropdown
  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        aria-label="Account menu"
        aria-expanded={isUserMenuOpen}
        className={`${btnBase} ${btnGhost} text-sm py-2 px-3 flex items-center gap-2 min-h-[44px] max-w-[180px] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background`}
      >
        <UserCircle className="w-5 h-5 shrink-0 text-muted" aria-hidden />
        <span className="truncate">{userLabel}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm text-muted truncate" title={userLabel}>
              {userLabel}
            </p>
          </div>
          <div className="p-2">
            <Link
              href="/notes/change-password"
              className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-surface-soft transition-colors"
              onClick={() => setIsUserMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-surface-soft transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
