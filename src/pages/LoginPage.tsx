import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';

export const LoginPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password, username || undefined);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Hero />
      <main className="main">
        <section
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <article className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>
              {isRegister ? 'Create Account' : 'Login'}
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                  }}
                />
              </div>
              {isRegister && (
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="username"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    Username (optional)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                    }}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                    If not provided, email prefix will be used
                  </p>
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 6 : undefined}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                  }}
                />
                {isRegister && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="button button-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginBottom: '1rem',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="button button-ghost"
                style={{ width: '100%', fontSize: '0.9rem' }}
              >
                {isRegister
                  ? 'Already have an account? Login'
                  : "Don't have an account? Register"}
              </button>
            </form>
            {!isRegister && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  opacity: 0.8,
                }}
              >
                <strong>Note:</strong> Use your email address to login. If you haven't created an account yet, click "Register" to create one.
              </div>
            )}
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};
