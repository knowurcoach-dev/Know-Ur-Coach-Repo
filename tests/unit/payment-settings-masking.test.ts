import { describe, it } from 'node:test';
import assert from 'node:assert';
import { maskSecret } from '@/lib/payments';

describe('Phase 31: Payment Settings Key Masking & Form Resubmission Safety Tests', () => {
  describe('maskSecret() Secret Masking Function', () => {
    it('should return empty string for null, undefined, or empty secret and 8 bullets for whitespace', () => {
      assert.strictEqual(maskSecret(null), '');
      assert.strictEqual(maskSecret(undefined), '');
      assert.strictEqual(maskSecret(''), '');
      assert.strictEqual(maskSecret('   '), '••••••••'); // trimmed length 0 <= 6
    });

    it('should return 8 bullets for short secrets under 6 characters', () => {
      assert.strictEqual(maskSecret('123'), '••••••••');
      assert.strictEqual(maskSecret('secret'), '••••••••');
    });

    it('should preserve first 4 and last 4 characters while masking the middle with bullets', () => {
      const liveSecret = '8O1t77GVUE7WntTbfv3k4jkF';
      const masked = maskSecret(liveSecret);

      assert.ok(masked.startsWith('8O1t'));
      assert.ok(masked.endsWith('4jkF'));
      assert.ok(masked.includes('••••'));
      assert.strictEqual(masked.length, liveSecret.length);
    });
  });

  describe('Form Resubmission Bullet Protection Engine', () => {
    // Replicating updatePaymentSettings data sanitization from payments.ts
    function sanitizePaymentUpdatePayload(
      currentDbState: {
        testSecret: string;
        liveSecret: string;
      },
      formInput: {
        testSecret?: string;
        liveSecret?: string;
      }
    ) {
      const updateData: { testSecret?: string; liveSecret?: string } = {};

      if (
        formInput.testSecret !== undefined &&
        formInput.testSecret.trim() !== '' &&
        !formInput.testSecret.includes('•') // Must not be masked placeholder!
      ) {
        updateData.testSecret = formInput.testSecret.trim();
      }

      if (
        formInput.liveSecret !== undefined &&
        formInput.liveSecret.trim() !== '' &&
        !formInput.liveSecret.includes('•') // Must not be masked placeholder!
      ) {
        updateData.liveSecret = formInput.liveSecret.trim();
      }

      return {
        ...currentDbState,
        ...updateData,
      };
    }

    it('should ignore masked placeholder when admin saves form without changing secret', () => {
      const currentDb = {
        testSecret: 'real_test_secret_12345',
        liveSecret: 'real_live_secret_67890',
      };

      // Admin resubmits the form where secret fields contain masked bullets
      const updated = sanitizePaymentUpdatePayload(currentDb, {
        testSecret: 'real••••••••2345',
        liveSecret: 'real••••••••7890',
      });

      // Existing real secrets MUST NOT be corrupted with bullet placeholders!
      assert.strictEqual(updated.testSecret, 'real_test_secret_12345');
      assert.strictEqual(updated.liveSecret, 'real_live_secret_67890');
    });

    it('should update secret when admin provides a genuine new unmasked secret string', () => {
      const currentDb = {
        testSecret: 'old_secret_111',
        liveSecret: 'old_secret_222',
      };

      const updated = sanitizePaymentUpdatePayload(currentDb, {
        testSecret: 'new_brand_secret_99999', // Fresh genuine key
      });

      assert.strictEqual(updated.testSecret, 'new_brand_secret_99999');
      assert.strictEqual(updated.liveSecret, 'old_secret_222');
    });
  });

  describe('Active Credentials Mode Resolver', () => {
    function resolveActiveCredentials(settings: {
      isTestMode: boolean;
      testKey: string;
      testSecret: string;
      liveKey: string;
      liveSecret: string;
    }) {
      if (settings.isTestMode) {
        return {
          keyId: settings.testKey,
          keySecret: settings.testSecret,
          mode: 'test',
          isTestMode: true,
        };
      }
      return {
        keyId: settings.liveKey,
        keySecret: settings.liveSecret,
        mode: 'live',
        isTestMode: false,
      };
    }

    it('should select test credentials when isTestMode is true', () => {
      const creds = resolveActiveCredentials({
        isTestMode: true,
        testKey: 'rzp_test_KEY1',
        testSecret: 'test_sec_1',
        liveKey: 'rzp_live_KEY2',
        liveSecret: 'live_sec_2',
      });

      assert.strictEqual(creds.mode, 'test');
      assert.strictEqual(creds.keyId, 'rzp_test_KEY1');
      assert.strictEqual(creds.isTestMode, true);
    });

    it('should switch to live credentials when isTestMode is toggled to false', () => {
      const creds = resolveActiveCredentials({
        isTestMode: false,
        testKey: 'rzp_test_KEY1',
        testSecret: 'test_sec_1',
        liveKey: 'rzp_live_KEY2',
        liveSecret: 'live_sec_2',
      });

      assert.strictEqual(creds.mode, 'live');
      assert.strictEqual(creds.keyId, 'rzp_live_KEY2');
      assert.strictEqual(creds.isTestMode, false);
    });
  });
});
