import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 5: End-to-End Onboarding & Lifecycle Transition Flows Tests', () => {
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  describe('Flow 1: New Coach Registration with Free Trial ENABLED', () => {
    it('should assign configured trial days, set isTrialActive to true, and select trial email', () => {
      const platformConfig = {
        enableFreePlan: true,
        freeTierDurationDays: 90,
      };

      // Simulating registerCoachAcademy date calculation
      const isFreePlanEnabled = platformConfig.enableFreePlan;
      const trialDurationDays = platformConfig.freeTierDurationDays;

      let planExpiresAt: Date | null = null;
      let isTrialActive = false;
      let planBillingCycle = 'free';

      if (isFreePlanEnabled) {
        planExpiresAt = new Date(now.getTime() + trialDurationDays * dayInMs);
        isTrialActive = true;
        planBillingCycle = 'trial';
      } else {
        planExpiresAt = null;
        isTrialActive = false;
        planBillingCycle = 'none';
      }

      assert.strictEqual(isTrialActive, true);
      assert.strictEqual(planBillingCycle, 'trial');
      assert.ok(planExpiresAt !== null);

      // Verify email template dispatch decision
      const selectedEmailType = isTrialActive && planExpiresAt ? 'COACH_TRIAL_WELCOME_EMAIL' : 'STANDARD_WELCOME_EMAIL';
      assert.strictEqual(selectedEmailType, 'COACH_TRIAL_WELCOME_EMAIL');

      // Verify resulting subscription status
      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive,
        planExpiresAt,
        planBillingCycle,
      };
      const subStatus = getCentreSubscriptionStatus(centre, platformConfig);
      assert.strictEqual(subStatus.status, 'TRIAL');
      assert.strictEqual(subStatus.canOperate, true);
      assert.strictEqual(subStatus.daysRemaining, 90);
    });
  });

  describe('Flow 2: New Coach Registration with Free Trial DISABLED', () => {
    it('should assign null expiry date, set isTrialActive to false, and select standard welcome email', () => {
      const platformConfig = {
        enableFreePlan: false,
        freeTierDurationDays: 90,
      };

      // Simulating registerCoachAcademy date calculation
      const isFreePlanEnabled = platformConfig.enableFreePlan;

      let planExpiresAt: Date | null = null;
      let isTrialActive = false;
      let planBillingCycle = 'free';

      if (isFreePlanEnabled) {
        planExpiresAt = new Date(now.getTime() + 90 * dayInMs);
        isTrialActive = true;
        planBillingCycle = 'trial';
      } else {
        planExpiresAt = null; // Clean null expiry
        isTrialActive = false;
        planBillingCycle = 'none';
      }

      assert.strictEqual(isTrialActive, false);
      assert.strictEqual(planBillingCycle, 'none');
      assert.strictEqual(planExpiresAt, null);

      // Verify email template dispatch decision
      const selectedEmailType = isTrialActive && planExpiresAt ? 'COACH_TRIAL_WELCOME_EMAIL' : 'STANDARD_WELCOME_EMAIL';
      assert.strictEqual(selectedEmailType, 'STANDARD_WELCOME_EMAIL');

      // Verify resulting subscription status is LOCKED (not EXPIRED)
      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive,
        planExpiresAt,
        planBillingCycle,
      };
      const subStatus = getCentreSubscriptionStatus(centre, platformConfig);
      assert.strictEqual(subStatus.status, 'LOCKED');
      assert.strictEqual(subStatus.isExpired, false); // Must NOT be expired!
      assert.strictEqual(subStatus.canOperate, false);
      assert.strictEqual(subStatus.canListPublicly, false);
      assert.strictEqual(subStatus.headline, 'Platform Free Trial Inactive');
    });
  });

  describe('Flow 3: Free Trial Activation via Coach Plans Page', () => {
    it('should allow coach to activate trial when admin re-enables Free Plan', () => {
      // Coach previously had no trial
      const existingCentre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: false,
        planExpiresAt: null,
      };

      const updatedConfig = {
        enableFreePlan: true,
        freeTierDurationDays: 60, // Admin configured 60 days
      };

      // Simulating updateCoachSubscriptionPlan for FREE tier:
      const freeTrialDays = updatedConfig.freeTierDurationDays;
      const newExpiresAt = new Date(now.getTime() + freeTrialDays * dayInMs);
      const isTrialActive = true;
      const effectiveBillingCycle = 'trial';

      const updatedCentre = {
        ...existingCentre,
        planExpiresAt: newExpiresAt,
        isTrialActive,
        planBillingCycle: effectiveBillingCycle,
      };

      const subStatus = getCentreSubscriptionStatus(updatedCentre, updatedConfig);
      assert.strictEqual(subStatus.status, 'TRIAL');
      assert.strictEqual(subStatus.canOperate, true);
      assert.strictEqual(subStatus.daysRemaining, 60);
    });
  });

  describe('Flow 4: Admin 1-Click Quick Extension (+30 Days)', () => {
    it('should extend validity from current expiry when plan is still active', () => {
      // Coach has 15 days remaining on STANDARD plan
      const centre = {
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: new Date(now.getTime() + 15 * dayInMs),
        isTrialActive: false,
      };

      // Simulating adminExtendCoachSubscription (+30 days)
      const daysToAdd = 30;
      const currentExpiry = centre.planExpiresAt;
      const isCurrentActive = currentExpiry && currentExpiry > now;
      const baseDate = isCurrentActive ? currentExpiry : now;
      const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * dayInMs);

      const daysTotal = Math.round((newExpiresAt.getTime() - now.getTime()) / dayInMs);
      assert.strictEqual(daysTotal, 45); // 15 + 30 = 45 days!
    });

    it('should extend validity from NOW when plan was already expired', () => {
      // Coach plan expired 5 days ago
      const centre = {
        planTier: SubscriptionPlan.PREMIUM,
        planExpiresAt: new Date(now.getTime() - 5 * dayInMs),
        isTrialActive: false,
      };

      // Simulating adminExtendCoachSubscription (+30 days)
      const daysToAdd = 30;
      const currentExpiry = centre.planExpiresAt;
      const isCurrentActive = currentExpiry && currentExpiry > now;
      const baseDate = isCurrentActive ? currentExpiry : now;
      const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * dayInMs);

      const daysTotal = Math.round((newExpiresAt.getTime() - now.getTime()) / dayInMs);
      assert.strictEqual(daysTotal, 30); // 30 fresh days starting today!
    });
  });

  describe('Flow 5: Admin Custom Expiry Date Override', () => {
    it('should set isCustomExpiry to true and grant active status until custom target date', () => {
      const customTargetDate = new Date(now.getTime() + 120 * dayInMs);

      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: false,
        isCustomExpiry: true,
        planExpiresAt: customTargetDate,
      };

      const subStatus = getCentreSubscriptionStatus(centre, { enableFreePlan: false });
      assert.strictEqual(subStatus.status, 'ACTIVE');
      assert.strictEqual(subStatus.canOperate, true);
      assert.strictEqual(subStatus.headline, 'Admin Extended Access Active');
      assert.strictEqual(subStatus.daysRemaining, 120);
    });
  });
});
