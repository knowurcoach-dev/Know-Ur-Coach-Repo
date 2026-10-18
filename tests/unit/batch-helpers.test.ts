import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  serializeBatchSchedule,
  parseBatchSchedule,
  formatBatchItem,
} from '@/lib/batch-helpers';

describe('Phase 13: Batch Schedule Helpers & Seat Capacity Tests', () => {
  describe('serializeBatchSchedule()', () => {
    it('should format schedule, category tag, and coach tag into standardized string', () => {
      const result = serializeBatchSchedule({
        schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM',
        category: 'badminton',
        coachName: 'Coach Rajesh',
      });

      assert.strictEqual(
        result,
        'Tue, Thu, Sat • 4:00 PM - 5:15 PM • [Category: badminton] • [Coach: Coach Rajesh]'
      );
    });

    it('should strip existing tags before appending to avoid duplicate tags on resave', () => {
      const alreadyTagged =
        'Tue, Thu, Sat • 4:00 PM - 5:15 PM • [Category: tennis] • [Coach: Coach Rajesh]';

      const updated = serializeBatchSchedule({
        schedule: alreadyTagged,
        category: 'badminton', // Updated category
        coachName: 'Coach Vikram', // Updated coach
      });

      assert.strictEqual(
        updated,
        'Tue, Thu, Sat • 4:00 PM - 5:15 PM • [Category: badminton] • [Coach: Coach Vikram]'
      );
    });

    it('should clean trailing bullets or separators from schedule input', () => {
      const dirty = 'Mon, Wed, Fri • 6:00 PM - 7:00 PM •';
      const result = serializeBatchSchedule({
        schedule: dirty,
        category: 'football',
      });

      assert.strictEqual(
        result,
        'Mon, Wed, Fri • 6:00 PM - 7:00 PM • [Category: football]'
      );
    });

    it('should handle optional coachName and optional category gracefully', () => {
      const onlySchedule = serializeBatchSchedule({
        schedule: 'Daily • 6:00 AM - 7:30 AM',
      });
      assert.strictEqual(onlySchedule, 'Daily • 6:00 AM - 7:30 AM');

      const onlyCoach = serializeBatchSchedule({
        schedule: 'Daily • 6:00 AM - 7:30 AM',
        coachName: 'Sensei Dave',
      });
      assert.strictEqual(
        onlyCoach,
        'Daily • 6:00 AM - 7:30 AM • [Coach: Sensei Dave]'
      );
    });
  });

  describe('parseBatchSchedule()', () => {
    it('should extract pure schedule, category slug, and coach name from serialized string', () => {
      const raw =
        'Mon, Wed, Fri • 5:00 PM - 6:30 PM • [Category: swimming] • [Coach: Coach Priya]';

      const parsed = parseBatchSchedule(raw);

      assert.strictEqual(parsed.pureSchedule, 'Mon, Wed, Fri • 5:00 PM - 6:30 PM');
      assert.strictEqual(parsed.category, 'swimming');
      assert.strictEqual(parsed.coachName, 'Coach Priya');
    });

    it('should handle strings without metadata tags', () => {
      const plain = 'Sat, Sun • 10:00 AM - 12:00 PM';
      const parsed = parseBatchSchedule(plain);

      assert.strictEqual(parsed.pureSchedule, 'Sat, Sun • 10:00 AM - 12:00 PM');
      assert.strictEqual(parsed.category, undefined);
      assert.strictEqual(parsed.coachName, undefined);
    });

    it('should handle empty or null string safely', () => {
      const parsed = parseBatchSchedule('');
      assert.strictEqual(parsed.pureSchedule, '');
      assert.strictEqual(parsed.category, undefined);
    });
  });

  describe('formatBatchItem()', () => {
    it('should enrich batch object with display name, emoji, and enrolled seats string', () => {
      const batch = {
        id: 'batch-01',
        name: 'Junior Champions',
        schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM • [Category: badminton] • [Coach: Coach Rajesh]',
        ageGroup: '7 - 12 Yrs',
        totalSeats: 20,
        seatsFilled: 12,
        monthlyFee: 2500,
        isAdmissionsOpen: true,
      };

      const formatted = formatBatchItem(batch);

      assert.strictEqual(formatted.name, 'Junior Champions');
      assert.strictEqual(formatted.pureSchedule, 'Tue, Thu, Sat • 4:00 PM - 5:15 PM');
      assert.strictEqual(formatted.category, 'badminton');
      assert.strictEqual(formatted.categoryDisplayName, 'Badminton Academy');
      assert.strictEqual(formatted.categoryEmoji, '🏸');
      assert.strictEqual(formatted.coachName, 'Coach Rajesh');
      assert.strictEqual(formatted.totalSeats, 20);
      assert.strictEqual(formatted.seatsFilled, 12);
      assert.strictEqual(formatted.seats, '12/20 Enrolled');
      assert.strictEqual(formatted.monthlyFee, 2500);
      assert.strictEqual(formatted.isAdmissionsOpen, true);
    });

    it('should compute seatsFilled as Math.max of seatsFilled, bookings array, and _count', () => {
      const batchWithActiveBookings = {
        id: 'batch-02',
        name: 'Advanced Squad',
        totalSeats: 15,
        seatsFilled: 4,
        bookings: [
          { id: 'b1' },
          { id: 'b2' },
          { id: 'b3' },
          { id: 'b4' },
          { id: 'b5' },
          { id: 'b6' },
        ],
      };

      const formatted = formatBatchItem(batchWithActiveBookings);
      // Math.max(4, 6 bookings, 0) => 6
      assert.strictEqual(formatted.seatsFilled, 6);
      assert.strictEqual(formatted.seats, '6/15 Enrolled');
    });

    it('should apply safe defaults for missing or null batch properties', () => {
      const emptyBatch = {};
      const formatted = formatBatchItem(emptyBatch);

      assert.strictEqual(formatted.totalSeats, 15);
      assert.strictEqual(formatted.seatsFilled, 0);
      assert.strictEqual(formatted.seats, '0/15 Enrolled');
      assert.strictEqual(formatted.monthlyFee, 1800);
      assert.strictEqual(formatted.ageGroup, '6 - 14 Yrs');
      assert.strictEqual(formatted.isAdmissionsOpen, true);
    });

    it('should handle completely null batch argument', () => {
      const formatted = formatBatchItem(null);
      assert.strictEqual(formatted.name, '');
      assert.strictEqual(formatted.totalSeats, 15);
      assert.strictEqual(formatted.monthlyFee, 1800);
    });
  });
});
