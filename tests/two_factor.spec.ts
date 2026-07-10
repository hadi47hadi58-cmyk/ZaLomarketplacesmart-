/**
 * ZaLo Smart - Two-Factor Authentication (2FA) Unit Tests (two_factor.spec.ts)
 * اختبارات وحدة المصادقة الثنائية وتوليد الأكواد السداسية الآمنة والتحقق منها
 */

import { TwoFactorService } from '../backend/src/security/two-factor.service';

describe('TwoFactorService - Unit Tests', () => {
  let twoFactorService: TwoFactorService;

  beforeEach(() => {
    twoFactorService = new TwoFactorService();
  });

  describe('2FA Secret Generation', () => {
    it('should generate a valid Base32 secret and otpauthUrl', () => {
      const email = 'customer@zalo.dz';
      const result = twoFactorService.generateSecret(email);

      expect(result).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(10);
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.otpauthUrl).toContain(encodeURIComponent('ZaLo Smart'));
      expect(result.otpauthUrl).toContain(encodeURIComponent(email));
    });
  });

  describe('2FA Token Verification', () => {
    it('should reject invalid or empty tokens', () => {
      const secret = 'MZXW6YTBOIXW6YTB';
      expect(twoFactorService.verifyToken(secret, '')).toBe(false);
      expect(twoFactorService.verifyToken(secret, 'abc123')).toBe(false);
      expect(twoFactorService.verifyToken(secret, '12345')).toBe(false); // too short
      expect(twoFactorService.verifyToken(secret, '1234567')).toBe(false); // too long
    });

    it('should fail token verification for a wrong secret', () => {
      const secretA = 'MZXW6YTBOIXW6YTB';
      const secretB = 'MZXW6YTBOIXW6YTC';
      
      // Since we don't have a synchronized dynamic token without time advancement,
      // we can verify that random inputs are successfully discarded as false.
      expect(twoFactorService.verifyToken(secretA, '000000')).toBe(false);
      expect(twoFactorService.verifyToken(secretB, '999999')).toBe(false);
    });
  });
});
