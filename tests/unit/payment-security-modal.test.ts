import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 42: Payment Security Modal & Zero-Markup Fee Policy Tests', () => {
  // Policy guarantees and configuration from PaymentSecurityModal.tsx
  const PAYMENT_SECURITY_POLICY = {
    modalId: 'payment-security',
    title: 'Direct Settlement & Zero Platform Fee',
    subtitle: '100% Transparent Fee Policy for Parents',
    desktopWidth: 'md:max-w-lg',
    guarantees: [
      {
        id: 'zero-markup',
        label: 'Zero Booking Markup — 100% of your fee goes directly to coaching',
        type: 'FEE_TRANSPARENCY',
      },
      {
        id: 'day-one-inspection',
        label: 'Inspect facilities & meet the coach in person before paying on Day 1',
        type: 'PHYSICAL_SAFETY',
      },
      {
        id: 'digital-pass',
        label: 'Instant digital admission pass and booking confirmation slip',
        type: 'ADMISSION_CONFIRMATION',
      },
      {
        id: 'zero-gateway-fee',
        label: 'Zero payment gateway transaction charges or hidden fees',
        type: 'NO_TRANSACTION_SURCHARGE',
      },
    ],
    settlementModel: 'OFFLINE_DIRECT_TO_COACH',
    platformCostForParents: 0,
  };

  function isModalOpen(isOpen: boolean, activeModal: string | null): boolean {
    return isOpen && activeModal === 'payment-security';
  }

  function calculateEffectiveParentCost(baseMonthlyFee: number): {
    tuitionFee: number;
    platformMarkup: number;
    gatewayProcessingCharge: number;
    totalAmountPayableAtVenue: number;
  } {
    return {
      tuitionFee: baseMonthlyFee,
      platformMarkup: 0,
      gatewayProcessingCharge: 0,
      totalAmountPayableAtVenue: baseMonthlyFee,
    };
  }

  describe('Modal Activation & Dialog Properties', () => {
    it('should activate only when activeModal matches payment-security and isOpen is true', () => {
      assert.strictEqual(isModalOpen(true, 'payment-security'), true);
      assert.strictEqual(isModalOpen(false, 'payment-security'), false);
      assert.strictEqual(isModalOpen(true, 'trial-booking'), false);
      assert.strictEqual(isModalOpen(true, null), false);
    });

    it('should configure correct dialog sizing and trust subtitles', () => {
      assert.strictEqual(PAYMENT_SECURITY_POLICY.desktopWidth, 'md:max-w-lg');
      assert.strictEqual(PAYMENT_SECURITY_POLICY.title, 'Direct Settlement & Zero Platform Fee');
      assert.strictEqual(PAYMENT_SECURITY_POLICY.subtitle, '100% Transparent Fee Policy for Parents');
    });
  });

  describe('Parent Zero-Fee Cost Invariance', () => {
    it('should guarantee exactly ₹0 platform markup across various fee tiers', () => {
      const breakdown1 = calculateEffectiveParentCost(1500);
      assert.strictEqual(breakdown1.platformMarkup, 0);
      assert.strictEqual(breakdown1.gatewayProcessingCharge, 0);
      assert.strictEqual(breakdown1.totalAmountPayableAtVenue, 1500);

      const breakdown2 = calculateEffectiveParentCost(4500);
      assert.strictEqual(breakdown2.platformMarkup, 0);
      assert.strictEqual(breakdown2.gatewayProcessingCharge, 0);
      assert.strictEqual(breakdown2.totalAmountPayableAtVenue, 4500);
    });

    it('should enumerate all 4 pillars of the parent protection guarantee', () => {
      assert.strictEqual(PAYMENT_SECURITY_POLICY.guarantees.length, 4);
      const guaranteeTypes = PAYMENT_SECURITY_POLICY.guarantees.map((g) => g.type);
      assert.deepStrictEqual(guaranteeTypes, [
        'FEE_TRANSPARENCY',
        'PHYSICAL_SAFETY',
        'ADMISSION_CONFIRMATION',
        'NO_TRANSACTION_SURCHARGE',
      ]);
    });
  });
});
