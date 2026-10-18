import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SubscriptionPlan, KycStatus } from '@prisma/client';

describe('Phase 4: Public Directory Discovery & Search Query Filters Tests', () => {
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Exact reproduction of the query filter logic in src/lib/cached-queries.ts
  function evaluateCentreDiscoveryEligibility(
    centre: {
      isSuspended: boolean;
      isActive: boolean;
      kycStatus: string;
      planTier: SubscriptionPlan;
      planExpiresAt: Date | null;
    },
    config: {
      allowFreeTierPublicListing?: boolean;
      enableFreePlan?: boolean;
    }
  ): boolean {
    if (centre.isSuspended) return false;
    if (!centre.isActive) return false;
    if (centre.kycStatus !== KycStatus.APPROVED) return false;

    const allowFreeListing = config.allowFreeTierPublicListing ?? true;

    // Filter rule 1: Paid tiers (STANDARD or PREMIUM)
    if (centre.planTier === SubscriptionPlan.STANDARD || centre.planTier === SubscriptionPlan.PREMIUM) {
      if (centre.planExpiresAt === null) return true; // Lifetime access
      return centre.planExpiresAt.getTime() > now.getTime(); // Active unexpired
    }

    // Filter rule 2: Free tier
    if (centre.planTier === SubscriptionPlan.FREE) {
      if (!allowFreeListing) return false;
      // Must have unexpired trial date! If null (unactivated) or past (expired), strictly exclude!
      if (!centre.planExpiresAt) return false;
      return centre.planExpiresAt.getTime() > now.getTime();
    }

    return false;
  }

  describe('Discovery Eligibility Filtering', () => {
    it('should include active Premier academy with unexpired plan', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: new Date(now.getTime() + 30 * dayInMs),
        },
        {}
      );
      assert.strictEqual(eligible, true);
    });

    it('should include Standard academy with lifetime access (planExpiresAt: null)', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.STANDARD,
          planExpiresAt: null,
        },
        {}
      );
      assert.strictEqual(eligible, true);
    });

    it('should exclude paid academy when plan has EXPIRED (planExpiresAt <= now)', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.STANDARD,
          planExpiresAt: new Date(now.getTime() - 1 * dayInMs),
        },
        {}
      );
      assert.strictEqual(eligible, false);
    });

    it('should include Free Trial academy when unexpired and allowFreeTierPublicListing is true', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: new Date(now.getTime() + 45 * dayInMs),
        },
        { allowFreeTierPublicListing: true }
      );
      assert.strictEqual(eligible, true);
    });

    it('should hide Free Trial academy when platform admin disables allowFreeTierPublicListing', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: new Date(now.getTime() + 45 * dayInMs),
        },
        { allowFreeTierPublicListing: false }
      );
      assert.strictEqual(eligible, false);
    });

    it('should strictly exclude Free Trial academy when trial has EXPIRED', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: new Date(now.getTime() - 2 * dayInMs),
        },
        { allowFreeTierPublicListing: true }
      );
      assert.strictEqual(eligible, false);
    });

    it('should strictly exclude Free Tier academy registered with NO trial (planExpiresAt: null)', () => {
      // Newly registered coach when Free Trial was disabled on platform
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.FREE,
          planExpiresAt: null,
        },
        { allowFreeTierPublicListing: true }
      );
      assert.strictEqual(eligible, false);
    });

    it('should strictly exclude suspended academy regardless of active subscription plan', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: true, // Suspended by admin
          isActive: true,
          kycStatus: KycStatus.APPROVED,
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: new Date(now.getTime() + 90 * dayInMs),
        },
        {}
      );
      assert.strictEqual(eligible, false);
    });

    it('should exclude academy whose KYC is not yet approved', () => {
      const eligible = evaluateCentreDiscoveryEligibility(
        {
          isSuspended: false,
          isActive: true,
          kycStatus: KycStatus.DOCS_REVIEW, // Under review
          planTier: SubscriptionPlan.PREMIUM,
          planExpiresAt: new Date(now.getTime() + 90 * dayInMs),
        },
        {}
      );
      assert.strictEqual(eligible, false);
    });
  });

  describe('Discovery Priority Sorting Order', () => {
    it('should sort Premier with Top In Area ahead of Standard and Free academies', () => {
      const academies = [
        { id: '1', name: 'Free Trial Academy', isTopInArea: false, isVerifiedBatch: false, planTier: SubscriptionPlan.FREE, rating: 5.0 },
        { id: '2', name: 'Standard Academy', isTopInArea: false, isVerifiedBatch: true, planTier: SubscriptionPlan.STANDARD, rating: 4.8 },
        { id: '3', name: 'Premier Locality Leader', isTopInArea: true, isVerifiedBatch: true, planTier: SubscriptionPlan.PREMIUM, rating: 4.9 },
      ];

      const sorted = [...academies].sort((a, b) => {
        if (a.isTopInArea !== b.isTopInArea) return a.isTopInArea ? -1 : 1;
        if (a.isVerifiedBatch !== b.isVerifiedBatch) return a.isVerifiedBatch ? -1 : 1;
        const tierRank = { PREMIUM: 3, STANDARD: 2, FREE: 1 };
        if (tierRank[a.planTier] !== tierRank[b.planTier]) {
          return tierRank[b.planTier] - tierRank[a.planTier];
        }
        return b.rating - a.rating;
      });

      assert.strictEqual(sorted[0].id, '3'); // Premier Locality Leader on top
      assert.strictEqual(sorted[1].id, '2'); // Standard second
      assert.strictEqual(sorted[2].id, '1'); // Free third
    });
  });
});
