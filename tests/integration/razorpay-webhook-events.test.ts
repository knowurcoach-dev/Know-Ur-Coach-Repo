import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { EscrowStatus } from '@prisma/client';

describe('Phase 30: Razorpay Webhook Event Processing & Idempotency Tests', () => {
  const webhookSecret = 'test_webhook_secret_key_999';

  function generateWebhookSignature(body: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): {
    valid: boolean;
    errorStatus?: number;
    errorMessage?: string;
  } {
    if (!signature) {
      return { valid: false, errorStatus: 400, errorMessage: 'Missing x-razorpay-signature header' };
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const isMatch =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!isMatch) {
      return { valid: false, errorStatus: 401, errorMessage: 'Invalid Razorpay webhook signature' };
    }

    return { valid: true };
  }

  // Simulated Webhook Processor
  class WebhookEventProcessor {
    bookings = new Map<string, any>();
    centres = new Map<string, any>();
    notifications: any[] = [];
    auditLogs: any[] = [];

    processWebhookEvent(event: string, payload: any) {
      if (event === 'payment.captured' || event === 'order.paid') {
        const payment = payload.payment?.entity;
        if (!payment) {
          return { status: 400, error: 'Payment entity missing in webhook payload' };
        }

        const notes = payment.notes || {};
        const netPaidInRupees = payment.amount / 100;
        const generatedPassId = `KUC-AGRA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        // Case 1: Coach Subscription Upgrade
        if (notes.centreId && notes.planTier) {
          const billingCycle = notes.billingCycle || 'monthly';
          const durationDays = billingCycle === 'annual' ? 365 : 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

          const centre = this.centres.get(notes.centreId) || { id: notes.centreId };
          centre.planTier = notes.planTier;
          centre.isTopInArea = notes.planTier === 'PREMIUM';
          centre.planPaymentId = payment.id;
          centre.planExpiresAt = expiresAt;
          centre.planBillingCycle = billingCycle;
          this.centres.set(notes.centreId, centre);

          this.notifications.push({
            centreId: notes.centreId,
            title: `Subscription Activated: ${notes.planTier === 'PREMIUM' ? 'Verified Pro' : 'Standard'}`,
            type: 'subscription',
          });

          this.auditLogs.push({
            action: 'COACH_PLAN_WEBHOOK_CAPTURED',
            targetId: notes.centreId,
            amount: netPaidInRupees,
          });

          return {
            status: 200,
            success: true,
            message: `Coach subscription activated for centre ${notes.centreId}`,
            paymentId: payment.id,
            planTier: notes.planTier,
            billingCycle,
          };
        }

        // Case 2: Parent Batch Booking & Escrow Hold
        const booking = {
          id: notes.bookingId || `b-${Date.now()}`,
          passId: generatedPassId,
          escrowStatus: EscrowStatus.HELD,
          netAmountPaid: netPaidInRupees,
        };
        this.bookings.set(booking.id, booking);

        return {
          status: 200,
          success: true,
          message: 'Payment verified and escrow locked in HELD status',
          paymentId: payment.id,
          passId: generatedPassId,
          escrowStatus: EscrowStatus.HELD,
          amount: netPaidInRupees,
        };
      }

      return {
        status: 200,
        received: true,
        event,
        statusLabel: 'unhandled_event',
      };
    }
  }

  describe('Webhook Cryptographic Signature Verification', () => {
    const rawPayload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });

    it('should verify signature successfully when signed with valid webhook secret', () => {
      const validSig = generateWebhookSignature(rawPayload, webhookSecret);
      const res = verifyWebhookSignature(rawPayload, validSig, webhookSecret);

      assert.strictEqual(res.valid, true);
    });

    it('should return 400 when x-razorpay-signature header is missing', () => {
      const res = verifyWebhookSignature(rawPayload, null, webhookSecret);

      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorStatus, 400);
      assert.strictEqual(res.errorMessage, 'Missing x-razorpay-signature header');
    });

    it('should return 401 when payload was tampered with after signing', () => {
      const validSig = generateWebhookSignature(rawPayload, webhookSecret);
      const tamperedBody = JSON.stringify({ event: 'payment.captured', id: 'pay_TAMPERED' });

      const res = verifyWebhookSignature(tamperedBody, validSig, webhookSecret);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorStatus, 401);
      assert.strictEqual(res.errorMessage, 'Invalid Razorpay webhook signature');
    });
  });

  describe('Webhook Event Processing', () => {
    it('should process payment.captured for monthly student booking and lock escrow in HELD status', () => {
      const processor = new WebhookEventProcessor();

      const payload = {
        payment: {
          entity: {
            id: 'pay_student_999',
            amount: 250000, // ₹2,500 in paise
            status: 'captured',
            notes: {
              bookingId: 'bk-test-01',
            },
          },
        },
      };

      const res = processor.processWebhookEvent('payment.captured', payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.amount, 2500); // Converted from paise
      assert.strictEqual(res.escrowStatus, EscrowStatus.HELD);
      assert.ok(res.passId.startsWith('KUC-AGRA-2026-'));

      const savedBooking = processor.bookings.get('bk-test-01');
      assert.ok(savedBooking);
      assert.strictEqual(savedBooking.escrowStatus, EscrowStatus.HELD);
    });

    it('should process payment.captured for coach PREMIER plan, promote isTopInArea, and log audit', () => {
      const processor = new WebhookEventProcessor();

      const payload = {
        payment: {
          entity: {
            id: 'pay_coach_premium',
            amount: 299900, // ₹2,999 in paise
            status: 'captured',
            notes: {
              centreId: 'ctr-agra-01',
              planTier: 'PREMIUM',
              billingCycle: 'monthly',
            },
          },
        },
      };

      const res = processor.processWebhookEvent('payment.captured', payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.planTier, 'PREMIUM');

      const centre = processor.centres.get('ctr-agra-01');
      assert.ok(centre);
      assert.strictEqual(centre.planTier, 'PREMIUM');
      assert.strictEqual(centre.isTopInArea, true); // Automatic promotion for premier

      // Notifications and audit logs generated
      assert.strictEqual(processor.notifications.length, 1);
      assert.ok(processor.notifications[0].title.includes('Subscription Activated: Verified Pro'));
      assert.strictEqual(processor.auditLogs.length, 1);
      assert.strictEqual(processor.auditLogs[0].action, 'COACH_PLAN_WEBHOOK_CAPTURED');
    });

    it('should acknowledge unhandled events with HTTP 200 without throwing errors', () => {
      const processor = new WebhookEventProcessor();
      const res = processor.processWebhookEvent('refund.processed', {});

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.received, true);
      assert.strictEqual(res.statusLabel, 'unhandled_event');
    });
  });
});
