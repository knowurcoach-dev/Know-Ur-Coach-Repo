import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 54: Academy Reviews Component & Rating Distribution Engine Tests', () => {
  // Logic extracted directly from src/components/reviews/AcademyReviewsSection.tsx
  function calculateBreakdownPercentages(
    breakdown: Record<number, number>,
    totalCount: number
  ): Record<number, { count: number; percentage: number }> {
    const result: Record<number, { count: number; percentage: number }> = {};
    for (let star = 5; star >= 1; star--) {
      const count = breakdown[star] || 0;
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      result[star] = { count, percentage };
    }
    return result;
  }

  function validateReviewImagesLimit(currentImages: string[], newUrl: string): {
    allowed: boolean;
    error?: string;
    updatedImages?: string[];
  } {
    if (!newUrl.trim()) {
      return { allowed: false, error: 'Empty image URL' };
    }
    if (currentImages.length >= 4) {
      return { allowed: false, error: 'You can attach a maximum of 4 photos per review.' };
    }
    return {
      allowed: true,
      updatedImages: [...currentImages, newUrl.trim()],
    };
  }

  function getRatingDescription(rating: number): string {
    const ratingDescriptions: Record<number, string> = {
      1: 'Poor - Did not meet expectations',
      2: 'Fair - Needs improvements',
      3: 'Good - Satisfactory training',
      4: 'Very Good - Highly dedicated mentors',
      5: 'Excellent - Exceptional growth & safety',
    };
    const clamped = Math.min(5, Math.max(1, Math.round(rating)));
    return ratingDescriptions[clamped] || 'Good - Satisfactory training';
  }

  function resolveParentEligibilityCTA(eligibility: {
    isEligible?: boolean;
    reason?: string;
    existingReview?: any;
  }) {
    if (!eligibility) {
      return { state: 'LOADING' };
    }
    if (eligibility.isEligible) {
      return {
        state: 'ELIGIBLE',
        buttonLabel: eligibility.existingReview ? 'Edit Your Review' : 'Rate & Review Academy',
      };
    }
    if (eligibility.reason === 'LOGGED_OUT') {
      return {
        state: 'LOGGED_OUT',
        buttonLabel: 'Enrolled Parent? Sign in to Review',
      };
    }
    return {
      state: 'INELIGIBLE',
      badgeText: 'Verified Enrollment Required',
    };
  }

  describe('Rating Breakdown Percentage Calculations', () => {
    it('should calculate exact percentages per star tier for multi-review distribution', () => {
      const breakdown = { 5: 12, 4: 6, 3: 2, 2: 0, 1: 0 };
      const totalCount = 20;
      const stats = calculateBreakdownPercentages(breakdown, totalCount);

      assert.strictEqual(stats[5].count, 12);
      assert.strictEqual(stats[5].percentage, 60); // 12/20 = 60%

      assert.strictEqual(stats[4].count, 6);
      assert.strictEqual(stats[4].percentage, 30); // 6/20 = 30%

      assert.strictEqual(stats[3].count, 2);
      assert.strictEqual(stats[3].percentage, 10); // 2/20 = 10%

      assert.strictEqual(stats[2].count, 0);
      assert.strictEqual(stats[2].percentage, 0);

      assert.strictEqual(stats[1].count, 0);
      assert.strictEqual(stats[1].percentage, 0);
    });

    it('should prevent NaN and division by zero when academy has 0 total reviews', () => {
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      const stats = calculateBreakdownPercentages(breakdown, 0);

      for (let star = 1; star <= 5; star++) {
        assert.strictEqual(stats[star].count, 0);
        assert.strictEqual(stats[star].percentage, 0);
      }
    });
  });

  describe('Review Photo Upload Quota', () => {
    it('should allow adding photos up to 4 images', () => {
      let images: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const res = validateReviewImagesLimit(images, `https://example.com/photo-${i}.jpg`);
        assert.strictEqual(res.allowed, true);
        images = res.updatedImages || [];
      }
      assert.strictEqual(images.length, 4);
    });

    it('should reject attaching a 5th photo when quota of 4 is reached', () => {
      const images = [
        'https://example.com/p1.jpg',
        'https://example.com/p2.jpg',
        'https://example.com/p3.jpg',
        'https://example.com/p4.jpg',
      ];
      const res = validateReviewImagesLimit(images, 'https://example.com/p5.jpg');
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.error, 'You can attach a maximum of 4 photos per review.');
    });

    it('should reject empty or whitespace-only image URLs', () => {
      const res = validateReviewImagesLimit([], '   ');
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.error, 'Empty image URL');
    });
  });

  describe('Star Rating Semantic Descriptions', () => {
    it('should map each star rating (1 to 5) to its authentic sentiment label', () => {
      assert.strictEqual(getRatingDescription(1), 'Poor - Did not meet expectations');
      assert.strictEqual(getRatingDescription(2), 'Fair - Needs improvements');
      assert.strictEqual(getRatingDescription(3), 'Good - Satisfactory training');
      assert.strictEqual(getRatingDescription(4), 'Very Good - Highly dedicated mentors');
      assert.strictEqual(getRatingDescription(5), 'Excellent - Exceptional growth & safety');
    });
  });

  describe('Parent Eligibility Status & Review Modal CTA', () => {
    it('should offer Rate & Review Academy to eligible parent with no prior review', () => {
      const cta = resolveParentEligibilityCTA({ isEligible: true, existingReview: null });
      assert.strictEqual(cta.state, 'ELIGIBLE');
      assert.strictEqual(cta.buttonLabel, 'Rate & Review Academy');
    });

    it('should offer Edit Your Review to eligible parent who already submitted a review', () => {
      const cta = resolveParentEligibilityCTA({ isEligible: true, existingReview: { id: 'rev-1' } });
      assert.strictEqual(cta.state, 'ELIGIBLE');
      assert.strictEqual(cta.buttonLabel, 'Edit Your Review');
    });

    it('should prompt logged-out visitor to sign in to review', () => {
      const cta = resolveParentEligibilityCTA({ isEligible: false, reason: 'LOGGED_OUT' });
      assert.strictEqual(cta.state, 'LOGGED_OUT');
      assert.strictEqual(cta.buttonLabel, 'Enrolled Parent? Sign in to Review');
    });

    it('should show Verified Enrollment Required badge to ineligible parents without active enrollments', () => {
      const cta = resolveParentEligibilityCTA({ isEligible: false, reason: 'NO_ENROLLMENT' });
      assert.strictEqual(cta.state, 'INELIGIBLE');
      assert.strictEqual(cta.badgeText, 'Verified Enrollment Required');
    });
  });
});
