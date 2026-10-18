import { prisma } from '@/lib/prisma';
import { SubscriptionPlan } from '@prisma/client';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/audit';
import { calculateCyclePrice, BillingCycle } from '@/lib/subscription';

export interface MaskedPaymentSettings {
  id: string;
  isTestMode: boolean;
  razorpayTestKeyId: string;
  hasTestSecret: boolean;
  maskedTestSecret: string;
  razorpayLiveKeyId: string;
  hasLiveSecret: boolean;
  maskedLiveSecret: string;
  webhookSecret: string;
  hasWebhookSecret: boolean;
  updatedAt: Date | string;
}

export interface ActiveRazorpayCredentials {
  keyId: string;
  keySecret: string;
  mode: 'test' | 'live';
  isTestMode: boolean;
  webhookSecret?: string | null;
}

/**
 * Mask secret string for safe display in admin panel (e.g. 8O1t••••••••4jkF).
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return '';
  const trimmed = secret.trim();
  if (trimmed.length <= 6) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}${'•'.repeat(Math.max(8, trimmed.length - 8))}${suffix}`;
}

export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully ignore when executed outside Next.js request context (e.g. scripts or test workers)
  }
}

/**
 * Fetch or initialize PaymentSettings singleton from database.
 */
export async function getPaymentSettings() {
  try {
    let settings = await prisma.paymentSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.paymentSettings.create({
        data: {
          id: 'default',
          razorpayTestKeyId:
            process.env.RAZORPAY_KEY_ID || 'rzp_test_TllUCnsrU8NX1s',
          razorpayTestKeySecret:
            process.env.RAZORPAY_KEY_SECRET || '8O1t77GVUE7WntTbfv3k4jkF',
          razorpayLiveKeyId: process.env.RAZORPAY_LIVE_KEY_ID || null,
          razorpayLiveKeySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || null,
          isTestMode: true,
          webhookSecret:
            process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_agra',
        },
      });
    }

    return settings;
  } catch (error) {
    console.error('[DB_ERROR] Failed to fetch payment settings from database:', error);
    throw new Error('Database error: Unable to retrieve payment settings');
  }
}

/**
 * Returns masked payment settings safe to send to the admin browser.
 * NEVER returns raw secret keys to the client.
 */
export async function getMaskedPaymentSettings(): Promise<MaskedPaymentSettings> {
  const settings = await getPaymentSettings();

  return {
    id: settings.id,
    isTestMode: settings.isTestMode,
    razorpayTestKeyId: settings.razorpayTestKeyId || '',
    hasTestSecret: Boolean(settings.razorpayTestKeySecret),
    maskedTestSecret: maskSecret(settings.razorpayTestKeySecret),
    razorpayLiveKeyId: settings.razorpayLiveKeyId || '',
    hasLiveSecret: Boolean(settings.razorpayLiveKeySecret),
    maskedLiveSecret: maskSecret(settings.razorpayLiveKeySecret),
    webhookSecret: maskSecret(settings.webhookSecret),
    hasWebhookSecret: Boolean(settings.webhookSecret),
    updatedAt: settings.updatedAt,
  };
}

/**
 * Server-only helper to get the active Razorpay API credentials based on isTestMode.
 */
export async function getActiveRazorpayCredentials(): Promise<ActiveRazorpayCredentials> {
  const settings = await getPaymentSettings();
  const isTestMode = settings.isTestMode;

  if (isTestMode) {
    const keyId =
      settings.razorpayTestKeyId?.trim() ||
      process.env.RAZORPAY_KEY_ID?.trim() ||
      'rzp_test_TllUCnsrU8NX1s';
    const keySecret =
      settings.razorpayTestKeySecret?.trim() ||
      process.env.RAZORPAY_KEY_SECRET?.trim() ||
      '8O1t77GVUE7WntTbfv3k4jkF';

    return {
      keyId,
      keySecret,
      mode: 'test',
      isTestMode: true,
      webhookSecret: settings.webhookSecret,
    };
  } else {
    const keyId =
      settings.razorpayLiveKeyId?.trim() ||
      process.env.RAZORPAY_LIVE_KEY_ID?.trim() ||
      '';
    const keySecret =
      settings.razorpayLiveKeySecret?.trim() ||
      process.env.RAZORPAY_LIVE_KEY_SECRET?.trim() ||
      '';

    return {
      keyId,
      keySecret,
      mode: 'live',
      isTestMode: false,
      webhookSecret: settings.webhookSecret,
    };
  }
}

