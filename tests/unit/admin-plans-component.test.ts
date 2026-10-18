import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SubscriptionPlan } from '@prisma/client';

describe('Phase 8: AdminPlansPage Audit Ledger & Form Validation Tests', () => {
  const sampleCoaches = [
    {
      id: 'c1',
      name: 'Agra Shuttlers Club',
      headCoachName: 'Rohan Sharma',
      locality: 'Sanjay Place',
      phone: '9876543210',
      planTier: SubscriptionPlan.PREMIUM,
      owner: { email: 'rohan@agrashuttlers.com' },
    },
    {
      id: 'c2',
      name: 'Taj City Tennis Academy',
      headCoachName: 'Amit Verma',
      locality: 'Fatehabad Road',
      phone: '9123456780',
      planTier: SubscriptionPlan.STANDARD,
      owner: { email: 'amit@tajtennis.in' },
    },
    {
      id: 'c3',
      name: 'Sunrise Cricket Ground',
      headCoachName: 'Vikas Yadav',
      locality: 'Dayal Bagh',
      phone: '9988776655',
      planTier: SubscriptionPlan.FREE,
      owner: { email: 'vikas@sunrisecricket.com' },
    },
  ];

  describe('Audit Ledger Search Filtering', () => {
    function filterCoaches(list: any[], query: string, subFilter: 'ALL' | 'PAID' | 'FREE') {
      return list.filter((coach) => {
        const matchesSub =
          subFilter === 'ALL' ||
          (subFilter === 'PAID' && coach.planTier !== SubscriptionPlan.FREE) ||
          (subFilter === 'FREE' && coach.planTier === SubscriptionPlan.FREE);

        if (!matchesSub) return false;

        const q = query.trim().toLowerCase();
        if (!q) return true;

        const nameMatch = coach.name?.toLowerCase().includes(q);
        const founderMatch = coach.headCoachName?.toLowerCase().includes(q);
        const emailMatch = coach.owner?.email?.toLowerCase().includes(q);
        const phoneMatch = coach.phone?.includes(q);
        const localityMatch = coach.locality?.toLowerCase().includes(q);

        return Boolean(nameMatch || founderMatch || emailMatch || phoneMatch || localityMatch);
      });
    }

    it('should find coach by academy name', () => {
      const res = filterCoaches(sampleCoaches, 'tennis', 'ALL');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'c2');
    });

    it('should find coach by coach founder name', () => {
      const res = filterCoaches(sampleCoaches, 'rohan', 'ALL');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'c1');
    });

    it('should find coach by phone number', () => {
      const res = filterCoaches(sampleCoaches, '9988776655', 'ALL');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'c3');
    });

    it('should filter by PAID subscriptions', () => {
      const res = filterCoaches(sampleCoaches, '', 'PAID');
      assert.strictEqual(res.length, 2);
      assert.ok(res.every((c) => c.planTier !== SubscriptionPlan.FREE));
    });

    it('should filter by FREE subscriptions', () => {
      const res = filterCoaches(sampleCoaches, '', 'FREE');
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'c3');
    });
  });

  describe('Admin Plans Form Inputs Validation', () => {
    function validatePlanSettings(data: {
      standardPrice: number;
      premiumPrice: number;
      freeDurationDays: number;
    }): { valid: boolean; error?: string } {
      if (isNaN(data.standardPrice) || data.standardPrice <= 0) {
        return { valid: false, error: 'Standard plan price must be a positive number' };
      }
      if (isNaN(data.premiumPrice) || data.premiumPrice <= 0) {
        return { valid: false, error: 'Premium plan price must be a positive number' };
      }
      if (data.premiumPrice <= data.standardPrice) {
        return { valid: false, error: 'Premium plan price must be higher than Standard plan price' };
      }
      if (isNaN(data.freeDurationDays) || data.freeDurationDays < 1) {
        return { valid: false, error: 'Free tier duration must be at least 1 day' };
      }
      return { valid: true };
    }

    it('should pass for valid price and duration inputs', () => {
      const res = validatePlanSettings({
        standardPrice: 1499,
        premiumPrice: 3999,
        freeDurationDays: 90,
      });
      assert.strictEqual(res.valid, true);
    });

    it('should reject invalid or negative pricing', () => {
      const res = validatePlanSettings({
        standardPrice: -100,
        premiumPrice: 3999,
        freeDurationDays: 90,
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('positive number'));
    });

    it('should reject when premium price is lower than standard price', () => {
      const res = validatePlanSettings({
        standardPrice: 2999,
        premiumPrice: 1999,
        freeDurationDays: 90,
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('higher than Standard'));
    });

    it('should reject non-positive free duration days', () => {
      const res = validatePlanSettings({
        standardPrice: 1499,
        premiumPrice: 3999,
        freeDurationDays: 0,
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('at least 1 day'));
    });
  });
});
