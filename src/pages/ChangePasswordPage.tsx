import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';

export const ChangePasswordPage = (): JSX.Element => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
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
              Change Password
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
              {success && (
                <div
                  style={{
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    color: '#22c55e',
                    fontSize: '0.9rem',
                  }}
                >
                  {success}
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="currentPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="newPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
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
                  Must be at least 6 characters
                </p>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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
                {isLoading ? 'Changing password...' : 'Change Password'}
              </button>
            </form>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};
