import type { JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

export const Hero = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isProjectsPage = location.pathname === '/projects';
  const isLoginPage = location.pathname === '/login';
  const isChangePasswordPage = location.pathname === '/change-password';

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  return (
    <header className="w-full">
      <div className="relative rounded-xl border border-border bg-white dark:bg-surface shadow-md dark:shadow-soft overflow-hidden px-6 py-8 md:px-10 md:py-10 backdrop-blur-sm">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent dark:from-primary/20 dark:via-transparent from-10% to-55% opacity-100 dark:opacity-80 pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full border border-border bg-primary/12 dark:bg-primary/10 text-xs uppercase tracking-wider text-muted font-medium">
              Portfolio · React + Vite
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                }
                className={`${btnBase} ${btnGhost} p-2 min-w-0 text-xl leading-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full`}
              >
                {theme === 'dark' ? (
                  <HiSun aria-hidden />
                ) : (
                  <HiMoon aria-hidden />
                )}
              </button>
              {user && (
                <span className="text-sm opacity-80 text-muted">
                  Logged in as <strong>{user.username || user.email}</strong>
                </span>
              )}
            </div>
          </div>
          <Link to="/" className="no-underline text-inherit">
            <h1 className="mt-4 mb-2 text-3xl md:text-4xl font-semibold tracking-tight cursor-pointer">
              1r0nf1st
            </h1>
          </Link>
          <p className="mb-6 max-w-md text-muted leading-relaxed">
            A dynamic portfolio showcasing my latest projects, writing, and activity across GitHub, Medium, Spotify, and Strava. Built with React, TypeScript, and real-time API integrations.
          </p>
          <div className="flex flex-wrap gap-3">
            {isProjectsPage || isLoginPage || isChangePasswordPage ? (
              <Link to="/" className={`${btnBase} ${btnPrimary}`}>
                Back to Home
              </Link>
            ) : (
              <Link to="/projects" className={`${btnBase} ${btnPrimary}`}>
                View projects
              </Link>
            )}
            {user ? (
              <>
                {!isChangePasswordPage && (
                  <Link
                    to="/change-password"
                    className={`${btnBase} ${btnGhost}`}
                  >
                    Change Password
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${btnBase} ${btnGhost}`}
                >
                  Logout
                </button>
              </>
            ) : (
              !isLoginPage && (
                <Link to="/login" className={`${btnBase} ${btnGhost}`}>
                  Login
                </Link>
              )
            )}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className={`${btnBase} ${btnGhost}`}
            >
              GitHub profile
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
