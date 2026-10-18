import { SubscriptionPlan } from '@prisma/client';

export type BillingCycle = 'monthly' | 'quarterly' | 'half-yearly' | 'annual';
export type BillingCycleKey = BillingCycle;

export interface BillingCycleConfig {
  key: BillingCycle;
  label: string;
  months: number;
  days: number;
  discountPercent: number;
  badge?: string;
  description: string;
}

export const BILLING_CYCLES: Record<BillingCycle, BillingCycleConfig> = {
  monthly: {
    key: 'monthly',
    label: '1 Month',
    months: 1,
    days: 30,
    discountPercent: 0,
    description: 'Billed monthly, cancel anytime',
  },
  quarterly: {
    key: 'quarterly',
    label: '3 Months',
    months: 3,
    days: 90,
    discountPercent: 5,
    badge: 'Popular',
    description: 'Billed quarterly with 5% partner discount',
  },
  'half-yearly': {
    key: 'half-yearly',
    label: '6 Months',
    months: 6,
    days: 180,
    discountPercent: 10,
    badge: 'Save 10%',
    description: 'Billed semi-annually with 10% partner discount',
  },
  annual: {
    key: 'annual',
    label: '1 Year',
    months: 12,
    days: 365,
    discountPercent: 17,
    badge: 'Best Value (2 Mo Free)',
    description: 'Full year coverage with 2 months free equivalent',
  },
};

export const FREE_TRIAL_PRESETS = [
  { days: 30, label: '1 Month (30 Days)' },
  { days: 60, label: '2 Months (60 Days)' },
  { days: 90, label: '3 Months (90 Days)' },
  { days: 180, label: '6 Months (180 Days)' },
];

export function calculateCyclePrice(baseMonthlyPrice: number, cycle: BillingCycle | string) {
  const normalizedKey = (cycle || 'monthly') as BillingCycle;
  const cfg = BILLING_CYCLES[normalizedKey] || BILLING_CYCLES.monthly;
  const fullPrice = baseMonthlyPrice * cfg.months;
  const discount = Math.round((fullPrice * cfg.discountPercent) / 100);
  const total = Math.max(0, fullPrice - discount);
  const perMonth = Math.round(total / cfg.months);
  return {
    total,
    totalPrice: total,
    perMonth,
    effectiveMonthlyPrice: perMonth,
    discount,
    savings: discount,
    months: cfg.months,
    durationMonths: cfg.months,
    days: cfg.days,
    label: cfg.label,
    discountPercent: cfg.discountPercent,
  };
}

export interface SubscriptionStatus {
  tier: SubscriptionPlan;
  isActive: boolean;
  isExpired: boolean;
  isTrial: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
  formattedExpiry: string;
  billingCycle: string | null;
  statusBadge: 'ACTIVE' | 'TRIAL' | 'EXPIRING_SOON' | 'EXPIRED' | 'LOCKED';
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRING_SOON' | 'EXPIRED' | 'LOCKED';
  canOperate: boolean;
  canListPublicly: boolean;
  canPublicList: boolean;
  headline: string;
  subtext: string;
}


