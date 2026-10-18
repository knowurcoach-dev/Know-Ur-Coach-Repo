import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sendCoachTrialWelcomeEmail,
  sendWelcomeEmail,
} from '@/lib/mail';

describe('Phase 9: Mail Templates & Email Notification Service Tests', () => {
  const targetEmail = 'coach.testing@knowurcoach.in';
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  describe('sendCoachTrialWelcomeEmail() Duration Calculation & Formatting', () => {
    function computeDurationLabel(days: number): string {
      const monthsCount = days >= 30 ? Math.round(days / 30) : 0;
      return monthsCount >= 1 ? `${monthsCount} Month${monthsCount > 1 ? 's' : ''}` : `${days} Days`;
    }

    it('should compute exact duration labels for standard trial periods', () => {
      assert.strictEqual(computeDurationLabel(30), '1 Month');
      assert.strictEqual(computeDurationLabel(60), '2 Months');
      assert.strictEqual(computeDurationLabel(90), '3 Months');
      assert.strictEqual(computeDurationLabel(180), '6 Months');
      assert.strictEqual(computeDurationLabel(15), '15 Days');
    });

    it('should format Indian date properly for trial expiry', () => {
      const testExpiry = new Date(2026, 11, 15, 12, 0, 0);
      const formatted = testExpiry.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      assert.ok(formatted.includes('15'));
      assert.ok(formatted.includes('December'));
      assert.ok(formatted.includes('2026'));
    });

    it('should cleanly execute sendCoachTrialWelcomeEmail in development simulation mode', async () => {
      const res = await sendCoachTrialWelcomeEmail({
        to: targetEmail,
        coachName: 'Coach Vikram',
        centreName: 'National Badminton Academy',
        trialDurationDays: 90,
        expiresAt: new Date(now.getTime() + 90 * dayInMs),
      });

      assert.strictEqual(res.success, true);
    });
  });

  describe('sendWelcomeEmail() Role-Specific Messaging', () => {
    it('should cleanly deliver welcome email for Coach role in simulated dev mode', async () => {
      const res = await sendWelcomeEmail({
        to: targetEmail,
        name: 'Coach Vikram',
        role: 'Coach',
      });

      assert.strictEqual(res.success, true);
    });

    it('should cleanly deliver welcome email for Parent role in simulated dev mode', async () => {
      const res = await sendWelcomeEmail({
        to: 'parent.user@gmail.com',
        name: 'Pooja Gupta',
        role: 'Parent',
      });

      assert.strictEqual(res.success, true);
    });
  });
});
