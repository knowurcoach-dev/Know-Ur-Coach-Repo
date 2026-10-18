import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 28: Academy Comparison & Feature Matrix Engine Tests', () => {
  interface AcademyCompareItem {
    id: string;
    name: string;
    monthlyFee: number;
    rating: number;
    reviewsCount: number;
    safetyGrade: string;
    isVerifiedBatch: boolean;
    studentCoachRatio: string; // e.g. '1 : 8'
    hasFreeTrial: boolean;
    facilities: string[];
  }

  function compareAcademies(a: AcademyCompareItem, b: AcademyCompareItem) {
    // 1. Fee comparison
    const feeDiff = a.monthlyFee - b.monthlyFee;
    const cheaperAcademy = feeDiff < 0 ? a.id : feeDiff > 0 ? b.id : 'EQUAL';

    // 2. Rating comparison
    const ratingDiff = Number((a.rating - b.rating).toFixed(1));
    const higherRated = ratingDiff > 0 ? a.id : ratingDiff < 0 ? b.id : 'EQUAL';

    // 3. Ratio attention parser (e.g. '1 : 8' -> 8 students per coach)
    const parseRatio = (r: string) => {
      const match = r.match(/:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 15;
    };
    const ratioA = parseRatio(a.studentCoachRatio);
    const ratioB = parseRatio(b.studentCoachRatio);
    const betterAttentionRatio = ratioA < ratioB ? a.id : ratioA > ratioB ? b.id : 'EQUAL';

    // 4. Facilities overlap
    const commonFacilities = a.facilities.filter((f) =>
      b.facilities.some((bf) => bf.toLowerCase() === f.toLowerCase())
    );
    const uniqueToA = a.facilities.filter(
      (f) => !b.facilities.some((bf) => bf.toLowerCase() === f.toLowerCase())
    );
    const uniqueToB = b.facilities.filter(
      (f) => !a.facilities.some((af) => af.toLowerCase() === f.toLowerCase())
    );

    return {
      cheaperAcademy,
      feeDifference: Math.abs(feeDiff),
      higherRated,
      betterAttentionRatio,
      commonFacilities,
      uniqueToA,
      uniqueToB,
    };
  }

  const academy1: AcademyCompareItem = {
    id: 'acad-1',
    name: 'Agra Badminton Star',
    monthlyFee: 2000,
    rating: 4.9,
    reviewsCount: 25,
    safetyGrade: 'GRADE_A_PLUS',
    isVerifiedBatch: true,
    studentCoachRatio: '1 : 6',
    hasFreeTrial: true,
    facilities: ['Olympic Wooden Courts', 'Air Conditioned Waiting Lounge', 'Physio On-Site'],
  };

  const academy2: AcademyCompareItem = {
    id: 'acad-2',
    name: 'Kamla Nagar Smashers',
    monthlyFee: 2800,
    rating: 4.6,
    reviewsCount: 18,
    safetyGrade: 'GRADE_A',
    isVerifiedBatch: true,
    studentCoachRatio: '1 : 12',
    hasFreeTrial: false,
    facilities: ['Olympic Wooden Courts', 'Floodlit Arena', 'Pro Racquet Stringing'],
  };

  describe('Core Metrics Differential Analysis', () => {
    it('should identify the more economical academy and calculate price difference', () => {
      const comparison = compareAcademies(academy1, academy2);

      assert.strictEqual(comparison.cheaperAcademy, 'acad-1');
      assert.strictEqual(comparison.feeDifference, 800); // 2800 - 2000
    });

    it('should identify the higher rated academy', () => {
      const comparison = compareAcademies(academy1, academy2);

      assert.strictEqual(comparison.higherRated, 'acad-1');
    });

    it('should identify the academy with superior coach-to-student attention ratio', () => {
      const comparison = compareAcademies(academy1, academy2);

      // 1:6 has fewer students per coach than 1:12
      assert.strictEqual(comparison.betterAttentionRatio, 'acad-1');
    });
  });

  describe('Facilities & Amenities Matrix Diffing', () => {
    it('should accurately calculate common and unique facility offerings', () => {
      const comparison = compareAcademies(academy1, academy2);

      assert.deepStrictEqual(comparison.commonFacilities, ['Olympic Wooden Courts']);
      assert.deepStrictEqual(comparison.uniqueToA, [
        'Air Conditioned Waiting Lounge',
        'Physio On-Site',
      ]);
      assert.deepStrictEqual(comparison.uniqueToB, [
        'Floodlit Arena',
        'Pro Racquet Stringing',
      ]);
    });
  });
});
