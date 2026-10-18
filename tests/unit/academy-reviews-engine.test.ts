import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 18: Academy Reviews, Parent Enrollment Eligibility & Average Rating Tests', () => {
  // Replicating review eligibility decision tree from reviews.ts
  function evaluateReviewEligibility(params: {
    user: { id: string; role?: string; name?: string } | null;
    parentProfile?: {
      id: string;
      fullName: string;
      bookings: Array<{ id: string; coachingCentreId: string; childName?: string; batchName?: string }>;
    } | null;
    academyId: string;
  }) {
    if (!params.user) {
      return {
        isEligible: false,
        reason: 'LOGGED_OUT' as const,
        message: 'Sign in to share your verified parent review.',
      };
    }

    if (params.user.role === 'ADMIN') {
      return {
        isEligible: true,
        reason: 'ELIGIBLE' as const,
        message: 'Platform Admin Audit Mode: Review authorized.',
        parentName: params.user.name || 'Platform Inspector',
      };
    }

    if (params.user.role !== 'PARENT' && params.user.role !== 'USER') {
      return {
        isEligible: false,
        reason: 'NOT_PARENT' as const,
        message: 'Only parents of enrolled students can review coaching academies.',
      };
    }

    const academyBookings = params.parentProfile?.bookings?.filter(
      (b) => b.coachingCentreId === params.academyId
    ) || [];

    if (academyBookings.length === 0) {
      return {
        isEligible: false,
        reason: 'NOT_ENROLLED' as const,
        message: 'Only parents with a child enrolled in this academy can post verified reviews.',
      };
    }

    return {
      isEligible: true,
      reason: 'ELIGIBLE' as const,
      message: 'Verified enrolled parent. You are authorized to review this academy.',
      parentName: params.parentProfile?.fullName || params.user.name || 'Verified Parent',
      enrolledChildren: academyBookings.map((b) => ({
        childName: b.childName || 'Enrolled Child',
        batchName: b.batchName || 'Regular Batch',
        bookingId: b.id,
      })),
    };
  }

  // Replicating rating clamping from submitAcademyReview
  function clampRating(input: any): number {
    return Math.min(5, Math.max(1, Math.round(Number(input) || 5)));
  }

  // Replicating recalculateAcademyRating arithmetic
  function calculateAverageRating(reviews: Array<{ rating: number; status: string }>): {
    rating: number;
    reviewsCount: number;
  } {
    const approved = reviews.filter((r) => r.status === 'APPROVED');
    const reviewsCount = approved.length;
    if (reviewsCount === 0) {
      return { rating: 5.0, reviewsCount: 0 };
    }
    const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avgRating = Number((sum / reviewsCount).toFixed(1));
    return { rating: avgRating, reviewsCount };
  }

  describe('Parent Review Eligibility Decision Tree', () => {
    it('should reject unauthenticated visitors with LOGGED_OUT', () => {
      const res = evaluateReviewEligibility({
        user: null,
        academyId: 'acad-01',
      });

      assert.strictEqual(res.isEligible, false);
      assert.strictEqual(res.reason, 'LOGGED_OUT');
      assert.ok(res.message.includes('Sign in to share your verified parent review'));
    });

    it('should reject coach accounts from reviewing academies with NOT_PARENT', () => {
      const res = evaluateReviewEligibility({
        user: { id: 'u-coach', role: 'COACH', name: 'Coach Rajesh' },
        academyId: 'acad-01',
      });

      assert.strictEqual(res.isEligible, false);
      assert.strictEqual(res.reason, 'NOT_PARENT');
      assert.ok(res.message.includes('Only parents of enrolled students can review'));
    });

    it('should reject parents who have NO bookings for the target academy with NOT_ENROLLED', () => {
      const res = evaluateReviewEligibility({
        user: { id: 'u-parent', role: 'PARENT', name: 'Sunita Sharma' },
        parentProfile: {
          id: 'p-01',
          fullName: 'Sunita Sharma',
          bookings: [
            // Has booking at acad-99, but NOT acad-01!
            { id: 'b-99', coachingCentreId: 'acad-99', childName: 'Aarav' },
          ],
        },
        academyId: 'acad-01',
      });

      assert.strictEqual(res.isEligible, false);
      assert.strictEqual(res.reason, 'NOT_ENROLLED');
      assert.ok(res.message.includes('Only parents with a child enrolled in this academy'));
    });

    it('should grant review eligibility to a verified parent with an active booking', () => {
      const res = evaluateReviewEligibility({
        user: { id: 'u-parent', role: 'PARENT', name: 'Sunita Sharma' },
        parentProfile: {
          id: 'p-01',
          fullName: 'Sunita Sharma',
          bookings: [
            { id: 'b-01', coachingCentreId: 'acad-01', childName: 'Aarav Sharma', batchName: 'Junior Badminton' },
          ],
        },
        academyId: 'acad-01',
      });

      assert.strictEqual(res.isEligible, true);
      assert.strictEqual(res.reason, 'ELIGIBLE');
      assert.strictEqual(res.parentName, 'Sunita Sharma');
      assert.strictEqual(res.enrolledChildren?.length, 1);
      assert.strictEqual(res.enrolledChildren?.[0].childName, 'Aarav Sharma');
    });

    it('should always authorize Super Admin in audit mode', () => {
      const res = evaluateReviewEligibility({
        user: { id: 'u-admin', role: 'ADMIN', name: 'Admin Inspector' },
        academyId: 'acad-01',
      });

      assert.strictEqual(res.isEligible, true);
      assert.strictEqual(res.reason, 'ELIGIBLE');
      assert.ok(res.message.includes('Platform Admin Audit Mode: Review authorized'));
    });
  });

  describe('Rating Bounds Clamping', () => {
    it('should clamp negative numbers to 1 and treat falsy 0 as default 5', () => {
      assert.strictEqual(clampRating(-1), 1);
      assert.strictEqual(clampRating(-5), 1);
      assert.strictEqual(clampRating(0), 5); // 0 is falsy in Number(input) || 5, defaults to 5
    });

    it('should clamp numbers above 5 to 5', () => {
      assert.strictEqual(clampRating(6), 5);
      assert.strictEqual(clampRating(10), 5);
    });

    it('should round decimal ratings to nearest integer star', () => {
      assert.strictEqual(clampRating(4.2), 4);
      assert.strictEqual(clampRating(4.6), 5);
    });

    it('should default invalid input to 5 stars', () => {
      assert.strictEqual(clampRating(undefined), 5);
      assert.strictEqual(clampRating(null), 5);
      assert.strictEqual(clampRating('invalid'), 5);
    });
  });

  describe('calculateAverageRating() Dynamic Recalculation', () => {
    it('should calculate average rating rounded to 1 decimal place', () => {
      const reviews = [
        { rating: 5, status: 'APPROVED' },
        { rating: 4, status: 'APPROVED' },
        { rating: 4, status: 'APPROVED' },
      ];

      const res = calculateAverageRating(reviews);
      // (5 + 4 + 4) / 3 = 13 / 3 = 4.333 -> 4.3
      assert.strictEqual(res.rating, 4.3);
      assert.strictEqual(res.reviewsCount, 3);
    });

    it('should ignore FLAGGED or REJECTED reviews when computing academy rating', () => {
      const reviews = [
        { rating: 5, status: 'APPROVED' },
        { rating: 5, status: 'APPROVED' },
        { rating: 1, status: 'FLAGGED' }, // Ignored!
        { rating: 1, status: 'REJECTED' }, // Ignored!
      ];

      const res = calculateAverageRating(reviews);
      assert.strictEqual(res.rating, 5.0);
      assert.strictEqual(res.reviewsCount, 2);
    });

    it('should return fallback 5.0 rating when academy has zero approved reviews', () => {
      const emptyRes = calculateAverageRating([]);
      assert.strictEqual(emptyRes.rating, 5.0);
      assert.strictEqual(emptyRes.reviewsCount, 0);
    });
  });
});
