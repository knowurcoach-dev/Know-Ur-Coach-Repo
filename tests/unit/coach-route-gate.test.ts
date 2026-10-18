import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 3: CoachRouteGate Authorization & Gating Logic Tests', () => {
  const LOCKED_ROUTES = [
    '/coach/attendance',
    '/coach/leads',
    '/coach/students',
    '/coach/batches',
    '/coach/revenue',
    '/coach/promote',
    '/coach/listings',
  ];

  const UNRESTRICTED_ROUTES = [
    '/coach/dashboard',
    '/coach/plans',
    '/coach/profile',
    '/coach/settings',
    '/coach/help',
  ];

  describe('Route Pattern Matching', () => {
    function isRestricted(pathname: string): boolean {
      return LOCKED_ROUTES.some((route) => pathname.startsWith(route));
    }

    it('should identify all operational routes as restricted', () => {
      for (const route of LOCKED_ROUTES) {
        assert.strictEqual(isRestricted(route), true, `Route ${route} should be restricted`);
        assert.strictEqual(isRestricted(`${route}/sub-page`), true, `Sub-route of ${route} should be restricted`);
      }
    });

    it('should allow dashboard, plans, and settings routes to bypass the gate', () => {
      for (const route of UNRESTRICTED_ROUTES) {
        assert.strictEqual(isRestricted(route), false, `Route ${route} should NOT be restricted`);
      }
    });
  });

  describe('Gatekeeper Rendering Decision Engine', () => {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    type GateDecision = 'RENDER_OPERATIONAL_VIEW' | 'RENDER_EXPIRED_RENEWAL_GATE' | 'RENDER_LOCKED_ONBOARDING_GATE';

    function evaluateGateDecision(
      centre: any,
      config: any,
      pathname: string
    ): GateDecision {
      const isRestricted = LOCKED_ROUTES.some((route) => pathname.startsWith(route));
      if (!isRestricted) {
        return 'RENDER_OPERATIONAL_VIEW';
      }

      const subStatus = getCentreSubscriptionStatus(centre, config);

      if (subStatus.canOperate) {
        return 'RENDER_OPERATIONAL_VIEW';
      }

      if (subStatus.status === 'EXPIRED') {
        return 'RENDER_EXPIRED_RENEWAL_GATE';
      }

      // Default for LOCKED (e.g. newly registered user with free trial disabled)
      return 'RENDER_LOCKED_ONBOARDING_GATE';
    }

    it('should grant access to restricted routes when coach has active Free Trial', () => {
      const activeTrialCentre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: true,
        planExpiresAt: new Date(now.getTime() + 45 * dayInMs),
      };

      const decision = evaluateGateDecision(activeTrialCentre, { enableFreePlan: true }, '/coach/attendance');
      assert.strictEqual(decision, 'RENDER_OPERATIONAL_VIEW');
    });

    it('should grant access to restricted routes when coach has active Paid Plan', () => {
      const paidCentre = {
        planTier: SubscriptionPlan.PREMIUM,
        isTrialActive: false,
        planExpiresAt: new Date(now.getTime() + 20 * dayInMs),
      };

      const decision = evaluateGateDecision(paidCentre, {}, '/coach/leads');
      assert.strictEqual(decision, 'RENDER_OPERATIONAL_VIEW');
    });

    it('should render HIGH-URGENCY RED RENEWAL GATE when subscription is EXPIRED', () => {
      const expiredCentre = {
        planTier: SubscriptionPlan.STANDARD,
        isTrialActive: false,
        planExpiresAt: new Date(now.getTime() - 2 * dayInMs),
      };

      const decision = evaluateGateDecision(expiredCentre, {}, '/coach/students');
      assert.strictEqual(decision, 'RENDER_EXPIRED_RENEWAL_GATE');
    });

    it('should render ONBOARDING CHECKLIST GATE (not expired screen) when new user has free trial disabled', () => {
      const newLockedUser = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: false,
        isCustomExpiry: false,
        planExpiresAt: null,
      };

      const decision = evaluateGateDecision(newLockedUser, { enableFreePlan: false }, '/coach/batches');
      assert.strictEqual(decision, 'RENDER_LOCKED_ONBOARDING_GATE');
    });

    it('should render ONBOARDING GATE when academy is suspended by administrator', () => {
      const suspendedCentre = {
        planTier: SubscriptionPlan.PREMIUM,
        isSuspended: true,
        planExpiresAt: new Date(now.getTime() + 30 * dayInMs),
      };

      const decision = evaluateGateDecision(suspendedCentre, {}, '/coach/revenue');
      assert.strictEqual(decision, 'RENDER_LOCKED_ONBOARDING_GATE');
    });
  });

  describe('Academy Profile Completeness Validation', () => {
    function checkProfileComplete(centre: any): boolean {
      const hasBasicProfile = Boolean(centre?.name?.trim() && centre?.address?.trim());
      const hasSubmittedKyc =
        centre?.kycStatus === 'DOCS_REVIEW' ||
        centre?.kycStatus === 'APPROVED' ||
        centre?.kycStatus === 'INSPECTION_SCHEDULED' ||
        Boolean(centre?.statusNotes && centre.statusNotes.includes('In-app digital KYC submitted'));
      const hasBatches = Boolean(centre?.batches && centre.batches.length > 0);

      return hasBasicProfile && (hasSubmittedKyc || hasBatches);
    }

    it('should fail completeness if name or address is missing', () => {
      assert.strictEqual(checkProfileComplete({ name: '', address: '123 Main St' }), false);
      assert.strictEqual(checkProfileComplete({ name: 'Pro Academy', address: '' }), false);
    });

    it('should pass completeness if basic profile is present and KYC is DOCS_REVIEW', () => {
      const centre = {
        name: 'Apex Badminton Academy',
        address: 'Sector 4, Sanjay Place, Agra',
        kycStatus: 'DOCS_REVIEW',
      };
      assert.strictEqual(checkProfileComplete(centre), true);
    });

    it('should pass completeness if basic profile is present and at least 1 batch configured', () => {
      const centre = {
        name: 'Apex Badminton Academy',
        address: 'Sector 4, Sanjay Place, Agra',
        kycStatus: 'PENDING',
        batches: [{ name: 'Morning Juniors', schedule: '6:00 AM - 7:30 AM' }],
      };
      assert.strictEqual(checkProfileComplete(centre), true);
    });
  });
});
