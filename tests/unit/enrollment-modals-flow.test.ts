import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 36: Monthly Batch Enrollment & Tournament Register Modals Tests', () => {
  // Sibling selection logic from EnrollmentModal.tsx & TournamentRegisterModal.tsx
  function toggleChildSelection(currentSelected: string[], childName: string): string[] {
    if (currentSelected.includes(childName)) {
      if (currentSelected.length === 1) return currentSelected;
      return currentSelected.filter((name) => name !== childName);
    }
    return [...currentSelected, childName];
  }

  // Batch monthly fee priority resolution from EnrollmentModal.tsx
  function resolveBatchFee(currentBatch: any, academy: any): number {
    if (currentBatch?.monthlyFee) return Number(currentBatch.monthlyFee);
    if (currentBatch?.fee) return Number(currentBatch.fee);
    if (academy?.fee) return Number(academy.fee);
    if (academy?.monthlyTuitionFee) return Number(academy.monthlyTuitionFee);
    return 1800;
  }

  // Quick Add Child parsing logic from EnrollmentModal.tsx
  function processQuickAddChild(
    rawName: string,
    rawAge: string,
    defaultAge: number = 7
  ): { valid: boolean; error?: string; child?: { fullName: string; age: number } } {
    if (!rawName.trim() || !rawAge.trim()) {
      return { valid: false, error: 'Please enter child name and age' };
    }
    const parsedAge = parseInt(rawAge.trim(), 10);
    const age = !isNaN(parsedAge) && parsedAge > 0 ? parsedAge : defaultAge;
    return {
      valid: true,
      child: {
        fullName: rawName.trim(),
        age,
      },
    };
  }

  // Guest validation logic for tournament registration from TournamentRegisterModal.tsx
  function validateTournamentSubmission(isGuest: boolean, userEmail?: string, childCount: number = 0) {
    if (isGuest || !userEmail) {
      return {
        allowed: false,
        redirectTo: '/login?callbackUrl=/competitions',
        message: 'Please sign in or create a parent account to register for tournaments',
      };
    }
    if (childCount === 0) {
      return {
        allowed: false,
        message: 'Please select or add at least one child participant',
      };
    }
    return { allowed: true };
  }

  describe('Sibling Multi-Child Selection Rules', () => {
    it('should allow toggling on additional children for multi-participant booking', () => {
      const initial = ['Aarav Sharma'];
      const updated = toggleChildSelection(initial, 'Ananya Sharma');
      assert.deepStrictEqual(updated, ['Aarav Sharma', 'Ananya Sharma']);
    });

    it('should allow removing a sibling if more than one child is selected', () => {
      const initial = ['Aarav Sharma', 'Ananya Sharma'];
      const updated = toggleChildSelection(initial, 'Aarav Sharma');
      assert.deepStrictEqual(updated, ['Ananya Sharma']);
    });

    it('should prevent deselecting the only remaining child in the selection list', () => {
      const initial = ['Aarav Sharma'];
      const attemptRemove = toggleChildSelection(initial, 'Aarav Sharma');
      // Must maintain at least 1 child selected
      assert.deepStrictEqual(attemptRemove, ['Aarav Sharma']);
    });
  });

  describe('Batch Monthly Fee Priority Ladder', () => {
    it('should prioritize batch monthlyFee property over all other fee fields', () => {
      const batch = { monthlyFee: 2200, fee: 2000 };
      const academy = { fee: 1900, monthlyTuitionFee: 1800 };
      assert.strictEqual(resolveBatchFee(batch, academy), 2200);
    });

    it('should fallback to batch fee if monthlyFee is absent', () => {
      const batch = { fee: 2100 };
      const academy = { monthlyTuitionFee: 1800 };
      assert.strictEqual(resolveBatchFee(batch, academy), 2100);
    });

    it('should fallback to academy fee or tuition fee when batch specifies no custom price', () => {
      const batch = {};
      const academy1 = { fee: 2400 };
      const academy2 = { monthlyTuitionFee: 2600 };
      assert.strictEqual(resolveBatchFee(batch, academy1), 2400);
      assert.strictEqual(resolveBatchFee(batch, academy2), 2600);
    });

    it('should fallback to default 1800 if no pricing information is present anywhere', () => {
      assert.strictEqual(resolveBatchFee(null, null), 1800);
      assert.strictEqual(resolveBatchFee({}, {}), 1800);
    });
  });

  describe('Quick Add Child Input Validation', () => {
    it('should reject whitespace-only child name or empty age', () => {
      const res1 = processQuickAddChild('   ', '8');
      assert.strictEqual(res1.valid, false);

      const res2 = processQuickAddChild('Kabir', '   ');
      assert.strictEqual(res2.valid, false);
    });

    it('should sanitize trimmed name and parse age correctly', () => {
      const res = processQuickAddChild('  Diya Verma  ', ' 9 ');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.child?.fullName, 'Diya Verma');
      assert.strictEqual(res.child?.age, 9);
    });

    it('should fallback to default age if non-numeric string is provided', () => {
      const res = processQuickAddChild('Reyansh', 'invalid-age', 10);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.child?.age, 10);
    });
  });

  describe('Tournament Guest Gate & Participation Guard', () => {
    it('should block unauthenticated or guest parents from tournament entries and route to login', () => {
      const checkGuest = validateTournamentSubmission(true, 'guest@knowurcoach.in', 1);
      assert.strictEqual(checkGuest.allowed, false);
      assert.strictEqual(checkGuest.redirectTo, '/login?callbackUrl=/competitions');

      const checkNoEmail = validateTournamentSubmission(false, undefined, 1);
      assert.strictEqual(checkNoEmail.allowed, false);
      assert.strictEqual(checkNoEmail.redirectTo, '/login?callbackUrl=/competitions');
    });

    it('should require at least one child participant for authenticated tournament entry', () => {
      const checkZero = validateTournamentSubmission(false, 'parent@gmail.com', 0);
      assert.strictEqual(checkZero.allowed, false);
      assert.strictEqual(checkZero.message, 'Please select or add at least one child participant');

      const checkValid = validateTournamentSubmission(false, 'parent@gmail.com', 2);
      assert.strictEqual(checkValid.allowed, true);
    });
  });
});