export function getCentreSubscriptionStatus(
  centre: {
    id?: string;
    planTier?: SubscriptionPlan | string;
    planExpiresAt?: Date | string | null;
    planPurchasedAt?: Date | string | null;
    planBillingCycle?: string | null;
    isTrialActive?: boolean;
    isActive?: boolean;
    isCustomExpiry?: boolean;
  } | null | undefined,
  config?: {
    enableFreePlan?: boolean;
    allowFreeTierPublicListing?: boolean;
    freeTierDurationDays?: number;
  } | null
): SubscriptionStatus {
  if (!centre) {
    return {
      tier: SubscriptionPlan.FREE,
      isActive: false,
      isExpired: false,
      isTrial: false,
      daysRemaining: 0,
      expiresAt: null,
      formattedExpiry: 'N/A',
      billingCycle: null,
      statusBadge: 'LOCKED',
      status: 'LOCKED',
      canOperate: false,
      canListPublicly: false,
      canPublicList: false,
      headline: 'No Academy Profile Found',
      subtext: 'Please complete your academy registration to activate operations.',
    };
  }

  const tier = (centre.planTier as SubscriptionPlan) || SubscriptionPlan.FREE;
  const expiresAt = centre.planExpiresAt ? new Date(centre.planExpiresAt) : null;
  const now = new Date();

  const isExpired = Boolean(expiresAt && now.getTime() > expiresAt.getTime());
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formattedExpiry = expiresAt
    ? expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'None';

  const enableFreePlan = config?.enableFreePlan ?? true;
  const allowFreeListing = config?.allowFreeTierPublicListing ?? true;

  // Case 1: FREE Tier
  if (tier === SubscriptionPlan.FREE) {
    // If Free Tier has an expiration date and it has passed
    if (expiresAt && isExpired) {
      return {
        tier: SubscriptionPlan.FREE,
        isActive: false,
        isExpired: true,
        isTrial: true,
        daysRemaining: 0,
        expiresAt,
        formattedExpiry,
        billingCycle: centre.planBillingCycle || 'trial',
        statusBadge: 'EXPIRED',
        status: 'EXPIRED',
        canOperate: false,
        canListPublicly: false,
        canPublicList: false,
        headline: 'Free Trial Expired',
        subtext: `Your free trial ended on ${formattedExpiry}. Choose a subscription plan to resume operations.`,
      };
    }

    // If platform admin completely disabled Free Tier and centre does not have a valid active trial
    if (!enableFreePlan && !centre.isTrialActive && !centre.isCustomExpiry) {
      return {
        tier: SubscriptionPlan.FREE,
        isActive: false,
        isExpired: false,
        isTrial: false,
        daysRemaining: 0,
        expiresAt,
        formattedExpiry,
        billingCycle: centre.planBillingCycle || 'none',
        statusBadge: 'LOCKED',
        status: 'LOCKED',
        canOperate: false,
        canListPublicly: false,
        canPublicList: false,
        headline: 'Platform Free Trial Inactive',
        subtext: 'Free trial is currently disabled on this platform. Please choose a partner plan to unlock operations.',
      };
    }

    // If centre is on Free tier but never had a trial activated or has no expiry date
    if (!centre.isTrialActive && !centre.isCustomExpiry && !expiresAt) {
      return {
        tier: SubscriptionPlan.FREE,
        isActive: false,
        isExpired: false,
        isTrial: false,
        daysRemaining: 0,
        expiresAt: null,
        formattedExpiry: 'N/A',
        billingCycle: centre.planBillingCycle || 'none',
        statusBadge: 'LOCKED',
        status: 'LOCKED',
        canOperate: false,
        canListPublicly: false,
        canPublicList: false,
        headline: 'Subscription Required',
        subtext: 'Please activate your complimentary trial or choose a subscription plan to unlock operations.',
      };
    }

    // Active Free Trial
    const isExpiringSoon = Boolean(expiresAt && daysRemaining <= 7);
    return {
      tier: SubscriptionPlan.FREE,
      isActive: true,
      isExpired: false,
      isTrial: true,
      daysRemaining,
      expiresAt,
      formattedExpiry,
      billingCycle: centre.planBillingCycle || 'trial',
      statusBadge: isExpiringSoon ? 'EXPIRING_SOON' : 'TRIAL',
      status: isExpiringSoon ? 'EXPIRING_SOON' : 'TRIAL',
      canOperate: true,
      canListPublicly: allowFreeListing,
      canPublicList: allowFreeListing,
      headline: isExpiringSoon
        ? `Free Trial Ending in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`
        : 'Free Partner Trial Active',
      subtext: expiresAt
        ? `Trial valid until ${formattedExpiry}. Upgrade anytime for priority search ranking.`
        : 'Trial active.',
    };
  }

  // Case 2: Paid Tiers (STANDARD or PREMIUM)
  if (expiresAt && isExpired) {
    return {
      tier,
      isActive: false,
      isExpired: true,
      isTrial: false,
      daysRemaining: 0,
      expiresAt,
      formattedExpiry,
      billingCycle: centre.planBillingCycle || 'monthly',
      statusBadge: 'EXPIRED',
      status: 'EXPIRED',
      canOperate: false,
      canListPublicly: false,
      canPublicList: false,
      headline: `${tier === SubscriptionPlan.PREMIUM ? 'Premier' : 'Standard'} Plan Expired`,
      subtext: `Your subscription ended on ${formattedExpiry}. Public search listing and operations are paused until renewal.`,
    };
  }

  const isExpiringSoon = Boolean(expiresAt && daysRemaining <= 7);
  return {
    tier,
    isActive: true,
    isExpired: false,
    isTrial: false,
    daysRemaining,
    expiresAt,
    formattedExpiry,
    billingCycle: centre.planBillingCycle || 'monthly',
    statusBadge: isExpiringSoon ? 'EXPIRING_SOON' : 'ACTIVE',
    status: isExpiringSoon ? 'EXPIRING_SOON' : 'ACTIVE',
    canOperate: true,
    canListPublicly: true,
    canPublicList: true,
    headline: isExpiringSoon
      ? `Subscription Renews in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`
      : `${tier === SubscriptionPlan.PREMIUM ? 'Premier Partner' : 'Standard Partner'} Active`,
    subtext: expiresAt
      ? `Active coverage until ${formattedExpiry}.`
      : 'Active coverage.',
  };
}
