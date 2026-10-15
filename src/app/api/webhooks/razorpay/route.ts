import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { EscrowStatus, PassType } from '@prisma/client';
import { getPaymentSettings, getActiveRazorpayCredentials } from '@/lib/payments';
import { logAdminAction } from '@/lib/audit';

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  notes?: {
    bookingId?: string;
    centreId?: string;
    batchId?: string;
    competitionId?: string;
    childId?: string;
    parentId?: string;
    passType?: PassType;
    planTier?: string;
    billingCycle?: string;
    academyName?: string;
  };
  contact?: string;
  email?: string;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
      };
    };
  };
  created_at: number;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const paymentSettings = await getPaymentSettings();
    const creds = await getActiveRazorpayCredentials();

    const webhookSecret =
      paymentSettings.webhookSecret ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      creds.keySecret;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Missing webhookSecret configuration.');
      return NextResponse.json(
        { error: 'Webhook secret not configured on server' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header on incoming webhook.');
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isMatch =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!isMatch) {
      console.warn('[Razorpay Webhook] Webhook signature mismatch.');
      return NextResponse.json(
        { error: 'Invalid Razorpay webhook signature' },
        { status: 401 }
      );
    }

    const body: RazorpayWebhookPayload = JSON.parse(rawBody);
    const { event, payload } = body;

    // Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payment?.entity;
      if (!payment) {
        return NextResponse.json(
          { error: 'Payment entity missing in webhook payload' },
          { status: 400 }
        );
      }

      const notes = payment.notes || {};
      const targetBookingId = notes.bookingId;
      const netPaidInRupees = payment.amount / 100;

      // Generate verified pass ID: KUC-AGRA-2026-XXXX
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const generatedPassId = `KUC-AGRA-2026-${randomCode}`;

      let updatedBooking = null;

      if (targetBookingId) {
        // Update existing booking record
        try {
          updatedBooking = await prisma.booking.update({
            where: { id: targetBookingId },
            data: {
              escrowStatus: EscrowStatus.HELD,
              passId: generatedPassId,
              netAmountPaid: netPaidInRupees,
            },
          });
        } catch (dbError) {
          console.warn('[Razorpay Webhook] Booking not found by id, creating entry fallback', dbError);
        }
      }

      // If no booking existed yet or DB lookup fallback
      if (!updatedBooking && notes.parentId && notes.childId) {
        try {
          updatedBooking = await prisma.booking.create({
            data: {
              passId: generatedPassId,
              passType: notes.passType || PassType.MONTHLY_BATCH,
              parentId: notes.parentId,
              childId: notes.childId,
              coachingCentreId: notes.centreId,
              batchId: notes.batchId,
              competitionId: notes.competitionId,
              grossAmount: netPaidInRupees,
              creditApplied: 0,
              netAmountPaid: netPaidInRupees,
              escrowStatus: EscrowStatus.HELD,
            },
          });
        } catch (createErr) {
          console.error('[Razorpay Webhook] Error creating booking entry', createErr);
        }
      }

      // If payment is for a Coach / Academy Subscription Plan
      if (notes.centreId && notes.planTier) {
        try {
          const planTier = notes.planTier as any;
          const billingCycle = (notes.billingCycle as any) || 'monthly';
          const durationDays = billingCycle === 'annual' ? 365 : 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

          const updatedCentre = await prisma.coachingCentre.update({
            where: { id: notes.centreId },
            data: {
              planTier,
              isTopInArea: planTier === 'PREMIUM',
              planPaymentId: payment.id,
              planPurchasedAt: new Date(),
              planExpiresAt: expiresAt,
              planBillingCycle: billingCycle,
            },
            include: { owner: true },
          });

          // Log / update PaymentTransaction
          const orderIdToMatch = payment.order_id || `order_wh_${payment.id}`;
          await prisma.paymentTransaction.upsert({
            where: { orderId: orderIdToMatch },
            update: {
              status: 'SUCCESS',
              paymentId: payment.id,
              amount: netPaidInRupees,
              planTier,
              billingCycle,
              isTestMode: paymentSettings.isTestMode,
              paymentMethod: payment.method || 'razorpay',
              notes: notes as any,
              rawResponse: body as any,
            },
            create: {
              orderId: orderIdToMatch,
              paymentId: payment.id,
              coachingCentreId: notes.centreId,
              userId: updatedCentre.ownerUserId,
              planTier,
              billingCycle,
              amount: netPaidInRupees,
              currency: payment.currency || 'INR',
              status: 'SUCCESS',
              isTestMode: paymentSettings.isTestMode,
              paymentMethod: payment.method || 'razorpay',
              notes: notes as any,
              rawResponse: body as any,
            },
          });

          // Create notification for coach
          if (updatedCentre.ownerUserId) {
            const tierName = planTier === 'PREMIUM' ? 'Verified Pro Partner' : 'Standard Partner';
            await prisma.notification.create({
              data: {
                userId: updatedCentre.ownerUserId,
                title: `Subscription Activated: ${tierName} 🚀`,
                message: `Your ${tierName} subscription (${billingCycle}) is active via Razorpay Webhook. Payment Ref: ${payment.id}.`,
                type: 'subscription',
              },
            }).catch(() => null);
          }

          // Create admin audit log
          await logAdminAction({
            actorEmail: updatedCentre.owner?.email || 'system-webhook@razorpay.com',
            actorRole: 'SYSTEM',
            action: 'COACH_PLAN_WEBHOOK_CAPTURED',
            targetModel: 'CoachingCentre',
            targetId: notes.centreId,
            details: {
              paymentId: payment.id,
              orderId: payment.order_id,
              planTier,
              billingCycle,
              amount: netPaidInRupees,
              isTestMode: paymentSettings.isTestMode,
              event,
            },
          });

          return NextResponse.json({
            success: true,
            message: `Coach subscription activated for centre ${notes.centreId}`,
            event,
            paymentId: payment.id,
            planTier,
            billingCycle,
          });
        } catch (planErr) {
          console.error('[Razorpay Webhook] Error updating coach subscription plan', planErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and escrow locked in HELD status',
        event,
        paymentId: payment.id,
        passId: updatedBooking?.passId || generatedPassId,
        escrowStatus: EscrowStatus.HELD,
        amount: netPaidInRupees,
      });
    }

    return NextResponse.json({
      received: true,
      event,
      status: 'unhandled_event',
    });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