/**
 * Instantiates the Razorpay SDK using the currently active credentials.
 */
export async function createRazorpayInstance() {
  const creds = await getActiveRazorpayCredentials();

  if (!creds.keyId || !creds.keySecret) {
    throw new Error(
      `Razorpay ${creds.mode.toUpperCase()} credentials are not configured. Please configure Key ID and Key Secret in Admin Settings.`
    );
  }

  const razorpay = new Razorpay({
    key_id: creds.keyId,
    key_secret: creds.keySecret,
  });

  return { razorpay, ...creds };
}

/**
 * Updates payment gateway credentials in the database.
 * Only updates secrets if a real new value is provided (not mask placeholder).
 */
export async function updatePaymentSettings(
  data: {
    isTestMode?: boolean;
    razorpayTestKeyId?: string;
    razorpayTestKeySecret?: string;
    razorpayLiveKeyId?: string;
    razorpayLiveKeySecret?: string;
    webhookSecret?: string;
  },
  actorEmail: string = process.env.ADMIN_EMAIL || 'system@knowurcoach.in'
) {
  try {
    const current = await getPaymentSettings();

    const updateData: any = {};

    if (typeof data.isTestMode === 'boolean') {
      updateData.isTestMode = data.isTestMode;
    }

    if (data.razorpayTestKeyId !== undefined) {
      updateData.razorpayTestKeyId = data.razorpayTestKeyId.trim() || null;
    }

    // Only update test secret if not masked and non-empty
    if (
      data.razorpayTestKeySecret !== undefined &&
      data.razorpayTestKeySecret.trim() !== '' &&
      !data.razorpayTestKeySecret.includes('•')
    ) {
      updateData.razorpayTestKeySecret = data.razorpayTestKeySecret.trim();
    }

    if (data.razorpayLiveKeyId !== undefined) {
      updateData.razorpayLiveKeyId = data.razorpayLiveKeyId.trim() || null;
    }

    // Only update live secret if not masked and non-empty
    if (
      data.razorpayLiveKeySecret !== undefined &&
      data.razorpayLiveKeySecret.trim() !== '' &&
      !data.razorpayLiveKeySecret.includes('•')
    ) {
      updateData.razorpayLiveKeySecret = data.razorpayLiveKeySecret.trim();
    }

    if (
      data.webhookSecret !== undefined &&
      data.webhookSecret.trim() !== '' &&
      !data.webhookSecret.includes('•')
    ) {
      updateData.webhookSecret = data.webhookSecret.trim();
    }

    const updated = await prisma.paymentSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    });

    await logAdminAction({
      actorEmail,
      actorRole: 'ADMIN',
      action: 'PAYMENT_GATEWAY_CONFIG_UPDATED',
      targetModel: 'PaymentSettings',
      targetId: 'default',
      details: {
        isTestMode: updated.isTestMode,
        testKeyConfigured: Boolean(updated.razorpayTestKeyId),
        liveKeyConfigured: Boolean(updated.razorpayLiveKeyId),
        hasTestSecret: Boolean(updated.razorpayTestKeySecret),
        hasLiveSecret: Boolean(updated.razorpayLiveKeySecret),
      },
    });

    safeRevalidatePath('/admin/payments');
    safeRevalidatePath('/admin/plans');
    safeRevalidatePath('/coach/plans');

    return {
      success: true,
      message: 'Razorpay configuration saved securely.',
      settings: await getMaskedPaymentSettings(),
    };
  } catch (error: any) {
    console.error('[updatePaymentSettings] Error updating settings:', error);
    return {
      success: false,
      message: error.message || 'Failed to update payment settings.',
    };
  }
}

/**
 * Create a new Razorpay order on the backend for coach plan checkout.
 */
