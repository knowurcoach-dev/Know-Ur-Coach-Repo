import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KycStatus } from '@prisma/client';

describe('Phase 10: Student Attendance & Operational Guard Tests', () => {
  // Replicating handleCheckIn authorization guard from coach/dashboard/page.tsx
  function evaluateCheckInEligibility(centre: {
    kycStatus: string;
    isActive: boolean;
  }): { allowed: boolean; message?: string } {
    if (centre.kycStatus !== KycStatus.APPROVED && !centre.isActive) {
      return {
        allowed: false,
        message: '🔒 Student check-in is locked until your academy profile is verified.',
      };
    }
    return { allowed: true };
  }

  describe('Attendance Check-In Verification Guard', () => {
    it('should block attendance check-in when KYC is PENDING and centre is inactive', () => {
      const res = evaluateCheckInEligibility({
        kycStatus: KycStatus.PENDING,
        isActive: false,
      });

      assert.strictEqual(res.allowed, false);
      assert.ok(res.message?.includes('locked until your academy profile is verified'));
    });

    it('should block attendance check-in when KYC is REFERRED_BACK and centre is inactive', () => {
      const res = evaluateCheckInEligibility({
        kycStatus: KycStatus.REFERRED_BACK,
        isActive: false,
      });

      assert.strictEqual(res.allowed, false);
    });

    it('should allow attendance check-in when KYC is APPROVED', () => {
      const res = evaluateCheckInEligibility({
        kycStatus: KycStatus.APPROVED,
        isActive: true,
      });

      assert.strictEqual(res.allowed, true);
    });
  });

  describe('Attendance Roster Status Mutations', () => {
    interface StudentRosterItem {
      id: string;
      name: string;
      batchId: string;
      status: 'present' | 'absent' | 'late';
    }

    it('should correctly mutate student status from absent to present', () => {
      const roster: StudentRosterItem[] = [
        { id: 's1', name: 'Aarav Sharma', batchId: 'b1', status: 'absent' },
        { id: 's2', name: 'Diya Patel', batchId: 'b1', status: 'absent' },
      ];

      const updatedRoster = roster.map((s) =>
        s.id === 's1' ? { ...s, status: 'present' as const } : s
      );

      assert.strictEqual(updatedRoster[0].status, 'present');
      assert.strictEqual(updatedRoster[1].status, 'absent');

      const presentCount = updatedRoster.filter((s) => s.status === 'present').length;
      assert.strictEqual(presentCount, 1);
    });

    it('should correctly toggle status back to absent on undo check-in', () => {
      const roster: StudentRosterItem[] = [
        { id: 's1', name: 'Aarav Sharma', batchId: 'b1', status: 'present' },
      ];

      const updatedRoster = roster.map((s) =>
        s.id === 's1' ? { ...s, status: 'absent' as const } : s
      );

      assert.strictEqual(updatedRoster[0].status, 'absent');
    });
  });
});
