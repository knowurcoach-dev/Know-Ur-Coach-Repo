import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getCentreSubscriptionStatus,
  calculateCyclePrice,
  BILLING_CYCLES,
  FREE_TRIAL_PRESETS,
} from '@/lib/subscription';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 1: Subscription & Pricing Engine Unit Tests', () => {
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  describe('calculateCyclePrice() Multi-Cycle Billing Calculations', () => {
    const baseMonthlyPrice = 1499;

    it('should correctly calculate 1 Month (monthly) with 0% discount', () => {
      const res = calculateCyclePrice(baseMonthlyPrice, 'monthly');
      assert.strictEqual(res.cycleKey, 'monthly');
      assert.strictEqual(res.months, 1);
      assert.strictEqual(res.days, 30);
      assert.strictEqual(res.discountPercent, 0);
      assert.strictEqual(res.total, 1499);
      assert.strictEqual(res.savings, 0);
      assert.strictEqual(res.perMonth, 1499);
    });

    it('should correctly calculate 3 Months (quarterly) with 5% discount', () => {
      const res = calculateCyclePrice(baseMonthlyPrice, 'quarterly');
      assert.strictEqual(res.cycleKey, 'quarterly');
      assert.strictEqual(res.months, 3);
      assert.strictEqual(res.days, 90);
      assert.strictEqual(res.discountPercent, 5);
      // Raw 1499 * 3 = 4497. 5% discount = 224.85 -> 4272.15 -> round = 4272
      assert.strictEqual(res.total, 4272);
      assert.strictEqual(res.savings, 225);
      assert.strictEqual(res.perMonth, 1424);
    });

    it('should correctly calculate 6 Months (half-yearly) with 10% discount', () => {
      const res = calculateCyclePrice(baseMonthlyPrice, 'half-yearly');
      assert.strictEqual(res.cycleKey, 'half-yearly');
      assert.strictEqual(res.months, 6);
      assert.strictEqual(res.days, 180);
      assert.strictEqual(res.discountPercent, 10);
      // Raw 1499 * 6 = 8994. 10% discount = 899.4 -> 8094.6 -> round = 8095
      assert.strictEqual(res.total, 8095);
      assert.strictEqual(res.savings, 899);
      assert.strictEqual(res.perMonth, 1349);
    });

    it('should correctly calculate 1 Year (annual) with 17% discount', () => {
      const res = calculateCyclePrice(baseMonthlyPrice, 'annual');
      assert.strictEqual(res.cycleKey, 'annual');
      assert.strictEqual(res.months, 12);
      assert.strictEqual(res.days, 365);
      assert.strictEqual(res.discountPercent, 17);
      // Raw 1499 * 12 = 17988. 17% discount = 3057.96 -> round = 14930
      assert.strictEqual(res.total, 14930);
      assert.strictEqual(res.savings, 3058);
      assert.strictEqual(res.perMonth, 1244);
    });

    it('should gracefully fallback to monthly for unrecognized billing cycle key', () => {
      const res = calculateCyclePrice(baseMonthlyPrice, 'unknown_cycle' as any);
      assert.strictEqual(res.cycleKey, 'monthly');
      assert.strictEqual(res.total, 1499);
    });
  });

  describe('FREE_TRIAL_PRESETS Configuration', () => {
    it('should define valid standard trial presets for admin dashboard', () => {
      assert.deepStrictEqual(FREE_TRIAL_PRESETS, [
        { days: 30, label: '1 Month (30 Days)' },
        { days: 60, label: '2 Months (60 Days)' },
        { days: 90, label: '3 Months (90 Days)' },
        { days: 180, label: '6 Months (180 Days)' },
      ]);
    });
  });

  describe('getCentreSubscriptionStatus() Lifecycle State Matrix', () => {
    const defaultConfig = {
      enableFreePlan: true,
      allowFreeTierPublicListing: true,
      freeTierDurationDays: 90,
    };

    it('Case 0A: should return LOCKED when centre is null/undefined', () => {
      const status = getCentreSubscriptionStatus(null, defaultConfig);
      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.statusBadge, 'LOCKED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'No Academy Profile Found');
    });

    it('Case 0B: should return LOCKED when academy is explicitly suspended by admin', () => {
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.PREMIUM,
          isSuspended: true,
          planExpiresAt: new Date(now.getTime() + 30 * dayInMs),
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Academy Suspended by Platform Admin');
    });

    it('Case 0C: should return LOCKED when academy account is deactivated', () => {
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.STANDARD,
          isActive: false,
          planExpiresAt: new Date(now.getTime() + 30 * dayInMs),
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Academy Account Deactivated');
    });

    it('Case 1A: should return EXPIRED when Free Trial expiration date has passed', () => {
      const pastDate = new Date(now.getTime() - 2 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: pastDate,
          isTrialActive: true,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'EXPIRED');
      assert.strictEqual(status.statusBadge, 'EXPIRED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.isExpired, true);
      assert.strictEqual(status.isTrial, true);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Free Trial Expired');
    });

    it('Case 1B: should return LOCKED when platform admin disabled Free Plan and user has no trial', () => {
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          isTrialActive: false,
          isCustomExpiry: false,
        },
        { enableFreePlan: false, allowFreeTierPublicListing: false }
      );
      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.statusBadge, 'LOCKED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.isExpired, false); // Crucial: must NOT be marked expired
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Platform Free Trial Inactive');
    });

    it('Case 1C: should return LOCKED when Free Tier user has no trial active and no expiry date', () => {
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: null,
          isTrialActive: false,
          isCustomExpiry: false,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.statusBadge, 'LOCKED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Subscription Required');
    });

    it('Case 1D: should return TRIAL with full operational access for healthy unexpired trial', () => {
      const futureDate = new Date(now.getTime() + 60 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: futureDate,
          isTrialActive: true,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'TRIAL');
      assert.strictEqual(status.statusBadge, 'TRIAL');
      assert.strictEqual(status.isActive, true);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.isTrial, true);
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.canListPublicly, true);
      assert.strictEqual(status.headline, 'Free Partner Trial Active');
      assert.strictEqual(status.daysRemaining, 60);
    });

    it('Case 1E: should return EXPIRING_SOON when Free Trial has <= 7 days remaining', () => {
      const nearFutureDate = new Date(now.getTime() + 4 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: nearFutureDate,
          isTrialActive: true,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'EXPIRING_SOON');
      assert.strictEqual(status.statusBadge, 'EXPIRING_SOON');
      assert.strictEqual(status.isActive, true);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.headline, 'Free Trial Ending in 4 Days');
    });

    it('Case 1F: should hide free trial academy from public directory if allowFreeTierPublicListing is false', () => {
      const futureDate = new Date(now.getTime() + 45 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: futureDate,
          isTrialActive: true,
        },
        { enableFreePlan: true, allowFreeTierPublicListing: false }
      );
      assert.strictEqual(status.canOperate, true); // Can still manage internal batches & attendance
      assert.strictEqual(status.canListPublicly, false); // But cannot appear in public directory
    });

    it('Case 1G: should return ACTIVE for Admin Custom Extended Validity on Free Tier', () => {
      const futureDate = new Date(now.getTime() + 40 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: futureDate,
          isTrialActive: false,
          isCustomExpiry: true,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'ACTIVE');
      assert.strictEqual(status.statusBadge, 'ACTIVE');
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.headline, 'Admin Extended Access Active');
    });

    it('Case 2A: should return EXPIRED for Paid Tier whose plan has expired', () => {
      const pastDate = new Date(now.getTime() - 1 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: pastDate,
          isTrialActive: false,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'EXPIRED');
      assert.strictEqual(status.isActive, false);
      assert.strictEqual(status.isExpired, true);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.canListPublicly, false);
      assert.strictEqual(status.headline, 'Premier Plan Expired');
    });

    it('Case 2B: should return ACTIVE for healthy active paid subscription', () => {
      const futureDate = new Date(now.getTime() + 25 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.STANDARD,
          planExpiresAt: futureDate,
          planBillingCycle: 'monthly',
          isTrialActive: false,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'ACTIVE');
      assert.strictEqual(status.statusBadge, 'ACTIVE');
      assert.strictEqual(status.isActive, true);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.canListPublicly, true);
      assert.strictEqual(status.headline, 'Standard Partner Active');
    });

    it('Case 2C: should return EXPIRING_SOON for paid plan with <= 7 days remaining', () => {
      const nearFutureDate = new Date(now.getTime() + 3 * dayInMs);
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: nearFutureDate,
          planBillingCycle: 'quarterly',
          isTrialActive: false,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'EXPIRING_SOON');
      assert.strictEqual(status.statusBadge, 'EXPIRING_SOON');
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.canListPublicly, true);
      assert.strictEqual(status.headline, 'Subscription Renews in 3 Days');
    });

    it('Case 2D: should return ACTIVE with Lifetime Access when paid tier planExpiresAt is null', () => {
      const status = getCentreSubscriptionStatus(
        {
          id: 'centre-123',
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: null,
          isTrialActive: false,
        },
        defaultConfig
      );
      assert.strictEqual(status.status, 'ACTIVE');
      assert.strictEqual(status.isActive, true);
      assert.strictEqual(status.isExpired, false);
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.canListPublicly, true);
      assert.strictEqual(status.formattedExpiry, 'Lifetime Access');
      assert.strictEqual(status.daysRemaining, 9999);
    });
  });

  describe('PublicListingStatus & KYC Synchronization Matrix', () => {
    it('Case 3A: Paid plan purchased before KYC review (kycStatus: DOCS_REVIEW)', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-paid-review',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: null,
        kycStatus: 'DOCS_REVIEW',
        isSuspended: false,
      });

      assert.strictEqual(status.canOperate, true, 'Paid plan must unlock operations');
      assert.strictEqual(status.isKycApproved, false);
      assert.strictEqual(status.isPublicLive, false, 'Public listing must NOT be live before KYC approval');
      assert.strictEqual(status.publicListingStatus, 'UNDER_REVIEW');
      assert.ok(status.publicListingMessage.includes('review'), 'Must inform that listing is queued under review');
      assert.ok(!status.publicListingMessage.toLowerCase().includes('subscription required'), 'Must not claim subscription required when already paid');
    });

    it('Case 3B: Paid plan with KYC pending onboarding (kycStatus: PENDING)', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-paid-pending',
        planTier: SubscriptionPlan.PREMIUM,
        planExpiresAt: null,
        kycStatus: 'PENDING',
        isSuspended: false,
      });

      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'PENDING_DOCS');
      assert.ok(status.publicListingMessage.includes('documents'), 'Must request verification documents');
    });

    it('Case 3C: Paid plan with revisions requested (kycStatus: REFERRED_BACK)', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-paid-revisions',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: null,
        kycStatus: 'REFERRED_BACK',
        isSuspended: false,
      });

      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'REVISIONS_REQUESTED');
      assert.ok(status.publicListingMessage.includes('Revisions requested'));
    });

    it('Case 3D: Paid plan with KYC rejected (kycStatus: REJECTED)', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-paid-rejected',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: null,
        kycStatus: 'REJECTED',
        isSuspended: false,
      });

      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'KYC_REJECTED');
      assert.ok(status.publicListingMessage.includes('declined'));
    });

    it('Case 3E: Free trial activated before KYC approval (kycStatus: DOCS_REVIEW)', () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const status = getCentreSubscriptionStatus({
        id: 'c-trial-review',
        planTier: SubscriptionPlan.FREE,
        planExpiresAt: futureDate,
        isTrialActive: true,
        kycStatus: 'DOCS_REVIEW',
        isSuspended: false,
      });

      assert.strictEqual(status.canOperate, true, 'Trial unlocks coach operations');
      assert.strictEqual(status.isTrial, true);
      assert.strictEqual(status.isKycApproved, false);
      assert.strictEqual(status.isPublicLive, false, 'Free trial must not be live to public before KYC approval');
      assert.strictEqual(status.publicListingStatus, 'UNDER_REVIEW');
    });

    it('Case 3F: Account suspended by admin with active paid plan', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-suspended',
        planTier: SubscriptionPlan.PREMIUM,
        planExpiresAt: null,
        kycStatus: 'APPROVED',
        isSuspended: true,
      });

      assert.strictEqual(status.status, 'LOCKED');
      assert.strictEqual(status.statusBadge, 'LOCKED');
      assert.strictEqual(status.canOperate, false, 'Suspended academy cannot operate');
      assert.strictEqual(status.isPublicLive, false, 'Suspended academy cannot be live');
      assert.strictEqual(status.publicListingStatus, 'SUSPENDED');
      assert.ok(status.publicListingMessage.toLowerCase().includes('suspended'));
    });

    it('Case 3G: KYC approved and active plan (Happy Path)', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-live',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: null,
        kycStatus: 'APPROVED',
        isSuspended: false,
      });

      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.isKycApproved, true);
      assert.strictEqual(status.isPublicLive, true);
      assert.strictEqual(status.publicListingStatus, 'LIVE');
      assert.ok(status.publicListingMessage.toLowerCase().includes('live'));
    });

    it('Case 3H: KYC approved but plan expired', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const status = getCentreSubscriptionStatus({
        id: 'c-approved-expired',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: pastDate,
        kycStatus: 'APPROVED',
        isSuspended: false,
      });

      assert.strictEqual(status.isKycApproved, true);
      assert.strictEqual(status.canOperate, false);
      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'EXPIRED');
    });

    it('Case 3I: Unapproved academy on Premium plan cannot be public live', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-premium-unapproved',
        planTier: SubscriptionPlan.PREMIUM,
        planExpiresAt: null,
        kycStatus: 'DOCS_REVIEW',
        isSuspended: false,
      });

      assert.strictEqual(status.tier, SubscriptionPlan.PREMIUM);
      assert.strictEqual(status.canOperate, true);
      assert.strictEqual(status.isKycApproved, false);
      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'UNDER_REVIEW');
    });

    it('Case 3J: Suspended academy with active standard plan is locked and not live', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-suspended-active-plan',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        kycStatus: 'APPROVED',
        isSuspended: true,
      });

      assert.strictEqual(status.canOperate, false, 'Suspended academy cannot operate regardless of plan');
      assert.strictEqual(status.isPublicLive, false, 'Suspended academy cannot be live');
      assert.strictEqual(status.publicListingStatus, 'SUSPENDED');
      assert.strictEqual(status.status, 'LOCKED');
    });

    it('Case 3K: KYC rejected academy with recorded plan cannot be live', () => {
      const status = getCentreSubscriptionStatus({
        id: 'c-rejected-plan',
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        kycStatus: 'REJECTED',
        isSuspended: false,
      });

      assert.strictEqual(status.isPublicLive, false);
      assert.strictEqual(status.publicListingStatus, 'KYC_REJECTED');
      assert.ok(status.publicListingMessage.toLowerCase().includes('declined'));
    });
  });
});

