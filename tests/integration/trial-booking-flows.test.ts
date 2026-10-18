import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PassType, EscrowStatus } from '@prisma/client';
import crypto from 'node:crypto';

describe('Phase 12: Parent Trial Booking Flow & Duplicate Guard Tests', () => {
  interface MockBooking {
    id: string;
    passId: string;
    passType: PassType;
    parentId: string;
    childId: string;
    coachingCentreId: string;
    batchId: string | null;
    grossAmount: number;
    feePaid: number;
    escrowStatus: EscrowStatus;
    qrCode: string;
    status: 'CONFIRMED' | 'PENDING' | 'ALREADY_BOOKED' | 'CANCELLED';
  }

  interface MockLead {
    coachingCentreId: string;
    parentName: string;
    parentPhone: string;
    childName: string;
    childAge: number;
    status: string;
  }

  // Simulated in-memory database
  class InMemoryBookingDB {
    bookings: MockBooking[] = [];
    leads: MockLead[] = [];

    // Replicating bookTrialSession core logic from actions.ts
    bookTrialSession(data: {
      centreId: string;
      centreName: string;
      batchId?: string;
      childName?: string;
      childNames?: string[];
      childId?: string;
      childIds?: string[];
      date: string;
      timeSlot: string;
      parentPhone?: string;
      parentEmail?: string;
      parentName?: string;
    }) {
      // 1. Enforce authentication guard
      if (!data.parentEmail || !data.parentEmail.trim()) {
        return {
          success: false,
          isExisting: false,
          bookingId: '',
          centreId: data.centreId,
          childName: data.childName || 'Child',
          date: data.date,
          timeSlot: data.timeSlot,
          feePaid: 0,
          qrCode: '',
          status: 'CANCELLED' as const,
          message: 'Please log in or sign up to book a free trial session.',
        };
      }

      const parentId = `parent-${data.parentEmail.trim().toLowerCase()}`;
      const children = data.childNames && data.childNames.length > 0
        ? data.childNames.map((name, i) => ({ id: `ch-${i}-${name.toLowerCase()}`, fullName: name, age: 8 }))
        : [{ id: data.childId || 'ch-default', fullName: data.childName || 'Child', age: 8 }];

      const newlyBookedChildren: any[] = [];
      const alreadyBookedChildren: any[] = [];
      let firstExistingBooking: MockBooking | null = null;
      let firstNewBookingId: string | null = null;

      for (const child of children) {
        // Duplicate check: Does this child already have a free trial pass for this centre?
        const existingTrial = this.bookings.find(
          (b) =>
            b.parentId === parentId &&
            b.childId === child.id &&
            b.coachingCentreId === data.centreId &&
            b.passType === PassType.FREE_TRIAL
        );

        if (existingTrial) {
          alreadyBookedChildren.push({ child, passId: existingTrial.passId });
          if (!firstExistingBooking) firstExistingBooking = existingTrial;
        } else {
          const curBookingId = `TRL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
          if (!firstNewBookingId) firstNewBookingId = curBookingId;

          const newBooking: MockBooking = {
            id: `bk-${Date.now()}-${child.id}`,
            passId: curBookingId,
            passType: PassType.FREE_TRIAL,
            parentId,
            childId: child.id,
            coachingCentreId: data.centreId,
            batchId: data.batchId || null,
            grossAmount: 0.0,
            feePaid: 0.0,
            escrowStatus: EscrowStatus.RELEASED_TO_COACH,
            qrCode: `KUC-PASS-${curBookingId}`,
            status: 'CONFIRMED',
          };

          this.bookings.push(newBooking);
          newlyBookedChildren.push(newBooking);

          // Record lead for coaching centre
          this.leads.push({
            coachingCentreId: data.centreId,
            parentName: data.parentName || 'Parent',
            parentPhone: data.parentPhone || '',
            childName: child.fullName,
            childAge: child.age,
            status: 'TRIAL_BOOKED',
          });
        }
      }

      // If all children were already booked
      if (newlyBookedChildren.length === 0 && alreadyBookedChildren.length > 0) {
        const passId = firstExistingBooking ? firstExistingBooking.passId : '';
        return {
          success: true,
          isExisting: true,
          bookingId: passId,
          centreId: data.centreId,
          childName: alreadyBookedChildren.map((item) => item.child.fullName).join(', '),
          date: data.date,
          timeSlot: data.timeSlot,
          feePaid: 0,
          qrCode: `KUC-PASS-${passId}`,
          status: 'ALREADY_BOOKED' as const,
          message: `A Free Trial pass has already been issued for this academy (${passId}).`,
        };
      }

      // At least one new child booked
      const confirmedPassId = firstNewBookingId || '';
      return {
        success: true,
        isExisting: false,
        bookingId: confirmedPassId,
        centreId: data.centreId,
        childName: newlyBookedChildren.map((b) => b.childId).join(', '),
        date: data.date,
        timeSlot: data.timeSlot,
        feePaid: 0,
        qrCode: `KUC-PASS-${confirmedPassId}`,
        status: 'CONFIRMED' as const,
        message: 'Free trial booking confirmed successfully!',
      };
    }
  }

  describe('Unauthenticated Guest Protection Guard', () => {
    it('should reject booking attempt when parent email is empty or missing', () => {
      const db = new InMemoryBookingDB();
      const result = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-25',
        timeSlot: '4:00 PM - 5:00 PM',
        childName: 'Aarav',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 'CANCELLED');
      assert.ok(result.message.includes('Please log in or sign up'));
      assert.strictEqual(db.bookings.length, 0);
      assert.strictEqual(db.leads.length, 0);
    });
  });

  describe('Initial Free Trial Booking Flow', () => {
    it('should generate a valid free trial booking with zero fee and qrCode', () => {
      const db = new InMemoryBookingDB();
      const result = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-25',
        timeSlot: '4:00 PM - 5:00 PM',
        parentEmail: 'parent.sharma@example.com',
        parentName: 'Sunita Sharma',
        parentPhone: '+91 98765 43210',
        childName: 'Aarav Sharma',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, 'CONFIRMED');
      assert.strictEqual(result.isExisting, false);
      assert.strictEqual(result.feePaid, 0);
      assert.ok(result.bookingId.startsWith('TRL-'));
      assert.strictEqual(result.qrCode, `KUC-PASS-${result.bookingId}`);

      // Verify database state
      assert.strictEqual(db.bookings.length, 1);
      const b = db.bookings[0];
      assert.strictEqual(b.passType, PassType.FREE_TRIAL);
      assert.strictEqual(b.grossAmount, 0.0);
      assert.strictEqual(b.escrowStatus, EscrowStatus.RELEASED_TO_COACH);

      // Verify coach lead capture
      assert.strictEqual(db.leads.length, 1);
      assert.strictEqual(db.leads[0].parentName, 'Sunita Sharma');
      assert.strictEqual(db.leads[0].childName, 'Aarav Sharma');
    });
  });

  describe('Free Trial Duplicate Prevention Guard', () => {
    it('should detect when child already has an active trial and return ALREADY_BOOKED', () => {
      const db = new InMemoryBookingDB();

      // First booking
      const first = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-25',
        timeSlot: '4:00 PM - 5:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childName: 'Aarav Sharma',
        childId: 'ch-aarav',
      });

      assert.strictEqual(first.status, 'CONFIRMED');
      const originalPassId = first.bookingId;

      // Duplicate booking attempt by same parent for same child at same centre
      const duplicate = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-26',
        timeSlot: '5:00 PM - 6:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childName: 'Aarav Sharma',
        childId: 'ch-aarav',
      });

      assert.strictEqual(duplicate.success, true);
      assert.strictEqual(duplicate.isExisting, true);
      assert.strictEqual(duplicate.status, 'ALREADY_BOOKED');
      assert.strictEqual(duplicate.bookingId, originalPassId);
      assert.ok(duplicate.message.includes('A Free Trial pass has already been issued'));

      // Ensure no duplicate booking or duplicate lead was created in DB
      assert.strictEqual(db.bookings.length, 1);
      assert.strictEqual(db.leads.length, 1);
    });

    it('should allow same parent to book trial for same child at a DIFFERENT coaching centre', () => {
      const db = new InMemoryBookingDB();

      // Booking at Delhi Tennis Club
      const b1 = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-25',
        timeSlot: '4:00 PM - 5:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childName: 'Aarav Sharma',
        childId: 'ch-aarav',
      });
      assert.strictEqual(b1.status, 'CONFIRMED');

      // Booking at Agra Badminton Academy
      const b2 = db.bookTrialSession({
        centreId: 'centre-agra-02',
        centreName: 'Agra Badminton Academy',
        date: '2026-10-28',
        timeSlot: '6:00 PM - 7:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childName: 'Aarav Sharma',
        childId: 'ch-aarav',
      });
      assert.strictEqual(b2.status, 'CONFIRMED');
      assert.notStrictEqual(b1.bookingId, b2.bookingId);
      assert.strictEqual(db.bookings.length, 2);
    });
  });

  describe('Multi-Child Sibling Booking Flow', () => {
    it('should confirm new child when sibling already has a trial booking', () => {
      const db = new InMemoryBookingDB();

      // Child 1 (Aarav) was previously booked
      db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-25',
        timeSlot: '4:00 PM - 5:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childNames: ['Aarav'],
      });

      assert.strictEqual(db.bookings.length, 1);

      // Now parent books for both Aarav and Diya
      const multiResult = db.bookTrialSession({
        centreId: 'centre-delhi-01',
        centreName: 'Delhi Tennis Club',
        date: '2026-10-30',
        timeSlot: '4:00 PM - 5:00 PM',
        parentEmail: 'parent.sharma@example.com',
        childNames: ['Aarav', 'Diya'],
      });

      // Overall result should be CONFIRMED because Diya is new
      assert.strictEqual(multiResult.status, 'CONFIRMED');
      assert.strictEqual(multiResult.isExisting, false);

      // Total bookings should now be 2 (Aarav + Diya)
      assert.strictEqual(db.bookings.length, 2);
    });
  });
});
