import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkDomainAuth } from './domainAuthService.js';

// Hoisted mock for dns.promises.resolveTxt so tests are deterministic and
// never depend on the real DNS state for example.com.
const resolveTxtMock = vi.hoisted(() => vi.fn<(hostname: string) => Promise<string[][]>>());

vi.mock('dns', () => ({
  // Some environments expect a default export for Node built-ins.
  default: {},
  promises: {
    resolveTxt: resolveTxtMock,
  },
}));

describe('domainAuthService', () => {
  describe('checkDomainAuth', () => {
    beforeEach(() => {
      resolveTxtMock.mockReset();
    });

    it('returns invalid for empty/invalid domain without calling DNS', async () => {
      const result = await checkDomainAuth('', 'mail');
      expect(result.dmarc.present).toBe(false);
      expect(result.dmarc.valid).toBe(false);
      expect(result.dmarc.error).toBe('Invalid domain format.');
      expect(result.dmarc.lookupHostname).toBe('');
      expect(result.dmarc.suggestion).toBeNull();
      expect(result.dkim.present).toBe(false);
      expect(result.dkim.valid).toBe(false);
      expect(result.dkim.error).toBe('Invalid domain format.');
      expect(result.dkim.lookupHostname).toBe('');
      expect(result.dkim.suggestion).toBeNull();

      // No DNS lookups should be performed for invalid domains.
      expect(resolveTxtMock).not.toHaveBeenCalled();
    });

    it('returns invalid for domain starting with dot', async () => {
      const result = await checkDomainAuth('.example.com', 'mail');
      expect(result.dmarc.present).toBe(false);
      expect(result.dmarc.error).toBe('Invalid domain format.');
      expect(resolveTxtMock).not.toHaveBeenCalled();
    });

    it('returns lookupHostname and suggestion when DKIM record is missing', async () => {
      // For a valid domain, the service will query both _dmarc.<domain> and
      // <selector>._domainkey.<domain>. We simulate:
      // - DMARC present and valid
      // - DKIM missing (no TXT records)
      resolveTxtMock.mockImplementation(async (hostname: string) => {
        if (hostname.startsWith('_dmarc.')) {
          // DMARC record present
          return [['v=DMARC1; p=none']];
        }
        if (hostname.includes('._domainkey.')) {
          // No DKIM TXT records at this hostname
          return [];
        }
        return [];
      });

      const result = await checkDomainAuth('example.com', 'mail');
      expect(result.dkim.lookupHostname).toBe('mail._domainkey.example.com');
      expect(result.dkim.present).toBe(false);
      expect(result.dkim.error).toContain('mail._domainkey.example.com');
      expect(result.dkim.suggestion).toBeTruthy();
      expect(result.dkim.suggestion).toMatch(/TXT record/);
      expect(result.dkim.suggestion).toMatch(/DKIM/);
    });
  });
});
