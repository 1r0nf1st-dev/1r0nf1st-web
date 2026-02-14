import { promises as dns } from 'dns';

/** Result of checking one record (DMARC or DKIM). */
export interface DomainCheckResult {
  present: boolean;
  valid: boolean;
  record: string | null;
  error: string | null;
  /** Hostname we looked up (e.g. _dmarc.example.com or mail._domainkey.example.com). */
  lookupHostname: string;
  /** DNS error code when lookup failed (e.g. ENOTFOUND, ENODATA). */
  dnsErrorCode: string | null;
  /** Short suggestion when record is missing (what to add and where). */
  suggestion: string | null;
}

export interface DomainAuthCheckResult {
  dmarc: DomainCheckResult;
  dkim: DomainCheckResult;
}

/** Basic domain format: allow letters, digits, hyphens, dots. */
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;

function isValidDomain(domain: string): boolean {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253) return false;
  return DOMAIN_REGEX.test(trimmed);
}

/** Result of a DNS TXT lookup (value and optional error code). */
interface ResolveTxtResult {
  value: string | null;
  dnsErrorCode: string | null;
}

/** Resolve TXT records for a hostname. Returns combined record string and any DNS error code. */
async function resolveTxt(hostname: string): Promise<ResolveTxtResult> {
  try {
    const results = await dns.resolveTxt(hostname);
    if (!Array.isArray(results) || results.length === 0) {
      return { value: null, dnsErrorCode: 'ENODATA' };
    }
    // Each result is string[]; join with no space per RFC (multiple strings are concatenated)
    const combined = results.map((arr) => (Array.isArray(arr) ? arr.join('') : String(arr))).join('');
    const value = combined.trim() || null;
    return { value, dnsErrorCode: value ? null : 'ENODATA' };
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : null;
    return { value: null, dnsErrorCode: code || 'UNKNOWN' };
  }
}

/** Human-readable explanation of a DNS error code. */
function describeDnsError(code: string | null): string {
  if (!code) return '';
  switch (code) {
    case 'ENOTFOUND':
      return 'DNS name does not exist (hostname not found).';
    case 'ENODATA':
      return 'No TXT records at this hostname.';
    case 'ETIMEDOUT':
      return 'DNS lookup timed out.';
    case 'REFUSED':
      return 'DNS server refused the query.';
    default:
      return code === 'UNKNOWN' ? 'DNS lookup failed.' : `DNS error: ${code}.`;
  }
}

/**
 * Check DMARC: _dmarc.<domain> must have v=DMARC1 and a p= (policy) tag.
 */
function validateDmarcRecord(record: string | null): { valid: boolean; error: string | null } {
  if (!record || !record.trim()) {
    return { valid: false, error: 'No DMARC record found.' };
  }
  const lower = record.toLowerCase();
  if (!lower.includes('v=dmarc1')) {
    return { valid: false, error: 'Record must start with v=DMARC1.' };
  }
  // p= none | quarantine | reject
  const pMatch = record.match(/\bp=(none|quarantine|reject)\b/i);
  if (!pMatch) {
    return { valid: false, error: 'Record must include p=none, p=quarantine, or p=reject.' };
  }
  return { valid: true, error: null };
}

/**
 * Check DKIM: record should look like a DKIM key (v=DKIM1 or k=rsa; ... or contains p= for public key).
 */
function validateDkimRecord(record: string | null): { valid: boolean; error: string | null } {
  if (!record || !record.trim()) {
    return { valid: false, error: 'No DKIM record found.' };
  }
  const lower = record.toLowerCase();
  const hasDkim1 = lower.includes('v=dkim1');
  const hasK = lower.includes('k=rsa') || lower.includes('k=ed25519');
  const hasP = lower.includes('p=');
  if (hasDkim1 || hasK || hasP) {
    return { valid: true, error: null };
  }
  return { valid: false, error: 'Record does not look like a valid DKIM key (expect v=DKIM1, k=, or p=).' };
}

function buildDmarcMissingDetail(hostname: string, dnsErrorCode: string | null): {
  error: string;
  suggestion: string;
} {
  const reason = describeDnsError(dnsErrorCode);
  const error = reason
    ? `No DMARC record found at ${hostname}. ${reason}`
    : `No DMARC record found at ${hostname}.`;
  const suggestion =
    `Add a TXT record at ${hostname} with v=DMARC1 and a policy (e.g. p=none, p=quarantine, or p=reject). Example: v=DMARC1; p=none;`;
  return { error, suggestion };
}

function buildDkimMissingDetail(hostname: string, dnsErrorCode: string | null): {
  error: string;
  suggestion: string;
} {
  const reason = describeDnsError(dnsErrorCode);
  const error = reason
    ? `No DKIM record found at ${hostname}. ${reason}`
    : `No DKIM record found at ${hostname}.`;
  const suggestion =
    `Add a TXT record at ${hostname} with your provider's DKIM public key (e.g. copy the value from Brevo, SendGrid, or your ESP). The record should contain v=DKIM1 and p= (public key).`;
  return { error, suggestion };
}

/**
 * Run DNS checks for DMARC and DKIM on a domain.
 * @param domain - e.g. example.com (no _dmarc or _domainkey)
 * @param dkimSelector - e.g. mail, brevo, sendinblue (used as <selector>._domainkey.<domain>)
 */
export async function checkDomainAuth(
  domain: string,
  dkimSelector: string,
): Promise<DomainAuthCheckResult> {
  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedSelector = dkimSelector.trim().toLowerCase() || 'mail';

  if (!isValidDomain(normalizedDomain)) {
    const err = 'Invalid domain format.';
    return {
      dmarc: {
        present: false,
        valid: false,
        record: null,
        error: err,
        lookupHostname: '',
        dnsErrorCode: null,
        suggestion: null,
      },
      dkim: {
        present: false,
        valid: false,
        record: null,
        error: err,
        lookupHostname: '',
        dnsErrorCode: null,
        suggestion: null,
      },
    };
  }

  const dmarcHost = `_dmarc.${normalizedDomain}`;
  const dkimHost = `${normalizedSelector}._domainkey.${normalizedDomain}`;

  const [dmarcResult, dkimResult] = await Promise.all([
    resolveTxt(dmarcHost),
    resolveTxt(dkimHost),
  ]);

  const dmarcValidation = validateDmarcRecord(dmarcResult.value);
  const dkimValidation = validateDkimRecord(dkimResult.value);

  const dmarcPresent = !!dmarcResult.value;
  const dkimPresent = !!dkimResult.value;

  return {
    dmarc: {
      present: dmarcPresent,
      valid: dmarcValidation.valid,
      record: dmarcResult.value,
      error: dmarcPresent ? dmarcValidation.error : buildDmarcMissingDetail(dmarcHost, dmarcResult.dnsErrorCode).error,
      lookupHostname: dmarcHost,
      dnsErrorCode: dmarcPresent ? null : dmarcResult.dnsErrorCode,
      suggestion: dmarcPresent ? null : buildDmarcMissingDetail(dmarcHost, dmarcResult.dnsErrorCode).suggestion,
    },
    dkim: {
      present: dkimPresent,
      valid: dkimValidation.valid,
      record: dkimResult.value,
      error: dkimPresent ? dkimValidation.error : buildDkimMissingDetail(dkimHost, dkimResult.dnsErrorCode).error,
      lookupHostname: dkimHost,
      dnsErrorCode: dkimPresent ? null : dkimResult.dnsErrorCode,
      suggestion: dkimPresent ? null : buildDkimMissingDetail(dkimHost, dkimResult.dnsErrorCode).suggestion,
    },
  };
}