export async function createSubscriptionOrder(params: {
  centreId: string;
  planTier: SubscriptionPlan;
  billingCycle?: BillingCycle;
}) {
  const { centreId, planTier, billingCycle = 'monthly' } = params;

  try {
    const centre = await prisma.coachingCentre.findUnique({
      where: { id: centreId },
      include: { owner: true },
    });

    if (!centre) {
      return { success: false, message: 'Academy centre not found.' };
    }

    // Free tier needs no payment gateway order
    if (planTier === SubscriptionPlan.FREE) {
      return {
        success: false,
        message: 'Free tier does not require payment gateway checkout.',
      };
    }

    // Fetch platform configuration to get plan price
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
    });

    let baseMonthlyPrice = 1499;
    if (planTier === SubscriptionPlan.PREMIUM) {
      baseMonthlyPrice = config ? Number(config.premiumPlanPrice) : 3999;
    } else if (planTier === SubscriptionPlan.STANDARD) {
      baseMonthlyPrice = config ? Number(config.standardPlanPrice) : 1499;
    }

    // Multi-cycle pricing calculation with cycle discount
    const cyclePricing = calculateCyclePrice(baseMonthlyPrice, billingCycle);
    const priceInRupees = cyclePricing.total;
    const amountInPaise = Math.round(priceInRupees * 100);

    // Instantiate Razorpay with active credentials
    const { razorpay, keyId, mode, isTestMode } =
      await createRazorpayInstance();

    // Create Razorpay Order
    const receipt = `kuc_${centreId.slice(-6)}_${Date.now()}`;
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        centreId,
        planTier,
        billingCycle,
        academyName: centre.name || 'Academy',
        mode,
      },
    });

    // Record initiated transaction in database
    await prisma.paymentTransaction.create({
      data: {
        orderId: rzpOrder.id,
        coachingCentreId: centreId,
        userId: centre.ownerUserId,
        planTier,
        billingCycle,
        amount: priceInRupees,
        currency: 'INR',
        status: 'INITIATED',
        isTestMode,
        paymentMethod: 'razorpay',
        notes: {
          receipt,
          mode,
          planTier,
          billingCycle,
        },
        rawResponse: rzpOrder as any,
      },
    });

    return {
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId,
      mode,
      isTestMode,
      academyName: centre.name,
      coachName: centre.headCoachName || centre.name,
      coachEmail: centre.owner?.email || '',
      coachPhone: centre.phone || '',
    };
  } catch (error: any) {
    console.error('[createSubscriptionOrder] Error creating Razorpay order:', error);
    return {
      success: false,
      message:
        error.message ||
        'Could not initialize Razorpay order. Check gateway credentials.',
    };
  }
}

/**
 * Verify Razorpay payment signature and activate the coach subscription.
 */
