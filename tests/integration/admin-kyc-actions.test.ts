import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KycStatus, SafetyGrade, SubscriptionPlan } from '@prisma/client';
import {
  parseDocsPayload,
  buildStatusNotesWithDocs,
  CoachDocsPayload,
} from '@/lib/coach-docs';

describe('Phase 11: Admin KYC Verification & Inspection Audits Tests', () => {
  interface MockCentre {
    id: string;
    name: string;
    headCoachName: string;
    kycStatus: KycStatus;
    safetyGrade: SafetyGrade;
    planTier: SubscriptionPlan;
    isActive: boolean;
    isSuspended: boolean;
    isVerifiedBatch: boolean;
    isTopInArea: boolean;
    statusNotes: string | null;
    rejectionReason: string | null;
    referredBackRemarks: string | null;
    owner: {
      id: string;
      email: string;
    };
  }

  // Replicating admin session guard logic from actions.ts
  function checkAdminPrivileges(user: { role?: string; email?: string | null } | null | undefined): boolean {
    if (!user) return false;
    const userRole = String(user.role || '').toUpperCase();
    if (userRole === 'ADMIN') return true;
    const configuredAdmin = 'admin@knowurcoach.in';
    const userEmail = user.email?.trim().toLowerCase();
    return Boolean(userEmail && userEmail === configuredAdmin);
  }

  // Replicating approveCoachKyc core transformation from actions.ts
  function executeApproveCoachKyc(centre: MockCentre, inspector: string = 'Er. S. Rawat') {
    const existingPayload = parseDocsPayload(centre);

    const verifiedPayload = existingPayload
      ? {
          ...existingPayload,
          govId: existingPayload.govId ? { ...existingPayload.govId, status: 'VERIFIED' as const } : undefined,
          nisCert: existingPayload.nisCert ? { ...existingPayload.nisCert, status: 'VERIFIED' as const } : undefined,
          verifiedAt: '2026-10-18T10:00:00.000Z',
        }
      : null;

    const approvalText = `Approved & Verified by ${inspector} on 18/10/2026`;
    const newStatusNotes = verifiedPayload
      ? buildStatusNotesWithDocs(approvalText, verifiedPayload)
      : approvalText;

    const isPremier = centre.planTier === SubscriptionPlan.PREMIUM;

    return {
      ...centre,
      kycStatus: KycStatus.APPROVED,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      isSuspended: false,
      isActive: true,
      isVerifiedBatch: true,
      isTopInArea: isPremier ? true : centre.isTopInArea,
      statusNotes: newStatusNotes,
      rejectionReason: null,
      referredBackRemarks: null,
    };
  }

  // Replicating rejectCoachKyc core transformation from actions.ts
  function executeRejectCoachKyc(centre: MockCentre, reason: string, inspector: string = 'Er. S. Rawat') {
    const existingPayload = parseDocsPayload(centre);
    const rejectionText = `Rejected by ${inspector} on 18/10/2026`;
    const newStatusNotes = existingPayload
      ? buildStatusNotesWithDocs(rejectionText, existingPayload)
      : rejectionText;

    return {
      ...centre,
      kycStatus: KycStatus.REJECTED,
      rejectionReason: reason,
      statusNotes: newStatusNotes,
    };
  }

  // Replicating referBackCoachKyc core transformation from actions.ts
  function executeReferBackCoachKyc(centre: MockCentre, remarks: string, inspector: string = 'Er. S. Rawat') {
    const existingPayload = parseDocsPayload(centre);
    const referText = `Referred back by ${inspector} on 18/10/2026: ${remarks}`;
    const newStatusNotes = existingPayload
      ? buildStatusNotesWithDocs(referText, existingPayload)
      : referText;

    return {
      ...centre,
      kycStatus: KycStatus.REFERRED_BACK,
      referredBackRemarks: remarks,
      statusNotes: newStatusNotes,
    };
  }

  describe('Admin Authorization Guard', () => {
    it('should grant access when user role is ADMIN', () => {
      assert.strictEqual(checkAdminPrivileges({ role: 'ADMIN', email: 'mod@platform.com' }), true);
      assert.strictEqual(checkAdminPrivileges({ role: 'admin', email: 'mod@platform.com' }), true);
    });

    it('should grant access when user email matches configured ADMIN_EMAIL even if role is not set', () => {
      assert.strictEqual(checkAdminPrivileges({ role: 'COACH', email: 'admin@knowurcoach.in' }), true);
    });

    it('should deny access when user is a regular coach or parent', () => {
      assert.strictEqual(checkAdminPrivileges({ role: 'COACH', email: 'coach.rajesh@gmail.com' }), false);
      assert.strictEqual(checkAdminPrivileges({ role: 'PARENT', email: 'parent.sunita@gmail.com' }), false);
      assert.strictEqual(checkAdminPrivileges(null), false);
      assert.strictEqual(checkAdminPrivileges(undefined), false);
    });
  });

  describe('approveCoachKyc Action Flow', () => {
    const initialCentre: MockCentre = {
      id: 'ctr-agra-01',
      name: 'Agra Badminton Star Academy',
      headCoachName: 'Rajesh Sharma',
      kycStatus: KycStatus.DOCS_REVIEW,
      safetyGrade: SafetyGrade.PENDING_AUDIT,
      planTier: SubscriptionPlan.STANDARD,
      isActive: false,
      isSuspended: false,
      isVerifiedBatch: false,
      isTopInArea: false,
      statusNotes: 'Under initial document audit <!--DOCS_PAYLOAD:{"govId":{"name":"Aadhaar_ID.pdf","status":"PENDING"},"nisCert":{"name":"NIS_Patiala.pdf","status":"PENDING"}}-->',
      rejectionReason: 'Previous blurry photo',
      referredBackRemarks: 'Please upload original PDF',
      owner: { id: 'usr-01', email: 'rajesh@agrasports.com' },
    };

    it('should set kycStatus to APPROVED, safetyGrade to GRADE_A_PLUS, and activate academy', () => {
      const approved = executeApproveCoachKyc(initialCentre);

      assert.strictEqual(approved.kycStatus, KycStatus.APPROVED);
      assert.strictEqual(approved.safetyGrade, SafetyGrade.GRADE_A_PLUS);
      assert.strictEqual(approved.isActive, true);
      assert.strictEqual(approved.isSuspended, false);
      assert.strictEqual(approved.isVerifiedBatch, true);
    });

    it('should clear past rejection reasons and referred back remarks', () => {
      const approved = executeApproveCoachKyc(initialCentre);

      assert.strictEqual(approved.rejectionReason, null);
      assert.strictEqual(approved.referredBackRemarks, null);
    });

    it('should preserve doc metadata and promote sub-document statuses to VERIFIED', () => {
      const approved = executeApproveCoachKyc(initialCentre);

      assert.ok(approved.statusNotes);
      const parsed = parseDocsPayload(approved);
      assert.ok(parsed);
      assert.strictEqual(parsed.govId?.name, 'Aadhaar_ID.pdf');
      assert.strictEqual(parsed.govId?.status, 'VERIFIED');
      assert.strictEqual(parsed.nisCert?.name, 'NIS_Patiala.pdf');
      assert.strictEqual(parsed.nisCert?.status, 'VERIFIED');
      assert.strictEqual(parsed.verifiedAt, '2026-10-18T10:00:00.000Z');
    });

    it('should automatically grant isTopInArea for PREMIER account tier', () => {
      const premierCentre: MockCentre = {
        ...initialCentre,
        planTier: SubscriptionPlan.PREMIUM,
        isTopInArea: false,
      };

      const approved = executeApproveCoachKyc(premierCentre);
      assert.strictEqual(approved.isTopInArea, true);
    });

    it('should keep isTopInArea as false for standard tier unless previously promoted', () => {
      const standardCentre: MockCentre = {
        ...initialCentre,
        planTier: SubscriptionPlan.STANDARD,
        isTopInArea: false,
      };

      const approved = executeApproveCoachKyc(standardCentre);
      assert.strictEqual(approved.isTopInArea, false);
    });
  });

  describe('rejectCoachKyc Action Flow', () => {
    const centre: MockCentre = {
      id: 'ctr-agra-02',
      name: 'Fake Sports Club',
      headCoachName: 'Unknown',
      kycStatus: KycStatus.PENDING,
      safetyGrade: SafetyGrade.PENDING_AUDIT,
      planTier: SubscriptionPlan.FREE,
      isActive: false,
      isSuspended: false,
      isVerifiedBatch: false,
      isTopInArea: false,
      statusNotes: null,
      rejectionReason: null,
      referredBackRemarks: null,
      owner: { id: 'usr-02', email: 'fake@club.com' },
    };

    it('should mark kycStatus as REJECTED and record the specific rejection reason', () => {
      const rejected = executeRejectCoachKyc(centre, 'Fraudulent NIS Certificate provided.');

      assert.strictEqual(rejected.kycStatus, KycStatus.REJECTED);
      assert.strictEqual(rejected.rejectionReason, 'Fraudulent NIS Certificate provided.');
      assert.ok(rejected.statusNotes?.includes('Rejected by Er. S. Rawat'));
    });
  });

  describe('referBackCoachKyc Action Flow', () => {
    const centre: MockCentre = {
      id: 'ctr-agra-03',
      name: 'Kamla Nagar Tennis',
      headCoachName: 'Vikram',
      kycStatus: KycStatus.DOCS_REVIEW,
      safetyGrade: SafetyGrade.GRADE_B,
      planTier: SubscriptionPlan.STANDARD,
      isActive: false,
      isSuspended: false,
      isVerifiedBatch: false,
      isTopInArea: false,
      statusNotes: 'Under review <!--DOCS_PAYLOAD:{"govId":{"name":"doc.png","status":"PENDING"}}-->',
      rejectionReason: null,
      referredBackRemarks: null,
      owner: { id: 'usr-03', email: 'vikram@tennis.com' },
    };

    it('should set kycStatus to REFERRED_BACK and record the required remarks', () => {
      const referred = executeReferBackCoachKyc(
        centre,
        'Government ID photograph is blurry. Please upload clear scan of both sides.'
      );

      assert.strictEqual(referred.kycStatus, KycStatus.REFERRED_BACK);
      assert.strictEqual(
        referred.referredBackRemarks,
        'Government ID photograph is blurry. Please upload clear scan of both sides.'
      );
      assert.ok(referred.statusNotes?.includes('Referred back by Er. S. Rawat'));
      // Verifies document payload is preserved
      const parsed = parseDocsPayload(referred);
      assert.strictEqual(parsed?.govId?.name, 'doc.png');
    });
  });
});
