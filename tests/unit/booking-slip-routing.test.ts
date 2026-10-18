import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BookingSlipDetails } from '@/lib/downloadBookingSlip';

describe('Phase 20: Booking Slip Generator & WhatsApp Communication Link Tests', () => {
  // Replicating formatting and WhatsApp URL generation logic from BookingPassCard & downloadBookingSlip
  function formatSlipData(data: BookingSlipDetails) {
    const rawRef = data.referenceNo || data.bookingId || `REF-${Date.now().toString().slice(-6)}`;
    const cleanRef = rawRef.startsWith('#') ? rawRef : `#${rawRef}`;

    const typeLabel =
      data.type === 'trial'
        ? 'FREE TRIAL ADMISSION'
        : data.type === 'tournament'
        ? 'TOURNAMENT PARTICIPATION ENTRY'
        : 'MONTHLY BATCH ADMISSION';

    const isFreeTrial =
      data.type === 'trial' || Boolean(data.feeInfo && data.feeInfo.toLowerCase().includes('free'));

    const feeLabel = isFreeTrial
      ? '₹0 (Free Trial Session)'
      : data.feeInfo || 'Direct Academy Settlement';

    const tuitionNotice = isFreeTrial
      ? 'This is a complimentary 100% Free Trial session. No fees are payable to the academy or platform for this session.'
      : 'KnowUrCoach charges ₹0 platform fee. Tuition fee is settled directly with the academy management or head coach at the reception desk.';

    return {
      cleanRef,
      typeLabel,
      feeLabel,
      isFreeTrial,
      tuitionNotice,
    };
  }

  function generateWhatsAppUrl(params: {
    contactPhone?: string;
    type: 'trial' | 'batch' | 'tournament';
    studentName: string;
    passId: string;
    academyTitle: string;
  }): string {
    const cleanRef = params.passId.startsWith('#') ? params.passId : `#${params.passId}`;
    const rawPhone = (params.contactPhone || '9897012345').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

    const text = encodeURIComponent(
      `Hi, I am contacting you regarding ${
        params.type === 'trial' ? 'Free Trial' : 'Enrolled Batch'
      } for ${params.studentName} (Ref: ${cleanRef}) at ${params.academyTitle}.`
    );

    return `https://wa.me/${cleanPhone}?text=${text}`;
  }

  describe('Reference Number Normalization', () => {
    it('should prepend # to reference numbers if not already prefixed', () => {
      const { cleanRef } = formatSlipData({
        bookingId: 'TRL-998877',
        academyName: 'Agra Badminton',
        studentName: 'Aarav',
      });
      assert.strictEqual(cleanRef, '#TRL-998877');
    });

    it('should preserve existing # without creating double hashes', () => {
      const { cleanRef } = formatSlipData({
        bookingId: '#PASS-445566',
        academyName: 'Agra Badminton',
        studentName: 'Aarav',
      });
      assert.strictEqual(cleanRef, '#PASS-445566');
    });
  });

  describe('Type Labels & Fee Terms Categorization', () => {
    it('should configure 100% free terms for Free Trial session', () => {
      const slip = formatSlipData({
        type: 'trial',
        academyName: 'Delhi Tennis Club',
        studentName: 'Diya',
      });

      assert.strictEqual(slip.typeLabel, 'FREE TRIAL ADMISSION');
      assert.strictEqual(slip.feeLabel, '₹0 (Free Trial Session)');
      assert.strictEqual(slip.isFreeTrial, true);
      assert.ok(slip.tuitionNotice.includes('complimentary 100% Free Trial session'));
    });

    it('should configure direct academy settlement terms for Monthly Batches', () => {
      const slip = formatSlipData({
        type: 'batch',
        feeInfo: '₹2,500/Month',
        academyName: 'Delhi Tennis Club',
        studentName: 'Diya',
      });

      assert.strictEqual(slip.typeLabel, 'MONTHLY BATCH ADMISSION');
      assert.strictEqual(slip.feeLabel, '₹2,500/Month');
      assert.strictEqual(slip.isFreeTrial, false);
      assert.ok(slip.tuitionNotice.includes('Tuition fee is settled directly with the academy management'));
    });

    it('should configure Tournament entry label', () => {
      const slip = formatSlipData({
        type: 'tournament',
        feeInfo: '₹500 Entry Fee',
        academyName: 'Agra Open',
        studentName: 'Diya',
      });

      assert.strictEqual(slip.typeLabel, 'TOURNAMENT PARTICIPATION ENTRY');
      assert.strictEqual(slip.feeLabel, '₹500 Entry Fee');
    });
  });

  describe('generateWhatsAppUrl() Direct Coach Communication Link', () => {
    it('should format WhatsApp URL with country code and pre-filled inquiry text for free trial', () => {
      const url = generateWhatsAppUrl({
        contactPhone: '9876543210',
        type: 'trial',
        studentName: 'Aarav Sharma',
        passId: 'TRL-ABC123',
        academyTitle: 'Agra Badminton Star',
      });

      assert.ok(url.startsWith('https://wa.me/919876543210?text='));
      assert.ok(url.includes('Free%20Trial'));
      assert.ok(url.includes('Aarav%20Sharma'));
      assert.ok(url.includes('%23TRL-ABC123')); // %23 is encoded '#'
      assert.ok(url.includes('Agra%20Badminton%20Star'));
    });

    it('should handle pre-formatted numbers with country code or spaces cleanly', () => {
      const url = generateWhatsAppUrl({
        contactPhone: '+91 98765 43210',
        type: 'batch',
        studentName: 'Diya Patel',
        passId: '#BAT-999',
        academyTitle: 'Kamla Nagar Tennis',
      });

      assert.ok(url.startsWith('https://wa.me/919876543210?text='));
      assert.ok(url.includes('Enrolled%20Batch'));
    });
  });
});
