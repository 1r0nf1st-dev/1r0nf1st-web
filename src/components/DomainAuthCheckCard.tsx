'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getJson, ApiError } from '../apiClient';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';
import { getApiBase } from '../config';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

interface CheckResult {
  present: boolean;
  valid: boolean;
  record: string | null;
  error: string | null;
  lookupHostname?: string;
  dnsErrorCode?: string | null;
  suggestion?: string | null;
}

interface DomainAuthResult {
  dmarc: CheckResult;
  dkim: CheckResult;
}

/** True if the current user is the admin (same as SendEmailCard). */
function useIsAdmin(): boolean {
  const { user } = useAuth();
  const clientIsAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  return clientIsAdmin;
}

export const DomainAuthCheckCard = (): JSX.Element | null => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [domain, setDomain] = useState('');
  const [dkimSelector, setDkimSelector] = useState('mail');
  const [result, setResult] = useState<DomainAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || !isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const domainTrim = domain.trim();
    if (!domainTrim) {
      setError('Domain is required (e.g. example.com).');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        domain: domainTrim,
        dkimSelector: dkimSelector.trim() || 'mail',
      });
      const data = await getJson<DomainAuthResult>(
        `${getApiBase()}/email/domain-auth?${params.toString()}`,
      );
      setResult(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Check failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const Status = ({ r }: { r: CheckResult }) => (
    <div className="mt-2 space-y-1">
      <span className="font-medium text-foreground">{r.present ? 'Present' : 'Missing'}</span>
      {r.present && (
        <>
          {' · '}
          <span className={r.valid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
            {r.valid ? 'Valid' : 'Invalid'}
          </span>
        </>
      )}
      {r.lookupHostname && (
        <p className="text-xs text-muted" title={r.lookupHostname}>
          Looked up: <code className="break-all bg-muted/50 px-1 rounded">{r.lookupHostname}</code>
        </p>
      )}
      {r.error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-0.5">{r.error}</p>
      )}
      {r.suggestion && (
        <p className="text-sm text-foreground/90 mt-1 p-2 rounded bg-primary/10 dark:bg-primary/5 border border-primary/20">
          <span className="font-medium text-foreground">Suggestion:</span>{' '}
          {r.suggestion}
        </p>
      )}
      {r.record && (
        <p className="text-xs text-muted mt-1 break-all max-w-full truncate" title={r.record}>
          {r.record.length > 80 ? `${r.record.slice(0, 80)}…` : r.record}
        </p>
      )}
    </div>
  );

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Domain auth (DKIM / DMARC)</h2>
      <p className={cardBody}>
        Check DNS for DMARC and DKIM on a domain. Only visible to admin. Use the DKIM selector from your provider (e.g. Brevo).
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="domain-auth-domain" className="block text-sm font-medium text-foreground mb-1">
            Domain <span className="text-red-500">*</span>
          </label>
          <input
            id="domain-auth-domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary"
            aria-required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="domain-auth-selector" className="block text-sm font-medium text-foreground mb-1">
            DKIM selector
          </label>
          <input
            id="domain-auth-selector"
            type="text"
            value={dkimSelector}
            onChange={(e) => setDkimSelector(e.target.value)}
            placeholder="mail or brevo"
            className="w-full px-3 py-2 border-2 border-primary/40 dark:border-border rounded-lg bg-white dark:bg-surface text-foreground focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg border-2 border-primary/20 dark:border-border p-3 space-y-2 text-sm">
            <div>
              <strong className="text-foreground">DMARC</strong>
              <Status r={result.dmarc} />
            </div>
            <div>
              <strong className="text-foreground">DKIM</strong>
              <Status r={result.dkim} />
            </div>
          </div>
        )}
        <button
          type="submit"
          className={`${btnBase} ${btnPrimary}`}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Checking…' : 'Run check'}
        </button>
      </form>
    </article>
  );
};
