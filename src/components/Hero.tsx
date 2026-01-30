import type { JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Hero = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isProjectsPage = location.pathname === '/projects';
  const isLoginPage = location.pathname === '/login';
  const isChangePasswordPage = location.pathname === '/change-password';

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  return (
    <header className="hero">
      <div className="hero-inner">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span className="pill">Portfolio · React + Vite</span>
          {user && (
            <span
              style={{
                fontSize: '0.85rem',
                opacity: 0.8,
                color: 'var(--text-muted)',
              }}
            >
              Logged in as <strong>{user.username || user.email}</strong>
            </span>
          )}
        </div>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 className="hero-title" style={{ cursor: 'pointer' }}>
            1r0nf1st
          </h1>
        </Link>
        <p className="hero-subtitle">
          Building fast, type-safe experiences with React, TypeScript, and modern tooling. This
          portfolio is powered by live data from public APIs.
        </p>
        <div className="hero-actions">
          {isProjectsPage || isLoginPage || isChangePasswordPage ? (
            <Link to="/" className="button button-primary">
              Back to Home
            </Link>
          ) : (
            <Link to="/projects" className="button button-primary">
              View projects
            </Link>
          )}
          {user ? (
            <>
              {!isChangePasswordPage && (
                <Link to="/change-password" className="button button-ghost">
                  Change Password
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="button button-ghost"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            !isLoginPage && (
              <Link to="/login" className="button button-ghost">
                Login
              </Link>
            )
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="button button-ghost"
          >
            GitHub profile
          </a>
        </div>
      </div>
    </header>
  );
};
