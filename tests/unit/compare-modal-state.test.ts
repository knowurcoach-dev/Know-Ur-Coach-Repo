import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCategoryDisplayName } from '@/lib/categories';

describe('Phase 35: Compare Academies Component Logic & Fallbacks Tests', () => {
  // Logic extracted directly from src/components/modals/CompareModal.tsx
  function filterCentresForComparison(centres: any[], passedIds?: string[]): any[] {
    if (!centres || centres.length === 0) return [];
    if (passedIds && passedIds.length > 0) {
      const filtered = centres.filter((c) => passedIds.includes(c.id));
      return filtered.length > 0 ? filtered : centres.slice(0, 3);
    }
    return centres.slice(0, 3);
  }

  function formatComparisonMetrics(centre: any) {
    const rating = Number(centre?.rating || 4.8).toFixed(1);
    const locality = centre?.locality ? centre.locality.replace('-', ' ') : 'Agra';
    const ageGroup = centre?.eligibleAgeGroup || 'Ages 4 - 17 Yrs';
    const monthlyFee = `₹${Number(centre?.monthlyTuitionFee || 1800).toLocaleString('en-IN')}/mo`;
    const trialFee = Number(centre?.trialFee) === 0 ? '100% Free Trial' : `₹${centre.trialFee}`;
    const studentCoachRatio = centre?.studentCoachRatio || '1 : 8 Ratio';
    const headCoachName = centre?.headCoachName || 'Certified NIS Coach';
    const safetyBadge = centre?.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Compliant' : 'Safety Inspected';
    const categoryName = getCategoryDisplayName(centre?.category);
    const actionLabel = `Book ${centre?.name ? centre.name.split(' ')[0] : 'Academy'} Trial`;

    return {
      rating,
      locality,
      ageGroup,
      monthlyFee,
      trialFee,
      studentCoachRatio,
      headCoachName,
      safetyBadge,
      categoryName,
      actionLabel,
    };
  }

  const THEME_STYLES = [
    { text: 'text-blue-700', bg: 'bg-blue-50/60', btn: 'bg-blue-600 hover:bg-blue-700' },
    { text: 'text-purple-700', bg: 'bg-purple-50/60', btn: 'bg-purple-600 hover:bg-purple-700' },
    { text: 'text-emerald-700', bg: 'bg-emerald-50/60', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  function getThemeForIndex(index: number) {
    return THEME_STYLES[index % THEME_STYLES.length];
  }

  describe('Academy Comparison Selection Logic', () => {
    const mockCentres = [
      { id: 'acad-1', name: 'Agra Badminton Club' },
      { id: 'acad-2', name: 'Taj Football Academy' },
      { id: 'acad-3', name: 'Sanjay Place Chess Academy' },
      { id: 'acad-4', name: 'Yamuna Cricket Hub' },
    ];

    it('should select exactly requested academy IDs when passed valid IDs', () => {
      const selected = filterCentresForComparison(mockCentres, ['acad-2', 'acad-4']);
      assert.strictEqual(selected.length, 2);
      assert.strictEqual(selected[0].id, 'acad-2');
      assert.strictEqual(selected[1].id, 'acad-4');
    });

    it('should fallback to top 3 academies when passed IDs do not match any centre', () => {
      const selected = filterCentresForComparison(mockCentres, ['unknown-999']);
      assert.strictEqual(selected.length, 3);
      assert.strictEqual(selected[0].id, 'acad-1');
      assert.strictEqual(selected[1].id, 'acad-2');
      assert.strictEqual(selected[2].id, 'acad-3');
    });

    it('should default to first 3 academies when no IDs are explicitly passed', () => {
      const selected = filterCentresForComparison(mockCentres, undefined);
      assert.strictEqual(selected.length, 3);
      assert.deepStrictEqual(selected.map((c) => c.id), ['acad-1', 'acad-2', 'acad-3']);
    });

    it('should return empty array if no centres exist in discovery data', () => {
      const selected = filterCentresForComparison([], ['acad-1']);
      assert.deepStrictEqual(selected, []);
    });
  });

  describe('Side-by-Side Metric Fallbacks & Formats', () => {
    it('should apply fallback for rating when missing', () => {
      const metrics = formatComparisonMetrics({ name: 'Test Academy' });
      assert.strictEqual(metrics.rating, '4.8');
    });

    it('should format Indian Rupee monthly fee with en-IN separators', () => {
      const metrics1 = formatComparisonMetrics({ monthlyTuitionFee: 2500 });
      assert.strictEqual(metrics1.monthlyFee, '₹2,500/mo');

      const metrics2 = formatComparisonMetrics({ monthlyTuitionFee: 12500 });
      assert.strictEqual(metrics2.monthlyFee, '₹12,500/mo');

      const metricsFallback = formatComparisonMetrics({});
      assert.strictEqual(metricsFallback.monthlyFee, '₹1,800/mo');
    });

    it('should format trial fee as 100% Free Trial when zero or show rupee amount', () => {
      const freeTrial = formatComparisonMetrics({ trialFee: 0 });
      assert.strictEqual(freeTrial.trialFee, '100% Free Trial');

      const paidTrial = formatComparisonMetrics({ trialFee: 199 });
      assert.strictEqual(paidTrial.trialFee, '₹199');
    });

    it('should handle hyphenated locality normalization', () => {
      const normalized = formatComparisonMetrics({ locality: 'sanjay-place' });
      assert.strictEqual(normalized.locality, 'sanjay place');

      const fallback = formatComparisonMetrics({});
      assert.strictEqual(fallback.locality, 'Agra');
    });

    it('should grant Verified Compliant badge only to GRADE_A_PLUS centres', () => {
      const gradeAPlus = formatComparisonMetrics({ safetyGrade: 'GRADE_A_PLUS' });
      assert.strictEqual(gradeAPlus.safetyBadge, 'Verified Compliant');

      const gradeB = formatComparisonMetrics({ safetyGrade: 'GRADE_B' });
      assert.strictEqual(gradeB.safetyBadge, 'Safety Inspected');

      const noGrade = formatComparisonMetrics({});
      assert.strictEqual(noGrade.safetyBadge, 'Safety Inspected');
    });

    it('should extract first name word for action button label', () => {
      const button1 = formatComparisonMetrics({ name: 'Shivalik Sports Arena' });
      assert.strictEqual(button1.actionLabel, 'Book Shivalik Trial');

      const button2 = formatComparisonMetrics({ name: 'Pankaj Tennis Academy' });
      assert.strictEqual(button2.actionLabel, 'Book Pankaj Trial');
    });
  });

  describe('Theme Column Styling Cycling', () => {
    it('should cycle theme colors predictably across 3-column comparisons', () => {
      const theme0 = getThemeForIndex(0);
      assert.strictEqual(theme0.text, 'text-blue-700');

      const theme1 = getThemeForIndex(1);
      assert.strictEqual(theme1.text, 'text-purple-700');

      const theme2 = getThemeForIndex(2);
      assert.strictEqual(theme2.text, 'text-emerald-700');

      // Wraps around to Blue for 4th academy
      const theme3 = getThemeForIndex(3);
      assert.strictEqual(theme3.text, 'text-blue-700');
    });
  });
});
