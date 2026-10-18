import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 7: CoachPlansPage Component Logic & Dynamic Tier Tests', () => {
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Replicating tiers generation logic from src/app/(dashboard)/coach/plans/page.tsx
  function generatePricingTiers(config: any) {
    const standardPrice = Number(config?.standardPlanPrice) || 1499;
    const premiumPrice = Number(config?.premiumPlanPrice) || 3999;
    const trialDays = config?.freeTierDurationDays || 90;

    return [
      ...(config?.enableFreePlan !== false
        ? [
            {
              id: SubscriptionPlan.FREE,
              name: `Starter Partner (${trialDays}-Day Trial)`,
              monthlyPrice: 0,
              annualPrice: 0,
              enabled: true,
            },
          ]
        : []),
      {
        id: SubscriptionPlan.STANDARD,
        name: 'Standard Growth Partner',
        monthlyPrice: standardPrice,
        annualPrice: standardPrice * 10,
        enabled: config?.enableStandardPlan !== false,
      },
      {
        id: SubscriptionPlan.PREMIUM,
        name: 'Verified Premier Partner',
        monthlyPrice: premiumPrice,
        annualPrice: premiumPrice * 10,
        enabled: config?.enablePremiumPlan !== false,
      },
    ];
  }

  describe('Dynamic Tier Generation based on PlatformConfig', () => {
    it('should include Free Trial tier with configured duration days when free plan is enabled', () => {
      const tiers = generatePricingTiers({
        enableFreePlan: true,
        freeTierDurationDays: 60,
      });

      assert.strictEqual(tiers.length, 3);
      assert.strictEqual(tiers[0].id, SubscriptionPlan.FREE);
      assert.strictEqual(tiers[0].name, 'Starter Partner (60-Day Trial)');
    });

    it('should completely omit Free Trial tier from UI when platform admin disables free plan', () => {
      const tiers = generatePricingTiers({
        enableFreePlan: false,
      });

      assert.strictEqual(tiers.length, 2);
      assert.strictEqual(tiers[0].id, SubscriptionPlan.STANDARD);
      assert.strictEqual(tiers[1].id, SubscriptionPlan.PREMIUM);
    });

    it('should apply dynamic custom plan prices from PlatformConfig', () => {
      const tiers = generatePricingTiers({
        standardPlanPrice: 1999,
        premiumPlanPrice: 4999,
      });

      const standard = tiers.find((t) => t.id === SubscriptionPlan.STANDARD);
      const premium = tiers.find((t) => t.id === SubscriptionPlan.PREMIUM);

      assert.strictEqual(standard?.monthlyPrice, 1999);
      assert.strictEqual(standard?.annualPrice, 19990); // 10x monthly
      assert.strictEqual(premium?.monthlyPrice, 4999);
      assert.strictEqual(premium?.annualPrice, 49990);
    });

    it('should disable Standard or Premier plan if suspended by admin', () => {
      const tiers = generatePricingTiers({
        enableStandardPlan: false,
        enablePremiumPlan: true,
      });

      const standard = tiers.find((t) => t.id === SubscriptionPlan.STANDARD);
      const premium = tiers.find((t) => t.id === SubscriptionPlan.PREMIUM);

      assert.strictEqual(standard?.enabled, false);
      assert.strictEqual(premium?.enabled, true);
    });
  });

  describe('Active Plan Indicator on Pricing Cards', () => {
    it('should identify active plan when coach has operational coverage', () => {
      const centre = {
        planTier: SubscriptionPlan.PREMIUM,
        planExpiresAt: new Date(now.getTime() + 20 * dayInMs),
        isTrialActive: false,
      };

      const subStatus = getCentreSubscriptionStatus(centre, {});
      const activePlan = subStatus.canOperate ? centre.planTier : null;

      assert.strictEqual(activePlan, SubscriptionPlan.PREMIUM);
    });

    it('should return null activePlan when subscription is expired', () => {
      const centre = {
        planTier: SubscriptionPlan.STANDARD,
        planExpiresAt: new Date(now.getTime() - 2 * dayInMs),
        isTrialActive: false,
      };

      const subStatus = getCentreSubscriptionStatus(centre, {});
      const activePlan = subStatus.canOperate ? centre.planTier : null;

      assert.strictEqual(activePlan, null); // Expired plan does NOT show as active plan
    });
  });

  describe('Free Trial Duplicate Activation Prevention Guard', () => {
    function handleFreeTrialClick(centre: any, config: any): { allowed: boolean; message: string } {
      const subStatus = getCentreSubscriptionStatus(centre, config);

      if (subStatus.isTrial && !subStatus.isExpired) {
        return {
          allowed: false,
          message: `Your academy already has an active Free Trial (${subStatus.daysRemaining} days remaining).`,
        };
      }

      if (subStatus.isExpired && subStatus.isTrial) {
        return {
          allowed: false,
          message: 'Your free trial has already ended. Please choose Standard or Premier to renew.',
        };
      }

      return { allowed: true, message: 'Activating Free Partner trial...' };
    }

    it('should prevent coach from activating another free trial if one is already active', () => {
      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: true,
        planExpiresAt: new Date(now.getTime() + 50 * dayInMs),
      };

      const res = handleFreeTrialClick(centre, { enableFreePlan: true });
      assert.strictEqual(res.allowed, false);
      assert.ok(res.message.includes('already has an active Free Trial (50 days remaining)'));
    });

    it('should block free trial re-activation after trial has already expired', () => {
      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: true,
        planExpiresAt: new Date(now.getTime() - 1 * dayInMs),
      };

      const res = handleFreeTrialClick(centre, { enableFreePlan: true });
      assert.strictEqual(res.allowed, false);
      assert.ok(res.message.includes('free trial has already ended'));
    });

    it('should allow initial trial activation for a newly registered user who did not have one', () => {
      const centre = {
        planTier: SubscriptionPlan.FREE,
        isTrialActive: false,
        planExpiresAt: null,
      };

      const res = handleFreeTrialClick(centre, { enableFreePlan: true });
      assert.strictEqual(res.allowed, true);
    });
  });
});
