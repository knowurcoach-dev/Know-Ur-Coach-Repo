import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  generateAndStoreOtp,
  verifyOtp,
  checkOtpRateLimit,
  checkIpRateLimit,
  clearOtp,
} from '@/lib/otp';

describe('Phase 17: OTP Verification, Rate Limiting & Security Lockout Tests', () => {
  const testEmail = 'parent.testing@example.com';

  beforeEach(() => {
    clearOtp(testEmail);
  });

  describe('generateAndStoreOtp() & verifyOtp() Happy Path', () => {
    it('should generate a 6-digit numeric OTP and verify it successfully', () => {
      const code = generateAndStoreOtp(testEmail, 'PARENT');

      assert.strictEqual(typeof code, 'string');
      assert.strictEqual(code.length, 6);
      assert.match(code, /^\d{6}$/);

      const verification = verifyOtp(testEmail, code);
      assert.strictEqual(verification.valid, true);
      assert.strictEqual(verification.role, 'PARENT');
    });

    it('should normalize email to lowercase during generation and verification', () => {
      const code = generateAndStoreOtp('Parent.CamelCase@Example.COM', 'COACH');
      const verification = verifyOtp('parent.camelcase@example.com', code);

      assert.strictEqual(verification.valid, true);
      assert.strictEqual(verification.role, 'COACH');
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should immediately purge OTP after successful verification so it cannot be reused', () => {
      const code = generateAndStoreOtp(testEmail, 'PARENT');

      // First verification succeeds
      const first = verifyOtp(testEmail, code);
      assert.strictEqual(first.valid, true);

      // Replay attempt with same code must fail
      const replay = verifyOtp(testEmail, code);
      assert.strictEqual(replay.valid, false);
      assert.strictEqual(replay.error, 'No active OTP found. Please request a new verification code.');
    });
  });

  describe('Brute-Force Lockout & Failed Attempts Invalidation', () => {
    it('should decrement remaining attempts on incorrect code entry', () => {
      generateAndStoreOtp(testEmail, 'PARENT');

      const attempt1 = verifyOtp(testEmail, '000000');
      assert.strictEqual(attempt1.valid, false);
      assert.strictEqual(attempt1.error, 'Incorrect verification code. (4 attempts remaining)');

      const attempt2 = verifyOtp(testEmail, '111111');
      assert.strictEqual(attempt2.valid, false);
      assert.strictEqual(attempt2.error, 'Incorrect verification code. (3 attempts remaining)');
    });

    it('should completely invalidate OTP after 5 consecutive incorrect attempts', () => {
      generateAndStoreOtp(testEmail, 'PARENT');

      // 4 wrong attempts
      verifyOtp(testEmail, '000001');
      verifyOtp(testEmail, '000002');
      verifyOtp(testEmail, '000003');
      verifyOtp(testEmail, '000004');

      // 5th wrong attempt triggers security lockout
      const attempt5 = verifyOtp(testEmail, '000005');
      assert.strictEqual(attempt5.valid, false);
      assert.ok(
        attempt5.error?.includes('Too many incorrect attempts. This verification code has been invalidated for security.')
      );

      // 6th attempt shows no active OTP
      const attempt6 = verifyOtp(testEmail, '000006');
      assert.strictEqual(attempt6.error, 'No active OTP found. Please request a new verification code.');
    });
  });

  describe('checkOtpRateLimit() Cooldown Enforcement', () => {
    it('should allow initial OTP request', () => {
      const check = checkOtpRateLimit(testEmail);
      assert.strictEqual(check.allowed, true);
    });

    it('should block rapid successive request within 30s cooldown', () => {
      generateAndStoreOtp(testEmail, 'PARENT');

      const immediateCheck = checkOtpRateLimit(testEmail);
      assert.strictEqual(immediateCheck.allowed, false);
      assert.ok(immediateCheck.error?.includes('before requesting a new verification code'));
    });
  });

  describe('checkIpRateLimit() IP Quota Limiter', () => {
    it('should always allow localhost IPs (127.0.0.1 and ::1) without rate limiting', () => {
      for (let i = 0; i < 30; i++) {
        assert.strictEqual(checkIpRateLimit('127.0.0.1').allowed, true);
        assert.strictEqual(checkIpRateLimit('::1').allowed, true);
      }
    });

    it('should block external IP after exceeding hourly limit (20 requests)', () => {
      const testIp = '198.51.100.42';

      // First 20 allowed
      for (let i = 0; i < 20; i++) {
        assert.strictEqual(checkIpRateLimit(testIp).allowed, true);
      }

      // 21st request blocked
      const blocked = checkIpRateLimit(testIp);
      assert.strictEqual(blocked.allowed, false);
      assert.ok(blocked.error?.includes('Too many verification requests from this network'));
    });
  });
});
