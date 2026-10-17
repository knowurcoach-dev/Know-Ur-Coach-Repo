import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPaymentSettings, recordFailedPayment, verifyAndActivateSubscription } from '@/lib/payments';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const settings = await getPaymentSettings();
    const webhookSecret = settings?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Missing webhookSecret configuration.');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured on server' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header on incoming webhook.');
      return NextResponse.json(
        { success: false, error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // Verify cryptographic HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isSignatureValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!isSignatureValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    console.log(`[Razorpay Webhook] Processing event: ${event}, order: ${orderId}, payment: ${paymentId}`);

    // Handle payment failure event
    if (event === 'payment.failed') {
      const errorDetails = paymentEntity?.error_code ? {
        code: paymentEntity.error_code,
        description: paymentEntity.error_description || 'Payment failed',
        reason: paymentEntity.error_reason,
        source: paymentEntity.error_source,
        step: paymentEntity.error_step,
      } : {
        code: 'PAYMENT_FAILED',
        description: 'Payment failed at gateway',
      };

      await recordFailedPayment({
        orderId,
        paymentId,
        errorCode: errorDetails.code,
        errorDescription: errorDetails.description,
        errorReason: errorDetails.reason,
        errorSource: errorDetails.source,
        errorStep: errorDetails.step,
        rawError: payload,
        notes: { webhookEvent: event },
      });

      return NextResponse.json({ success: true, processed: true, event });
    }

    // Handle successful payment capture / order paid
    if (event === 'payment.captured' || event === 'order.paid') {
      if (orderId) {
        const tx = await prisma.paymentTransaction.findFirst({
          where: { orderId },
        });

        if (tx && tx.status !== 'SUCCESS') {
          await prisma.paymentTransaction.update({
            where: { id: tx.id },
            data: {
              status: 'SUCCESS',
              paymentId: paymentId || tx.paymentId,
              rawResponse: payload,
              updatedAt: new Date(),
            },
          });

          // If linked centre exists, ensure subscription is active
          if (tx.coachingCentreId && tx.planTier) {
            const durationDays = tx.billingCycle === 'annual' ? 365 : 30;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            await prisma.coachingCentre.update({
              where: { id: tx.coachingCentreId },
              data: {
                planTier: tx.planTier,
                isTopInArea: tx.planTier === 'PREMIUM',
                planPaymentId: paymentId || tx.paymentId,
                planPurchasedAt: now,
                planExpiresAt: expiresAt,
                planBillingCycle: tx.billingCycle || 'monthly',
              },
            }).catch(() => null);
          }
        }
      }

      await logAdminAction({
        actorEmail: 'system@knowurcoach.in',
        actorRole: 'SYSTEM',
        action: 'WEBHOOK_PAYMENT_CAPTURED',
        targetModel: 'PaymentTransaction',
        targetId: orderId || paymentId || 'webhook-capture',
        details: { event, orderId, paymentId },
      }).catch(() => null);

      return NextResponse.json({ success: true, processed: true, event });
    }

    // Handle payment authorized
    if (event === 'payment.authorized') {
      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { orderId },
          data: {
            status: 'PENDING',
            paymentId: paymentId || undefined,
            rawResponse: payload,
            updatedAt: new Date(),
          },
        }).catch(() => null);
      }
      return NextResponse.json({ success: true, processed: true, event });
    }

    return NextResponse.json({ success: true, ignored: true, event });
  } catch (error: any) {
    console.error('[WEBHOOK_ERROR] Razorpay webhook processing failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
