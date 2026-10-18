import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCentreSubscriptionStatus } from '@/lib/subscription';

describe('Phase 67: Coach Dashboard Component State Machine & Workflows', () => {
  // Types matching src/app/(dashboard)/coach/dashboard/page.tsx
  interface BatchItem {
    id?: string;
    name: string;
    category?: string;
    coachName?: string;
    schedule: string;
    ageGroup: string;
    totalSeats: number;
    seatsFilled?: number;
    monthlyFee: number;
  }

  interface StudentRosterItem {
    id: string;
    name: string;
    type: string;
    passInfo: string;
    initials: string;
    colorBg: string;
    colorText: string;
    status: 'present' | 'absent';
  }

  // Safety facilities mapping logic from CoachDashboardPage
  function extractSafetyFacilities(safetyChecklist: {
    cctvMonitored: boolean;
    nisCertified: boolean;
    policeVerifiedStaff: boolean;
    firstAidAvailable: boolean;
    girlChangingRoom: boolean;
    drinkingWater: boolean;
    fireSafety: boolean;
    sanitizedEquipment: boolean;
  }): string[] {
    return [
      safetyChecklist.cctvMonitored ? '24/7 CCTV Monitored' : null,
      safetyChecklist.nisCertified ? 'NIS Certified Head Coach' : null,
      safetyChecklist.policeVerifiedStaff ? 'Police Verified Staff' : null,
      safetyChecklist.firstAidAvailable ? 'First Aid & Medical Kit' : null,
      safetyChecklist.girlChangingRoom ? 'Girl Changing Room' : null,
      safetyChecklist.drinkingWater ? 'Purified Drinking Water' : null,
      safetyChecklist.fireSafety ? 'Fire Safety & Extinguisher' : null,
      safetyChecklist.sanitizedEquipment ? 'Sanitized Equipment' : null,
    ].filter(Boolean) as string[];
  }

  // KYC validation engine logic from handleSubmitKyc in CoachDashboardPage
  function validateKycSubmission(params: {
    docGovIdName?: string;
    docGovIdUrl?: string;
    batches: BatchItem[];
  }): { valid: boolean; errorField?: string; message?: string } {
    if (!params.docGovIdName && !params.docGovIdUrl) {
      return {
        valid: false,
        errorField: 'docs',
        message: 'Coach Govt ID (Aadhaar / Voter ID) is mandatory for verification.',
      };
    }

    if (!params.batches || params.batches.length === 0) {
      return {
        valid: false,
        errorField: 'batches',
        message: 'Please configure at least one coaching batch with timings, category, and fee.',
      };
    }

    for (let i = 0; i < params.batches.length; i++) {
      const b = params.batches[i];
      if (!b.name || !b.name.trim()) {
        return { valid: false, errorField: 'batches', message: `Please enter a Batch Name for Batch #${i + 1}` };
      }
      if (!b.category || !b.category.trim()) {
        return { valid: false, errorField: 'batches', message: `Please select an Activity/Category for Batch #${i + 1}` };
      }
      if (!b.schedule || !b.schedule.trim()) {
        return { valid: false, errorField: 'batches', message: `Please enter Schedule & Timings for Batch #${i + 1}` };
      }
      if (!b.ageGroup || !b.ageGroup.trim()) {
        return { valid: false, errorField: 'batches', message: `Please enter Age Group for Batch #${i + 1}` };
      }
      if (!b.totalSeats || b.totalSeats < 1) {
        return { valid: false, errorField: 'batches', message: `Please set valid Capacity (min 1 seat) for Batch #${i + 1}` };
      }
      if (b.monthlyFee === undefined || b.monthlyFee === null || b.monthlyFee < 0) {
        return { valid: false, errorField: 'batches', message: `Please enter Monthly Tuition Fee for Batch #${i + 1}` };
      }
    }

    return { valid: true };
  }

  // Check-in authorization guard from handleCheckIn
  function canCheckInStudent(kycStatus: string, centreIsActive?: boolean): boolean {
    return kycStatus === 'APPROVED' || Boolean(centreIsActive);
  }

  // Batch deletion guard from handleRemoveBatch
  function removeBatchAtIndex(batches: BatchItem[], index: number): BatchItem[] {
    if (batches.length <= 1) {
      // Guard: must preserve at least one batch
      return batches;
    }
    return batches.filter((_, idx) => idx !== index);
  }

  // Default batch creation generator from handleAddBatch
  function createDefaultBatch(centreData: any, existingCount: number): BatchItem {
    const defaultCat =
      (centreData?.categories && centreData.categories[0]) ||
      (centreData?.category ? centreData.category.split(',')[0].trim().toLowerCase() : 'badminton');

    return {
      name: `Batch #${existingCount + 1}`,
      category: defaultCat,
      coachName: centreData?.headCoachName || '',
      schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM',
      ageGroup: '7 - 14 Yrs',
      totalSeats: 15,
      seatsFilled: 0,
      monthlyFee: 1800,
    };
  }

  describe('KYC Profile Form Validation Rules', () => {
    it('should reject submission if Govt ID document name and URL are both missing', () => {
      const res = validateKycSubmission({
        docGovIdName: '',
        docGovIdUrl: '',
        batches: [
          {
            name: 'Morning Juniors',
            category: 'badminton',
            schedule: 'Mon-Wed-Fri 7AM',
            ageGroup: '6-12 Yrs',
            totalSeats: 10,
            monthlyFee: 1500,
          },
        ],
      });

      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorField, 'docs');
      assert.match(res.message || '', /Govt ID/i);
    });

    it('should accept submission if Govt ID URL is provided even if filename is empty', () => {
      const res = validateKycSubmission({
        docGovIdUrl: 'data:image/jpeg;base64,sample...',
        batches: [
          {
            name: 'Morning Juniors',
            category: 'badminton',
            schedule: 'Mon-Wed-Fri 7AM',
            ageGroup: '6-12 Yrs',
            totalSeats: 10,
            monthlyFee: 1500,
          },
        ],
      });

      assert.strictEqual(res.valid, true);
    });

    it('should reject submission if batch list is completely empty', () => {
      const res = validateKycSubmission({
        docGovIdName: 'Aadhaar_Card.pdf',
        batches: [],
      });

      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errorField, 'batches');
      assert.match(res.message || '', /at least one coaching batch/i);
    });

    it('should reject batch with missing name or invalid capacity (< 1)', () => {
      const missingNameRes = validateKycSubmission({
        docGovIdName: 'Aadhaar.pdf',
        batches: [
          {
            name: '',
            category: 'cricket',
            schedule: 'Daily 4PM',
            ageGroup: '8-14 Yrs',
            totalSeats: 12,
            monthlyFee: 2000,
          },
        ],
      });
      assert.strictEqual(missingNameRes.valid, false);
      assert.match(missingNameRes.message || '', /Batch Name/i);

      const invalidCapacityRes = validateKycSubmission({
        docGovIdName: 'Aadhaar.pdf',
        batches: [
          {
            name: 'Evening Pro',
            category: 'cricket',
            schedule: 'Daily 4PM',
            ageGroup: '8-14 Yrs',
            totalSeats: 0,
            monthlyFee: 2000,
          },
        ],
      });
      assert.strictEqual(invalidCapacityRes.valid, false);
      assert.match(invalidCapacityRes.message || '', /valid Capacity/i);
    });

    it('should reject batch with negative monthly tuition fee', () => {
      const res = validateKycSubmission({
        docGovIdName: 'Aadhaar.pdf',
        batches: [
          {
            name: 'Evening Pro',
            category: 'cricket',
            schedule: 'Daily 4PM',
            ageGroup: '8-14 Yrs',
            totalSeats: 10,
            monthlyFee: -500,
          },
        ],
      });

      assert.strictEqual(res.valid, false);
      assert.match(res.message || '', /Monthly Tuition Fee/i);
    });
  });

  describe('Safety Checklist & Facility Extraction', () => {
    it('should map active safety toggles to platform facility badges', () => {
      const facilities = extractSafetyFacilities({
        cctvMonitored: true,
        nisCertified: true,
        policeVerifiedStaff: false,
        firstAidAvailable: true,
        girlChangingRoom: true,
        drinkingWater: true,
        fireSafety: false,
        sanitizedEquipment: false,
      });

      assert.ok(facilities.includes('24/7 CCTV Monitored'));
      assert.ok(facilities.includes('NIS Certified Head Coach'));
      assert.ok(facilities.includes('First Aid & Medical Kit'));
      assert.ok(facilities.includes('Girl Changing Room'));
      assert.ok(facilities.includes('Purified Drinking Water'));
      assert.ok(!facilities.includes('Police Verified Staff'));
      assert.ok(!facilities.includes('Fire Safety & Extinguisher'));
      assert.strictEqual(facilities.length, 5);
    });

    it('should return empty facilities list when all toggles are disabled', () => {
      const facilities = extractSafetyFacilities({
        cctvMonitored: false,
        nisCertified: false,
        policeVerifiedStaff: false,
        firstAidAvailable: false,
        girlChangingRoom: false,
        drinkingWater: false,
        fireSafety: false,
        sanitizedEquipment: false,
      });

      assert.strictEqual(facilities.length, 0);
    });
  });

  describe('Live Student Roster & Attendance Guard Logic', () => {
    it('should disallow student check-in if KYC status is PENDING and centre is inactive', () => {
      assert.strictEqual(canCheckInStudent('PENDING', false), false);
      assert.strictEqual(canCheckInStudent('DOCS_REVIEW', false), false);
      assert.strictEqual(canCheckInStudent('REJECTED', false), false);
    });

    it('should allow student check-in if KYC status is APPROVED or centre isActive is true', () => {
      assert.strictEqual(canCheckInStudent('APPROVED', false), true);
      assert.strictEqual(canCheckInStudent('PENDING', true), true);
    });

    it('should calculate present count accurately from student roster', () => {
      const roster: StudentRosterItem[] = [
        {
          id: 's1',
          name: 'Aarav Sharma',
          type: 'Trial Class',
          passInfo: 'Pass: REF-100001',
          initials: 'AS',
          colorBg: 'bg-blue-100',
          colorText: 'text-blue-700',
          status: 'present',
        },
        {
          id: 's2',
          name: 'Ananya Verma',
          type: 'Enrolled',
          passInfo: 'Pass: REF-100002',
          initials: 'AV',
          colorBg: 'bg-blue-100',
          colorText: 'text-blue-700',
          status: 'absent',
        },
        {
          id: 's3',
          name: 'Rohan Gupta',
          type: 'Enrolled',
          passInfo: 'Pass: REF-100003',
          initials: 'RG',
          colorBg: 'bg-blue-100',
          colorText: 'text-blue-700',
          status: 'present',
        },
      ];

      const presentCount = roster.filter((s) => s.status === 'present').length;
      assert.strictEqual(presentCount, 2);
    });
  });

  describe('Batch Operations & Boundary Constraints', () => {
    it('should generate default batch inheriting centre primary category', () => {
      const centreData = {
        category: 'football, swimming',
        headCoachName: 'Coach Vikram',
      };

      const newBatch = createDefaultBatch(centreData, 2);
      assert.strictEqual(newBatch.name, 'Batch #3');
      assert.strictEqual(newBatch.category, 'football');
      assert.strictEqual(newBatch.coachName, 'Coach Vikram');
      assert.strictEqual(newBatch.totalSeats, 15);
      assert.strictEqual(newBatch.monthlyFee, 1800);
    });

    it('should fallback to badminton if centre has no configured category', () => {
      const newBatch = createDefaultBatch({}, 0);
      assert.strictEqual(newBatch.category, 'badminton');
      assert.strictEqual(newBatch.name, 'Batch #1');
    });

    it('should prevent batch deletion if only one batch remains', () => {
      const singleBatch: BatchItem[] = [
        {
          name: 'Solo Batch',
          category: 'tennis',
          schedule: 'Sat-Sun 8AM',
          ageGroup: '10-16',
          totalSeats: 12,
          monthlyFee: 2500,
        },
      ];

      const updated = removeBatchAtIndex(singleBatch, 0);
      assert.strictEqual(updated.length, 1);
      assert.strictEqual(updated[0].name, 'Solo Batch');
    });

    it('should successfully remove batch at index when multiple batches exist', () => {
      const twoBatches: BatchItem[] = [
        { name: 'Batch 1', category: 'tennis', schedule: 'M-W-F', ageGroup: 'Under 12', totalSeats: 10, monthlyFee: 1500 },
        { name: 'Batch 2', category: 'tennis', schedule: 'T-T-S', ageGroup: 'Under 16', totalSeats: 12, monthlyFee: 1800 },
      ];

      const afterRemoval = removeBatchAtIndex(twoBatches, 0);
      assert.strictEqual(afterRemoval.length, 1);
      assert.strictEqual(afterRemoval[0].name, 'Batch 2');
    });
  });

  describe('Subscription Operational Integration', () => {
    it('should accurately compute isOperationsUnlocked and isPublicLive states', () => {
      const activeCentre = {
        id: 'centre-1',
        isSuspended: false,
        isActive: true,
        planTier: 'STANDARD',
        planExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      };

      const subStatus = getCentreSubscriptionStatus(activeCentre);
      assert.strictEqual(subStatus.canOperate, true);

      const isApproved = true;
      const isPublicLive = isApproved && subStatus.canOperate;
      assert.strictEqual(isPublicLive, true);
    });

    it('should lock operations when centre has expired subscription', () => {
      const expiredCentre = {
        id: 'centre-expired',
        isSuspended: false,
        isActive: true,
        planTier: 'STANDARD',
        planExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      };

      const subStatus = getCentreSubscriptionStatus(expiredCentre);
      assert.strictEqual(subStatus.canOperate, false);

      const isApproved = true;
      const isPublicLive = isApproved && subStatus.canOperate;
      assert.strictEqual(isPublicLive, false);
    });
  });
});