export async function verifyAndActivateSubscription(params: {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  centreId: string;
  planTier: SubscriptionPlan;
  billingCycle?: BillingCycle;
}) {
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    centreId,
    planTier,
    billingCycle = 'monthly',
  } = params;

  try {
    const creds = await getActiveRazorpayCredentials();

    if (!creds.keySecret) {
      return {
        success: false,
        message: 'Active Razorpay Key Secret is missing. Cannot verify signature.',
      };
    }

    // Verify cryptographic HMAC signature
    const hmac = crypto.createHmac('sha256', creds.keySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const expectedSignature = hmac.digest('hex');

    const isValidSignature =
      expectedSignature.length === razorpaySignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      );

    if (!isValidSignature) {
      // Mark transaction as failed
      await prisma.paymentTransaction.updateMany({
        where: { orderId: razorpayOrderId },
        data: {
          status: 'FAILED',
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          notes: { error: 'Invalid Razorpay HMAC signature' },
        },
      });

      return {
        success: false,
        message: 'Razorpay signature verification failed. Untrusted payment.',
      };
    }

    // Signature verified! Fetch platform config & compute cycle pricing
    const config = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
    const baseMonthlyPrice = planTier === SubscriptionPlan.PREMIUM
      ? (Number(config?.premiumPlanPrice) || 3999)
      : (Number(config?.standardPlanPrice) || 1499);
    const cyclePricing = calculateCyclePrice(baseMonthlyPrice, billingCycle);
    const durationDays = cyclePricing.days;
    const now = new Date();

    const existingCentre = await prisma.coachingCentre.findUnique({
      where: { id: centreId },
      select: { planExpiresAt: true, planTier: true, isTrialActive: true },
    });
    const hasUnexpiredPlan = Boolean(
      existingCentre?.planExpiresAt &&
      new Date(existingCentre.planExpiresAt).getTime() > now.getTime() &&
      existingCentre.planTier === planTier &&
      !existingCentre.isTrialActive
    );
    const baseDate = hasUnexpiredPlan ? new Date(existingCentre!.planExpiresAt!) : now;
    const expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updatedCentre = await prisma.coachingCentre.update({
      where: { id: centreId },
      data: {
        planTier,
        isTopInArea: planTier === SubscriptionPlan.PREMIUM,
        planPaymentId: razorpayPaymentId,
        planPurchasedAt: now,
        planExpiresAt: expiresAt,
        planBillingCycle: billingCycle,
        isTrialActive: false,
        isCustomExpiry: false,
      },
      include: { owner: true },
    });

    // Update payment transaction record to SUCCESS
    await prisma.paymentTransaction.upsert({
      where: { orderId: razorpayOrderId },
      update: {
        status: 'SUCCESS',
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        planTier,
        billingCycle,
        isTestMode: creds.isTestMode,
        rawResponse: { verifiedAt: now.toISOString() },
      },
      create: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        coachingCentreId: centreId,
        userId: updatedCentre.ownerUserId,
        planTier,
        billingCycle,
        amount: cyclePricing.total,
        currency: 'INR',
        status: 'SUCCESS',
        isTestMode: creds.isTestMode,
        paymentMethod: 'razorpay',
      },
    });

    const tierName =
      planTier === SubscriptionPlan.PREMIUM
        ? 'Verified Pro Partner'
        : 'Standard Partner';

    // Send in-app notification to the coach
    if (updatedCentre.ownerUserId) {
      await prisma.notification.create({
        data: {
          userId: updatedCentre.ownerUserId,
          title: `Subscription Activated: ${tierName} 🚀`,
          message: `Your ${tierName} plan is active! Razorpay Payment Ref: ${razorpayPaymentId}. Locality priority placement and analytics are live.`,
          type: 'subscription',
        },
      }).catch(() => null);
    }

    // Log admin audit action
    await logAdminAction({
      actorEmail: updatedCentre.owner?.email || 'coach@knowurcoach.in',
      actorRole: 'COACH',
      action: 'COACH_PLAN_PURCHASED',
      targetModel: 'CoachingCentre',
      targetId: centreId,
      details: {
        centreName: updatedCentre.name,
        planTier,
        billingCycle,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        isTestMode: creds.isTestMode,
        expiresAt,
      },
    });

    safeRevalidatePath('/coach/dashboard');
    safeRevalidatePath('/coach/plans');
    safeRevalidatePath('/coach/listings');
    safeRevalidatePath('/admin/plans');
    safeRevalidatePath('/admin/payments');
    safeRevalidatePath('/admin/coaches');

    return {
      success: true,
      message: `Successfully verified and activated ${tierName}!`,
      centre: updatedCentre,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      expiresAt: expiresAt.toISOString(),
      tierName,
    };
  } catch (error: any) {
    console.error('[verifyAndActivateSubscription] Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify payment and update subscription.',
    };
  }
}

/**
 * Record a failed payment attempt, cancellation, or gateway error in the database.
 */
