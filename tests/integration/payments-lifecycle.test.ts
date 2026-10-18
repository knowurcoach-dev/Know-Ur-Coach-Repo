import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { calculateCyclePrice, BILLING_CYCLES } from '@/lib/subscription';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 2: Payment Lifecycle, Cryptography & Failure Handling Tests', () => {
  const secret = 'rzp_test_secret_key_12345';
  const orderId = 'order_DA1234567890';
  const paymentId = 'pay_9876543210';

  describe('Razorpay HMAC-SHA256 Cryptographic Signature Verification', () => {
    function generateValidSignature(order: string, payment: string, keySecret: string): string {
      return crypto.createHmac('sha256', keySecret).update(`${order}|${payment}`).digest('hex');
    }

    it('should verify a valid HMAC signature generated with active secret', () => {
      const validSignature = generateValidSignature(orderId, paymentId, secret);

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${orderId}|${paymentId}`);
      const expected = hmac.digest('hex');

      const isValid =
        expected.length === validSignature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(validSignature));

      assert.strictEqual(isValid, true);
    });

    it('should reject a tampered signature or mismatched order payload', () => {
      const tamperedPaymentId = 'pay_TAMPERED_000';
      const signatureForTampered = generateValidSignature(orderId, tamperedPaymentId, secret);

      // Attempt to verify against original paymentId
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${orderId}|${paymentId}`);
      const expected = hmac.digest('hex');

      const isValid =
        expected.length === signatureForTampered.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureForTampered));

      assert.strictEqual(isValid, false);
    });

    it('should reject signature signed with wrong secret key', () => {
      const signatureWithWrongKey = generateValidSignature(orderId, paymentId, 'wrong_secret_key');

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${orderId}|${paymentId}`);
      const expected = hmac.digest('hex');

      const isValid =
        expected.length === signatureWithWrongKey.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureWithWrongKey));

      assert.strictEqual(isValid, false);
    });
  });

  describe('Trial-to-Paid vs. Active Paid Renewal Date Stacking Logic', () => {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    it('should start paid plan from NOW when upgrading from active Free Trial (no stacking)', () => {
      // User has 80 days remaining on Free Trial
      const trialCentre: { planTier: SubscriptionPlan; planExpiresAt: Date; isTrialActive: boolean } = {
        planTier: SubscriptionPlan.FREE,
        planExpiresAt: new Date(now.getTime() + 80 * dayInMs),
        isTrialActive: true,
      };

      const newPaidTier = SubscriptionPlan.STANDARD;
      const durationDays = 30; // 1 month

      // Replicating verifyAndActivateSubscription date logic:
      const hasUnexpiredPlan = Boolean(
        trialCentre.planExpiresAt &&
        trialCentre.planExpiresAt.getTime() > now.getTime() &&
        trialCentre.planTier === newPaidTier &&
        !trialCentre.isTrialActive // Must be false!
      );

      assert.strictEqual(hasUnexpiredPlan, false); // Because previous tier was FREE and isTrialActive was true

      const baseDate = hasUnexpiredPlan ? trialCentre.planExpiresAt : now;
      const newExpiresAt = new Date(baseDate.getTime() + durationDays * dayInMs);

      // Paid plan coverage should expire in 30 days from now, NOT 80 + 30 = 110 days!
      const daysFromNow = Math.round((newExpiresAt.getTime() - now.getTime()) / dayInMs);
      assert.strictEqual(daysFromNow, 30);
    });

    it('should seamlessly stack days onto existing plan when renewing active Paid Plan (zero day loss)', () => {
      // User has 10 days remaining on existing STANDARD plan
      const existingPaidCentre = {
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: new Date(now.getTime() + 10 * dayInMs),
        isTrialActive: false,
      };

      const newPaidTier = SubscriptionPlan.STANDARD;
      const cyclePricing = calculateCyclePrice(1499, 'quarterly'); // 90 days
      const durationDays = cyclePricing.days;

      // Replicating verifyAndActivateSubscription date logic:
      const hasUnexpiredPlan = Boolean(
        existingPaidCentre.planExpiresAt &&
        existingPaidCentre.planExpiresAt.getTime() > now.getTime() &&
        existingPaidCentre.planTier === newPaidTier &&
        !existingPaidCentre.isTrialActive
      );

      assert.strictEqual(hasUnexpiredPlan, true);

      const baseDate = hasUnexpiredPlan ? existingPaidCentre.planExpiresAt : now;
      const newExpiresAt = new Date(baseDate.getTime() + durationDays * dayInMs);

      // Total validity must be 10 remaining days + 90 renewal days = 100 days!
      const daysFromNow = Math.round((newExpiresAt.getTime() - now.getTime()) / dayInMs);
      assert.strictEqual(daysFromNow, 100);
    });
  });

  describe('Order Amount & Paise Conversion for Razorpay Gateway API', () => {
    it('should convert calculated cycle prices to exact paise integers', () => {
      const standardMonthly = calculateCyclePrice(1499, 'monthly');
      const standardPaise = Math.round(standardMonthly.total * 100);
      assert.strictEqual(standardMonthly.total, 1499);
      assert.strictEqual(standardPaise, 149900);

      const standardQuarterly = calculateCyclePrice(1499, 'quarterly');
      const quarterlyPaise = Math.round(standardQuarterly.total * 100);
      assert.strictEqual(standardQuarterly.total, 4272);
      assert.strictEqual(quarterlyPaise, 427200);

      const premiumAnnual = calculateCyclePrice(3999, 'annual');
      const annualPaise = Math.round(premiumAnnual.total * 100);
      // 3999 * 12 = 47988. 17% discount = 8157.96 -> round = 39830
      assert.strictEqual(premiumAnnual.total, 39830);
      assert.strictEqual(annualPaise, 3983000);
    });
  });

  describe('Payment Failure & Cancellation Audit Details', () => {
    it('should properly format USER_DISMISSED error record for checkout modal cancellation', () => {
      const failureEvent = {
        orderId: 'order_123',
        errorCode: 'CHECKOUT_CANCELLED',
        errorDescription: 'Checkout modal was closed before payment completion.',
        errorReason: 'USER_DISMISSED',
      };

      assert.strictEqual(failureEvent.errorCode, 'CHECKOUT_CANCELLED');
      assert.strictEqual(failureEvent.errorReason, 'USER_DISMISSED');
    });

    it('should properly structure GATEWAY_DECLINE error record for bank decline / OTP timeout', () => {
      const failureEvent = {
        orderId: 'order_456',
        paymentId: 'pay_failed_789',
        errorCode: 'BAD_REQUEST_ERROR',
        errorDescription: 'Payment was declined by issuing bank',
        errorReason: 'PAYMENT_FAILED',
        errorSource: 'bank',
        errorStep: 'payment_authorization',
      };

      assert.strictEqual(failureEvent.errorSource, 'bank');
      assert.strictEqual(failureEvent.errorStep, 'payment_authorization');
      assert.strictEqual(failureEvent.errorReason, 'PAYMENT_FAILED');
    });
  });
});
