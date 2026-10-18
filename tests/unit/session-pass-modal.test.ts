import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 43: Session Pass Modal & Booking Slip Validation Tests', () => {
  // Logic extracted directly from src/components/modals/SessionPassModal.tsx
  function formatSessionPassData(modalData: any) {
    const title = modalData?.title || 'Confirmed Booking';
    const academyName = modalData?.acadName || 'Verified Academy';
    const locality = modalData?.locality || 'Verified Academy Arena';
    const scheduledTime = modalData?.sessionTime || modalData?.schedule || 'Scheduled Session';
    const courtNumber = modalData?.courtNumber || modalData?.batchName || 'Main Arena';
    const coachName = modalData?.coachName || 'Assigned Head Coach';
    const passId = modalData?.bookingId || modalData?.passId || 'REF-123456';
    const cleanRef = passId.startsWith('#') ? passId : `#${passId}`;
    const studentName = modalData?.studentName || modalData?.childName || 'Student';
    const feeInfo =
      modalData?.feeInfo ||
      (modalData?.type === 'trial' ? 'Free Trial' : 'Direct Academy Settlement');
    const contactPhone = modalData?.phone || '9897012345';

    return {
      title,
      academyName,
      locality,
      scheduledTime,
      courtNumber,
      coachName,
      passId,
      cleanRef,
      studentName,
      feeInfo,
      contactPhone,
    };
  }

  function generatePassWhatsAppLink(pass: ReturnType<typeof formatSessionPassData>) {
    const text = encodeURIComponent(
      `Hi, I have a confirmed booking (Ref: ${pass.cleanRef}) for ${pass.studentName} at ${pass.academyName}. Scheduled: ${pass.scheduledTime}.`
    );
    return `https://wa.me/91${pass.contactPhone}?text=${text}`;
  }

  function isModalOpen(isOpen: boolean, activeModal: string | null) {
    return isOpen && activeModal === 'session-pass';
  }

  describe('Modal Activation & Reference Normalization', () => {
    it('should activate only for session-pass modal type', () => {
      assert.strictEqual(isModalOpen(true, 'session-pass'), true);
      assert.strictEqual(isModalOpen(false, 'session-pass'), false);
      assert.strictEqual(isModalOpen(true, 'batch-booking'), false);
    });

    it('should ensure reference number starts with hashtag prefix', () => {
      const passWithHash = formatSessionPassData({ passId: '#PASS-9988' });
      assert.strictEqual(passWithHash.cleanRef, '#PASS-9988');

      const passWithoutHash = formatSessionPassData({ passId: 'PASS-9988' });
      assert.strictEqual(passWithoutHash.cleanRef, '#PASS-9988');
    });
  });

  describe('Fee Notice & Fallback Derivation', () => {
    it('should assign Free Trial fee notice when type is trial', () => {
      const trialPass = formatSessionPassData({ type: 'trial' });
      assert.strictEqual(trialPass.feeInfo, 'Free Trial');
    });

    it('should assign Direct Academy Settlement fee notice for regular batch passes', () => {
      const batchPass = formatSessionPassData({ type: 'batch' });
      assert.strictEqual(batchPass.feeInfo, 'Direct Academy Settlement');
    });

    it('should prioritize custom feeInfo if provided', () => {
      const customPass = formatSessionPassData({ feeInfo: '₹2,500/Month (Scholarship Applied)' });
      assert.strictEqual(customPass.feeInfo, '₹2,500/Month (Scholarship Applied)');
    });

    it('should apply standard venue and coach fallbacks', () => {
      const fallback = formatSessionPassData({});
      assert.strictEqual(fallback.academyName, 'Verified Academy');
      assert.strictEqual(fallback.locality, 'Verified Academy Arena');
      assert.strictEqual(fallback.coachName, 'Assigned Head Coach');
      assert.strictEqual(fallback.courtNumber, 'Main Arena');
      assert.strictEqual(fallback.studentName, 'Student');
    });
  });

  describe('WhatsApp Confirmation Messaging', () => {
    it('should compile URL with booking reference, student name, and scheduled timings', () => {
      const pass = formatSessionPassData({
        passId: 'BK-5544',
        studentName: 'Vihaan Agarwal',
        acadName: 'Agra Badminton Club',
        sessionTime: 'Saturday 4:00 PM',
        phone: '9876543210',
      });

      const url = generatePassWhatsAppLink(pass);
      assert.strictEqual(
        url,
        'https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20confirmed%20booking%20(Ref%3A%20%23BK-5544)%20for%20Vihaan%20Agarwal%20at%20Agra%20Badminton%20Club.%20Scheduled%3A%20Saturday%204%3A00%20PM.'
      );
    });
  });
});
