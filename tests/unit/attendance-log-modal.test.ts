import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 39: Attendance Log Modal & Roll Call Metrics Tests', () => {
  // Logic extracted directly from src/components/modals/AttendanceLogModal.tsx
  function calculateAttendanceMetrics(modalData: any) {
    const studentName = modalData?.studentName || modalData?.childName || 'Student';
    const acadName = modalData?.acadName || modalData?.title || 'Academy';
    const batchName = modalData?.batchName || modalData?.courtOrVenue || 'Regular Batch';
    const schedule = modalData?.schedule || modalData?.sessionTime || 'Weekly Scheduled Timings';
    const coachName =
      modalData?.coachName && modalData.coachName !== 'Rajesh Mehra (NIS Certified)'
        ? modalData.coachName
        : 'Assigned Head Coach';
    const phone = modalData?.phone || '9897012345';

    const attended = typeof modalData?.attended === 'number' ? modalData.attended : 0;
    const total = typeof modalData?.total === 'number' && modalData.total > 0 ? modalData.total : 12;
    const percentage = Math.round((attended / total) * 100);

    const rawAttendances: any[] = Array.isArray(modalData?.attendances) ? modalData.attendances : [];
    const sessions = rawAttendances.map((att: any, idx: number) => {
      const sessionDate = att.date ? new Date(att.date) : new Date();
      return {
        classNo: rawAttendances.length - idx,
        status: att.isPresent ? 'PRESENT' : 'ABSENT',
        note: att.isPresent ? 'Roll call verified on court' : 'Absence recorded by coach',
      };
    });

    return {
      studentName,
      acadName,
      batchName,
      schedule,
      coachName,
      phone,
      attended,
      total,
      percentage,
      sessions,
    };
  }

  function generateCoachWhatsAppLink(studentName: string, batchName: string, acadName: string, phone: string) {
    const text = encodeURIComponent(
      `Hi Coach, I am contacting you regarding ${studentName}'s attendance in batch "${batchName}" at ${acadName}.`
    );
    return `https://wa.me/91${phone}?text=${text}`;
  }

  describe('Attendance Percentage & Zero Division Safety', () => {
    it('should compute exact attendance rate percentage rounded to whole integer', () => {
      const metrics1 = calculateAttendanceMetrics({ attended: 10, total: 12 });
      assert.strictEqual(metrics1.percentage, 83); // 10 / 12 = 83.33% -> 83%

      const metrics2 = calculateAttendanceMetrics({ attended: 12, total: 12 });
      assert.strictEqual(metrics2.percentage, 100);

      const metrics3 = calculateAttendanceMetrics({ attended: 0, total: 12 });
      assert.strictEqual(metrics3.percentage, 0);
    });

    it('should prevent zero division by falling back to 12 total sessions when total is zero or negative', () => {
      const metricsZero = calculateAttendanceMetrics({ attended: 6, total: 0 });
      assert.strictEqual(metricsZero.total, 12);
      assert.strictEqual(metricsZero.percentage, 50);

      const metricsNegative = calculateAttendanceMetrics({ attended: 3, total: -5 });
      assert.strictEqual(metricsNegative.total, 12);
      assert.strictEqual(metricsNegative.percentage, 25);
    });

    it('should default attended to 0 and total to 12 when modalData is completely empty', () => {
      const emptyMetrics = calculateAttendanceMetrics(null);
      assert.strictEqual(emptyMetrics.attended, 0);
      assert.strictEqual(emptyMetrics.total, 12);
      assert.strictEqual(emptyMetrics.percentage, 0);
    });
  });

  describe('Attendance Session Roll Call Mapping', () => {
    it('should assign reverse sequential class numbers from newest to oldest', () => {
      const mockAttendances = [
        { date: '2026-10-18T10:00:00Z', isPresent: true },
        { date: '2026-10-16T10:00:00Z', isPresent: false },
        { date: '2026-10-14T10:00:00Z', isPresent: true },
      ];

      const metrics = calculateAttendanceMetrics({ attendances: mockAttendances });
      assert.strictEqual(metrics.sessions.length, 3);
      assert.strictEqual(metrics.sessions[0].classNo, 3);
      assert.strictEqual(metrics.sessions[0].status, 'PRESENT');
      assert.strictEqual(metrics.sessions[0].note, 'Roll call verified on court');

      assert.strictEqual(metrics.sessions[1].classNo, 2);
      assert.strictEqual(metrics.sessions[1].status, 'ABSENT');
      assert.strictEqual(metrics.sessions[1].note, 'Absence recorded by coach');

      assert.strictEqual(metrics.sessions[2].classNo, 1);
      assert.strictEqual(metrics.sessions[2].status, 'PRESENT');
    });

    it('should safely handle empty or non-array attendances', () => {
      const noAttendances = calculateAttendanceMetrics({ attendances: null });
      assert.deepStrictEqual(noAttendances.sessions, []);
    });
  });

  describe('Direct WhatsApp Inquiry Link Generation', () => {
    it('should format URL with 91 country code and URL-encoded student inquiry text', () => {
      const url = generateCoachWhatsAppLink(
        'Rohan Sharma',
        'Weekend U-14 Batch',
        'Taj Tennis Academy',
        '9897012345'
      );

      assert.strictEqual(
        url,
        'https://wa.me/919897012345?text=Hi%20Coach%2C%20I%20am%20contacting%20you%20regarding%20Rohan%20Sharma\'s%20attendance%20in%20batch%20%22Weekend%20U-14%20Batch%22%20at%20Taj%20Tennis%20Academy.'
      );
    });
  });
});
