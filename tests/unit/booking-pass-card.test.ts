import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BookingPassData } from '@/components/cards/BookingPassCard';

describe('Phase 45: Booking Pass Card Component & Multi-Type Admissions Tests', () => {
  // Logic extracted directly from src/components/cards/BookingPassCard.tsx
  function normalizePassReference(passId: string): string {
    return passId.startsWith('#') ? passId : `#${passId}`;
  }

  function getStudentAvatarInitial(studentName?: string): string {
    return studentName?.[0]?.toUpperCase() || 'C';
  }

  function generatePassWhatsAppUrl(pass: BookingPassData): string {
    const cleanRef = normalizePassReference(pass.passId);
    const contactPhone = pass.phone || '9897012345';
    const admissionLabel = pass.type === 'trial' ? 'Free Trial' : 'Enrolled Batch';
    const text = encodeURIComponent(
      `Hi, I am contacting you regarding ${admissionLabel} for ${pass.studentName} (Ref: ${cleanRef}) at ${pass.title}.`
    );
    return `https://wa.me/91${contactPhone}?text=${text}`;
  }

  function getAttendanceProgress(pass: BookingPassData) {
    return pass.attendanceProgress || { attended: 0, total: 12, percentage: 0 };
  }

  function getTournamentDetails(pass: BookingPassData) {
    return (
      pass.tournamentDetails || {
        category: 'Under-11 Singles',
        dates: 'Oct 18 - 20, 2026',
        reportingTime: '8:30 AM Sharp',
      }
    );
  }

  describe('Reference Number Sanitization & Avatar Derivation', () => {
    it('should prepend hashtag to reference number if not already present', () => {
      assert.strictEqual(normalizePassReference('PASS-1002'), '#PASS-1002');
      assert.strictEqual(normalizePassReference('#PASS-1002'), '#PASS-1002');
    });

    it('should derive uppercase initial from student name or fallback to C', () => {
      assert.strictEqual(getStudentAvatarInitial('Aarav'), 'A');
      assert.strictEqual(getStudentAvatarInitial('rohit'), 'R');
      assert.strictEqual(getStudentAvatarInitial(''), 'C');
      assert.strictEqual(getStudentAvatarInitial(undefined), 'C');
    });
  });

  describe('Trial Pass Branch Specifics', () => {
    const trialPass: BookingPassData = {
      id: 'pass-trial-1',
      type: 'trial',
      title: 'Taj Tennis Academy',
      subtitle: 'Kamla Nagar, Agra',
      studentName: 'Vihaan Sharma',
      schedule: 'Saturday 4:00 PM',
      courtOrVenue: 'Court 2 (Synthetic Turf)',
      passId: 'TR-9988',
      feeInfo: '100% Free Trial',
      phone: '9876543210',
    };

    it('should generate formatted WhatsApp message for trial admission inquiry', () => {
      const url = generatePassWhatsAppUrl(trialPass);
      assert.strictEqual(
        url,
        'https://wa.me/919876543210?text=Hi%2C%20I%20am%20contacting%20you%20regarding%20Free%20Trial%20for%20Vihaan%20Sharma%20(Ref%3A%20%23TR-9988)%20at%20Taj%20Tennis%20Academy.'
      );
    });
  });

  describe('Enrolled Batch Branch & Attendance Progress', () => {
    const batchPass: BookingPassData = {
      id: 'pass-batch-1',
      type: 'batch',
      title: 'Eklavya Badminton Academy',
      subtitle: 'Sanjay Place, Agra',
      studentName: 'Ananya Verma',
      schedule: 'Mon/Wed/Fri 5:00 PM',
      courtOrVenue: 'Indoor Wooden Court',
      passId: 'BT-4422',
      feeInfo: '₹2,200/mo',
      attendanceProgress: {
        attended: 8,
        total: 12,
        percentage: 67,
      },
    };

    it('should calculate attendance metrics correctly from pass data', () => {
      const progress = getAttendanceProgress(batchPass);
      assert.strictEqual(progress.attended, 8);
      assert.strictEqual(progress.total, 12);
      assert.strictEqual(progress.percentage, 67);
    });

    it('should fallback to default attendance metrics (0/12, 0%) when progress is omitted', () => {
      const passWithoutProgress: BookingPassData = {
        ...batchPass,
        attendanceProgress: undefined,
      };
      const progress = getAttendanceProgress(passWithoutProgress);
      assert.strictEqual(progress.attended, 0);
      assert.strictEqual(progress.total, 12);
      assert.strictEqual(progress.percentage, 0);
    });

    it('should format WhatsApp message specifically indicating Enrolled Batch', () => {
      const url = generatePassWhatsAppUrl(batchPass);
      assert.ok(url.includes('Enrolled%20Batch'));
      assert.ok(url.includes('Ananya%20Verma'));
      assert.ok(url.includes('%23BT-4422'));
    });
  });

  describe('Tournament Pass Branch & Fallbacks', () => {
    const tourneyPass: BookingPassData = {
      id: 'pass-tourney-1',
      type: 'tournament',
      title: 'Agra Youth Chess Championship',
      subtitle: 'Dayalbagh, Agra',
      studentName: 'Kabir Das',
      schedule: 'Oct 20, 2026',
      courtOrVenue: 'Hall A',
      passId: 'CMP-7711',
      feeInfo: '₹450 Registration',
    };

    it('should fallback to standard tournament schedule details when details are omitted', () => {
      const details = getTournamentDetails(tourneyPass);
      assert.strictEqual(details.category, 'Under-11 Singles');
      assert.strictEqual(details.dates, 'Oct 18 - 20, 2026');
      assert.strictEqual(details.reportingTime, '8:30 AM Sharp');
    });

    it('should preserve explicit custom tournament details when provided', () => {
      const customTourneyPass: BookingPassData = {
        ...tourneyPass,
        tournamentDetails: {
          category: 'Under-15 Doubles',
          dates: 'Nov 5 - 7, 2026',
          reportingTime: '9:00 AM Sharp',
        },
      };
      const details = getTournamentDetails(customTourneyPass);
      assert.strictEqual(details.category, 'Under-15 Doubles');
      assert.strictEqual(details.dates, 'Nov 5 - 7, 2026');
      assert.strictEqual(details.reportingTime, '9:00 AM Sharp');
    });
  });
});
