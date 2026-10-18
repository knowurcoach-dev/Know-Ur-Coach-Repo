import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 22: Parent Family Profile & Child Registration Management Tests', () => {
  interface ChildRecord {
    id: string;
    parentId: string;
    fullName: string;
    age: number;
    grade: string;
    interests: string[];
    emergencyContactPhone?: string;
  }

  function normalizePhone(rawPhone?: string): string | null {
    if (!rawPhone) return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return null;
  }

  function validateChildProfile(
    existingChildren: ChildRecord[],
    input: {
      fullName: string;
      age: number;
      grade?: string;
      interests?: string[];
      emergencyPhone?: string;
    }
  ): { valid: boolean; child?: ChildRecord; error?: string } {
    const cleanName = (input.fullName || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { valid: false, error: 'Child full name must be at least 2 characters long.' };
    }

    if (typeof input.age !== 'number' || isNaN(input.age) || input.age < 3 || input.age > 18) {
      return { valid: false, error: 'Child age must be between 3 and 18 years.' };
    }

    const isDuplicate = existingChildren.some(
      (c) => c.fullName.toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      return {
        valid: false,
        error: `A child with the name "${cleanName}" is already registered under your family account.`,
      };
    }

    let cleanEmergencyPhone: string | undefined;
    if (input.emergencyPhone) {
      const normalized = normalizePhone(input.emergencyPhone);
      if (!normalized) {
        return { valid: false, error: 'Emergency contact phone must be a valid 10-digit Indian mobile number.' };
      }
      cleanEmergencyPhone = `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
    }

    const child: ChildRecord = {
      id: `ch-${Date.now()}`,
      parentId: 'parent-1',
      fullName: cleanName,
      age: Math.round(input.age),
      grade: input.grade || (input.age <= 5 ? 'Preschool' : `Grade ${input.age - 5}`),
      interests: Array.isArray(input.interests) ? input.interests.map((i) => i.trim().toLowerCase()) : [],
      emergencyContactPhone: cleanEmergencyPhone,
    };

    return { valid: true, child };
  }

  describe('Child Input Validation Rules', () => {
    const existing: ChildRecord[] = [];

    it('should pass for healthy child profile details', () => {
      const res = validateChildProfile(existing, {
        fullName: 'Aarav Sharma',
        age: 8,
        grade: 'Grade 3',
        interests: ['badminton', 'robotics'],
        emergencyPhone: '+91 98765 43210',
      });

      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.child?.fullName, 'Aarav Sharma');
      assert.strictEqual(res.child?.age, 8);
      assert.strictEqual(res.child?.grade, 'Grade 3');
      assert.strictEqual(res.child?.emergencyContactPhone, '+91 98765 43210');
      assert.deepStrictEqual(res.child?.interests, ['badminton', 'robotics']);
    });

    it('should reject names shorter than 2 characters or whitespace', () => {
      const res1 = validateChildProfile(existing, { fullName: 'A', age: 7 });
      assert.strictEqual(res1.valid, false);
      assert.ok(res1.error?.includes('at least 2 characters'));

      const res2 = validateChildProfile(existing, { fullName: '   ', age: 7 });
      assert.strictEqual(res2.valid, false);
    });

    it('should reject ages under 3 or over 18 years', () => {
      const toddler = validateChildProfile(existing, { fullName: 'Baby', age: 2 });
      assert.strictEqual(toddler.valid, false);
      assert.ok(toddler.error?.includes('between 3 and 18'));

      const adult = validateChildProfile(existing, { fullName: 'Adult', age: 19 });
      assert.strictEqual(adult.valid, false);
    });

    it('should auto-derive grade classification when grade is omitted', () => {
      const preschooler = validateChildProfile(existing, { fullName: 'Little Boy', age: 4 });
      assert.strictEqual(preschooler.child?.grade, 'Preschool');

      const schoolAge = validateChildProfile(existing, { fullName: 'School Girl', age: 10 });
      assert.strictEqual(schoolAge.child?.grade, 'Grade 5'); // 10 - 5 = 5
    });
  });

  describe('Duplicate Sibling Prevention Guard', () => {
    it('should prevent adding duplicate child records with the same name', () => {
      const family: ChildRecord[] = [
        {
          id: 'c-1',
          parentId: 'p-1',
          fullName: 'Aarav Sharma',
          age: 8,
          grade: 'Grade 3',
          interests: [],
        },
      ];

      const dupAttempt = validateChildProfile(family, {
        fullName: 'aarav sharma', // Case-insensitive duplicate
        age: 8,
      });

      assert.strictEqual(dupAttempt.valid, false);
      assert.ok(dupAttempt.error?.includes('is already registered under your family account'));
    });

    it('should permit distinct siblings with different names', () => {
      const family: ChildRecord[] = [
        {
          id: 'c-1',
          parentId: 'p-1',
          fullName: 'Aarav Sharma',
          age: 8,
          grade: 'Grade 3',
          interests: [],
        },
      ];

      const sibling = validateChildProfile(family, {
        fullName: 'Diya Sharma',
        age: 6,
      });

      assert.strictEqual(sibling.valid, true);
      assert.strictEqual(sibling.child?.fullName, 'Diya Sharma');
    });
  });

  describe('Emergency Contact Phone Normalization', () => {
    it('should normalize various phone number formats into standard +91 XXXXX XXXXX format', () => {
      const existing: ChildRecord[] = [];

      const res = validateChildProfile(existing, {
        fullName: 'Kabir',
        age: 11,
        emergencyPhone: '9837011222',
      });
      assert.strictEqual(res.child?.emergencyContactPhone, '+91 98370 11222');
    });

    it('should reject invalid phone numbers with wrong number of digits', () => {
      const existing: ChildRecord[] = [];

      const res = validateChildProfile(existing, {
        fullName: 'Kabir',
        age: 11,
        emergencyPhone: '12345', // Only 5 digits
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('valid 10-digit Indian mobile number'));
    });
  });
});
