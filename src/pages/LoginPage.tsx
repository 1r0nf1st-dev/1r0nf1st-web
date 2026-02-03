import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { cardClasses, cardOverlay, cardTitle } from '../styles/cards';
import { btnBase, btnPrimary, btnGhost } from '../styles/buttons';

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
    <div className="min-h-screen flex flex-col p-6 md:p-8 lg:p-10">
      <Hero />
      <main className="flex-1 flex items-stretch justify-center pt-7">
        <section className="w-full max-w-[500px] mx-auto">
          <article className={cardClasses}>
            <div className={cardOverlay} aria-hidden />
            <h2 className={`${cardTitle} mb-6`}>
              {isRegister ? 'Create Account' : 'Login'}
            </h2>
            <form onSubmit={handleSubmit} className="relative z-10">
              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {isRegister && (
                <div className="mb-4">
                  <label
                    htmlFor="username"
                    className="block mb-2 text-sm font-medium text-foreground"
                  >
                    Username (optional)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="mt-2 text-[0.85rem] opacity-70">
                    If not provided, email prefix will be used
                  </p>
                </div>
              )}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-foreground"
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
                  className="w-full p-3 rounded-lg border border-border bg-surface-soft/50 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {isRegister && (
                  <p className="mt-2 text-[0.85rem] opacity-70">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
              <button
                type="submit"
                className={`${btnBase} ${btnPrimary} w-full mb-4`}
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className={`${btnBase} ${btnGhost} w-full text-sm`}
              >
                {isRegister
                  ? 'Already have an account? Login'
                  : "Don't have an account? Register"}
              </button>
            </form>
            {!isRegister && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg text-sm opacity-80 relative z-10">
                <strong>Note:</strong> Use your email address to login. If you
                haven&apos;t created an account yet, click &quot;Register&quot;
                to create one.
              </div>
            )}
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};
