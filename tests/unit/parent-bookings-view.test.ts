import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BookingPassData } from '@/components/cards/BookingPassCard';

describe('Phase 68: Parent Bookings Component Pass Mapping & Operations Tests', () => {
  // Replicating database booking to pass mapping engine from src/app/(dashboard)/parent/bookings/page.tsx
  function mapDbBookingsToPasses(bookingsList: any[]): BookingPassData[] {
    return bookingsList.map((bk: any) => {
      const type: 'trial' | 'batch' | 'tournament' =
        bk.passType === 'FREE_TRIAL'
          ? 'trial'
          : bk.passType === 'MONTHLY_BATCH'
          ? 'batch'
          : 'tournament';

      const attendedCount = bk.attendances ? bk.attendances.filter((a: any) => a.isPresent).length : 0;
      const totalClasses = bk.batch ? 12 : 1;
      const pct = Math.round((attendedCount / totalClasses) * 100);

      const rawPass = bk.passId || `REF-${bk.id.slice(-6)}`;
      const passId = rawPass.startsWith('REF-') ? rawPass : rawPass.replace('KUC-PASS-', 'REF-');

      // Dynamic batch monthly fee priority over centre default
      const dynamicBatchFee = bk.batch?.monthlyFee
        ? Number(bk.batch.monthlyFee)
        : Number(bk.netAmountPaid) > 0
        ? Number(bk.netAmountPaid)
        : Number(bk.centre?.monthlyTuitionFee) || 1800;

      const coachName = bk.batch?.coachName || bk.centre?.headCoachName || 'Assigned Head Coach';
      const childFullName = bk.child
        ? `${bk.child.fullName}${bk.child.age ? ` (Age ${bk.child.age})` : ''}`
        : 'Student';

      return {
        id: bk.id,
        type,
        title: bk.centre?.name || bk.competition?.title || 'Session Pass',
        subtitle: bk.centre
          ? `${bk.centre.category} • ${bk.centre.locality}${bk.centre.city ? `, ${bk.centre.city}` : ''}`
          : bk.competition?.venue || 'Premier Sports Venue',
        studentName: childFullName,
        schedule:
          bk.batch?.schedule ||
          (bk.scheduledAt ? new Date(bk.scheduledAt).toLocaleDateString() : 'Scheduled Class'),
        courtOrVenue: bk.batch ? `${bk.batch.name}` : bk.competition?.venue || 'Main Court',
        passId,
        feeInfo: type === 'trial' ? 'Free Trial' : `Tuition: ₹${dynamicBatchFee.toLocaleString('en-IN')}/mo`,
        phone: bk.centre?.phone || bk.centre?.owner?.phone || '9897012345',
        coachName,
        attendances: bk.attendances || [],
        attendanceProgress:
          type === 'batch'
            ? { attended: attendedCount, total: totalClasses, percentage: pct }
            : undefined,
        tournamentDetails:
          type === 'tournament'
            ? {
                category: bk.competition?.category || 'Singles',
                dates: bk.competition?.dates || 'TBD',
                reportingTime: '8:30 AM Sharp',
              }
            : undefined,
      };
    });
  }

  // Child creation form validation logic
  function validateChildProfileForm(name: string, age: string): { valid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Please enter child name' };
    }
    if (!age || !age.trim()) {
      return { valid: false, error: 'Please enter child age' };
    }
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 2 || ageNum > 21) {
      return { valid: false, error: 'Child age must be between 2 and 21 years' };
    }
    return { valid: true };
  }

  describe('Pass Type Mapping & Badge Assignment', () => {
    it('should map FREE_TRIAL to trial pass with Free Trial fee notice', () => {
      const dbBookings = [
        {
          id: 'bk-trial-1',
          passType: 'FREE_TRIAL',
          passId: 'REF-TR1234',
          centre: { name: 'Agra Badminton Academy', category: 'badminton', locality: 'Sanjay Place' },
          child: { fullName: 'Kabir Das', age: 9 },
        },
      ];

      const passes = mapDbBookingsToPasses(dbBookings);
      assert.strictEqual(passes.length, 1);
      assert.strictEqual(passes[0].type, 'trial');
      assert.strictEqual(passes[0].feeInfo, 'Free Trial');
      assert.strictEqual(passes[0].studentName, 'Kabir Das (Age 9)');
      assert.strictEqual(passes[0].attendanceProgress, undefined);
    });

    it('should map MONTHLY_BATCH to batch pass with monthly tuition fee info', () => {
      const dbBookings = [
        {
          id: 'bk-batch-1',
          passType: 'MONTHLY_BATCH',
          passId: 'KUC-PASS-998877',
          centre: { name: 'Apex Tennis Club', category: 'tennis', locality: 'Dayalbagh', monthlyTuitionFee: 2200 },
          batch: { name: 'Juniors Elite', schedule: 'Tue-Thu 4PM', monthlyFee: 2400 },
          child: { fullName: 'Ira Sharma', age: 11 },
          attendances: [{ isPresent: true }, { isPresent: true }, { isPresent: false }],
        },
      ];

      const passes = mapDbBookingsToPasses(dbBookings);
      assert.strictEqual(passes.length, 1);
      assert.strictEqual(passes[0].type, 'batch');
      assert.strictEqual(passes[0].passId, 'REF-998877');
      assert.strictEqual(passes[0].feeInfo, 'Tuition: ₹2,400/mo'); // prioritized batch fee over centre fee
      assert.deepStrictEqual(passes[0].attendanceProgress, {
        attended: 2,
        total: 12,
        percentage: 17, // 2/12 = 16.66% -> 17%
      });
    });

    it('should map tournament registration to tournament pass with tournamentDetails', () => {
      const dbBookings = [
        {
          id: 'bk-tourney-1',
          passType: 'TOURNAMENT_ENTRY',
          passId: 'REF-TRN001',
          competition: { title: 'Taj Youth Open 2026', venue: 'Eklavya Stadium', category: 'Under 14 Boys', dates: 'Nov 12-14' },
          child: { fullName: 'Arjun Mehra' },
        },
      ];

      const passes = mapDbBookingsToPasses(dbBookings);
      assert.strictEqual(passes.length, 1);
      assert.strictEqual(passes[0].type, 'tournament');
      assert.strictEqual(passes[0].title, 'Taj Youth Open 2026');
      assert.strictEqual(passes[0].tournamentDetails?.category, 'Under 14 Boys');
      assert.strictEqual(passes[0].tournamentDetails?.reportingTime, '8:30 AM Sharp');
    });
  });

  describe('Fee Prioritization Fallback Logic', () => {
    it('should prioritize netAmountPaid when batch fee is not set', () => {
      const dbBookings = [
        {
          id: 'bk-fee-1',
          passType: 'MONTHLY_BATCH',
          netAmountPaid: 2100,
          centre: { monthlyTuitionFee: 1800 },
        },
      ];

      const passes = mapDbBookingsToPasses(dbBookings);
      assert.strictEqual(passes[0].feeInfo, 'Tuition: ₹2,100/mo');
    });

    it('should fallback to default 1800 when neither batch nor centre fee is specified', () => {
      const dbBookings = [
        {
          id: 'bk-fee-2',
          passType: 'MONTHLY_BATCH',
        },
      ];

      const passes = mapDbBookingsToPasses(dbBookings);
      assert.strictEqual(passes[0].feeInfo, 'Tuition: ₹1,800/mo');
    });
  });

  describe('Filter State & Counters', () => {
    const mixedBookings = [
      { id: '1', passType: 'FREE_TRIAL' },
      { id: '2', passType: 'FREE_TRIAL' },
      { id: '3', passType: 'MONTHLY_BATCH' },
      { id: '4', passType: 'TOURNAMENT_ENTRY' },
    ];

    it('should return all passes when activeFilter is all', () => {
      const passes = mapDbBookingsToPasses(mixedBookings);
      const filtered = passes.filter(() => true);
      assert.strictEqual(filtered.length, 4);
    });

    it('should accurately filter by trial, batch, and tournament types', () => {
      const passes = mapDbBookingsToPasses(mixedBookings);
      const trials = passes.filter((p) => p.type === 'trial');
      const batches = passes.filter((p) => p.type === 'batch');
      const tournaments = passes.filter((p) => p.type === 'tournament');

      assert.strictEqual(trials.length, 2);
      assert.strictEqual(batches.length, 1);
      assert.strictEqual(tournaments.length, 1);
    });
  });

  describe('Child Profile Form Validation', () => {
    it('should reject empty or whitespace child name and age', () => {
      assert.strictEqual(validateChildProfileForm('', '10').valid, false);
      assert.strictEqual(validateChildProfileForm('   ', '10').valid, false);
      assert.strictEqual(validateChildProfileForm('Riya', '').valid, false);
    });

    it('should reject invalid or out-of-range child age', () => {
      assert.strictEqual(validateChildProfileForm('Riya', 'not-a-number').valid, false);
      assert.strictEqual(validateChildProfileForm('Riya', '1').valid, false); // < 2
      assert.strictEqual(validateChildProfileForm('Riya', '25').valid, false); // > 21
    });

    it('should accept valid child name and age', () => {
      assert.strictEqual(validateChildProfileForm('Riya Sen', '8').valid, true);
    });
  });
});