export async function recordFailedPayment(params: {
  orderId?: string;
  paymentId?: string;
  centreId?: string;
  errorCode?: string;
  errorDescription?: string;
  errorReason?: string;
  errorSource?: string;
  errorStep?: string;
  rawError?: any;
  notes?: any;
}) {
  const {
    orderId,
    paymentId,
    centreId,
    errorCode,
    errorDescription,
    errorReason,
    errorSource,
    errorStep,
    rawError,
    notes,
  } = params;

  try {
    const creds = await getActiveRazorpayCredentials().catch(() => ({ isTestMode: true }));
    const now = new Date();

    const failureDetails = {
      code: errorCode || 'PAYMENT_FAILED',
      description: errorDescription || 'Payment transaction was declined, cancelled, or timed out.',
      reason: errorReason,
      source: errorSource,
      step: errorStep,
      failedAt: now.toISOString(),
      raw: rawError || null,
      ...notes,
    };

    let existingTx: any = null;
    if (orderId) {
      existingTx = await prisma.paymentTransaction.findFirst({
        where: { orderId },
      });
    }

    if (existingTx) {
      await prisma.paymentTransaction.update({
        where: { id: existingTx.id },
        data: {
          status: 'FAILED',
          paymentId: paymentId || existingTx.paymentId,
          notes: {
            ...(typeof existingTx.notes === 'object' && existingTx.notes ? existingTx.notes : {}),
            ...failureDetails,
          },
          rawResponse: rawError || existingTx.rawResponse,
          updatedAt: now,
        },
      });
    } else {
      await prisma.paymentTransaction.create({
        data: {
          orderId: orderId || `kuc_failed_${Date.now()}`,
          paymentId: paymentId || null,
          coachingCentreId: centreId || null,
          amount: 0,
          currency: 'INR',
          status: 'FAILED',
          isTestMode: creds.isTestMode,
          paymentMethod: 'razorpay',
          notes: failureDetails,
          rawResponse: rawError || null,
        },
      });
    }

    // Record audit log
    await logAdminAction({
      actorEmail: 'system@knowurcoach.in',
      actorRole: 'SYSTEM',
      action: 'COACH_PAYMENT_FAILED',
      targetModel: 'PaymentTransaction',
      targetId: orderId || paymentId || 'failed-payment',
      details: {
        orderId,
        paymentId,
        centreId,
        errorCode,
        errorDescription,
        failedAt: now.toISOString(),
      },
    }).catch(() => null);

    safeRevalidatePath('/admin/orders');
    safeRevalidatePath('/admin/payments');
    safeRevalidatePath('/coach/plans');

    return { success: true, message: 'Payment failure logged successfully.' };
  } catch (err: any) {
    console.error('[recordFailedPayment] Error recording failure:', err);
    return { success: false, message: err.message || 'Could not record failed payment.' };
  }
}

/**
 * Creates a Razorpay order for online tournament registration fee.
 */
export async function createTournamentOrder(params: {
  competitionId: string;
  childNames: string[];
  parentEmail: string;
  parentName?: string;
  parentPhone?: string;
}) {
  const { competitionId, childNames, parentEmail, parentName, parentPhone } = params;

  try {
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!comp) {
      return { success: false, message: 'Tournament not found.' };
    }

    const regFee = Number(comp.registrationFee) || 0;
    const participantCount = Math.max(1, childNames.length);
    const totalRupees = regFee * participantCount;

    if (totalRupees <= 0) {
      return {
        success: true,
        isFree: true,
        orderId: null,
        amount: 0,
        currency: 'INR',
        keyId: null,
        isTestMode: true,
        competitionTitle: comp.title,
        message: 'Free tournament entry. No payment required.',
      };
    }

    const amountInPaise = Math.round(totalRupees * 100);
    const { razorpay, keyId, mode, isTestMode } = await createRazorpayInstance();

    const receipt = `trn_${competitionId.slice(-6)}_${Date.now()}`;
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        competitionId,
        competitionTitle: comp.title,
        parentEmail,
        parentPhone: parentPhone || '',
        childNames: childNames.join(', '),
        participantCount: String(participantCount),
        type: 'TOURNAMENT_ENTRY',
      },
    });

    return {
      success: true,
      isFree: false,
      orderId: rzpOrder.id,
      amount: totalRupees,
      amountPaise: amountInPaise,
      currency: 'INR',
      keyId,
      isTestMode,
      competitionTitle: comp.title,
      receipt,
    };
  } catch (err: any) {
    console.error('[createTournamentOrder] Error creating order:', err);
    return { success: false, message: err.message || 'Failed to create tournament order.' };
  }
}

/**
 * Verifies Razorpay signature for tournament payment.
 */
export async function verifyTournamentPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  try {
    const creds = await getActiveRazorpayCredentials();

    const expectedSignature = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('[verifyTournamentPayment] Signature mismatch!');
      return { success: false, message: 'Invalid payment signature. Verification failed.' };
    }

    return { success: true, paymentId: razorpayPaymentId };
  } catch (err: any) {
    console.error('[verifyTournamentPayment] Error verifying payment:', err);
    return { success: false, message: err.message || 'Payment verification failed.' };
  }
}


