import { describe, it, expect } from 'vitest';
import { checkDomainAuth } from './domainAuthService.js';

describe('domainAuthService', () => {
  describe('checkDomainAuth', () => {
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
    });

    it('returns invalid for domain starting with dot', async () => {
      const result = await checkDomainAuth('.example.com', 'mail');
      expect(result.dmarc.present).toBe(false);
      expect(result.dmarc.error).toBe('Invalid domain format.');
    });

    it('returns lookupHostname and suggestion when DKIM record is missing', async () => {
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
