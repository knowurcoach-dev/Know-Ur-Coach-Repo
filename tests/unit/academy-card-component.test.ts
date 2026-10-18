import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 19: AcademyCard Component Logic & Badge Rendering Rules Tests', () => {
  interface AcademyCardViewModel {
    id: string;
    name: string;
    isTopInArea?: boolean;
    isVerifiedBatch?: boolean;
    rating?: number;
    reviewsCount?: number;
    locality?: string;
    category?: string;
  }

  // Replicating badge rendering decision engine from AcademyCard.tsx
  function getBadgeConfig(academy: AcademyCardViewModel) {
    const badges: string[] = [];
    let reviewDisplay: { type: 'RATING' | 'NEW'; label: string; count?: number };
    let verificationTag: 'VERIFIED' | 'SELF_LISTED';

    if (academy.isTopInArea) {
      badges.push('TOP_IN_AREA');
    }

    if (academy.isVerifiedBatch) {
      badges.push('VERIFIED_BATCH');
      verificationTag = 'VERIFIED';
    } else {
      verificationTag = 'SELF_LISTED';
    }

    if (academy.reviewsCount && academy.reviewsCount > 0) {
      reviewDisplay = {
        type: 'RATING',
        label: Number(academy.rating || 5).toFixed(1),
        count: academy.reviewsCount,
      };
    } else {
      reviewDisplay = {
        type: 'NEW',
        label: 'New',
      };
    }

    return { badges, reviewDisplay, verificationTag };
  }

  // Replicating click handlers from AcademyCard.tsx
  function evaluateCardAction(
    actionType: 'TRIAL' | 'BATCH',
    isGuest: boolean,
    academy: AcademyCardViewModel
  ): {
    routeRedirect?: string;
    toastMessage?: string;
    modalOpened?: string;
    modalPayload?: any;
  } {
    if (actionType === 'TRIAL') {
      if (isGuest) {
        return {
          routeRedirect: '/register-parent',
          toastMessage: '🎁 Create a free parent account to claim your Free Trial pass!',
        };
      }
      return {
        modalOpened: 'trial-booking',
        modalPayload: {
          acadId: academy.id,
          acadName: academy.name,
          locality: academy.locality,
          category: academy.category,
        },
      };
    }

    if (actionType === 'BATCH') {
      if (isGuest) {
        return {
          routeRedirect: '/login?callbackUrl=/activities',
          toastMessage: 'Please sign in to enroll in monthly batches',
        };
      }
      return {
        modalOpened: 'batch-booking',
        modalPayload: {
          acadId: academy.id,
          acadName: academy.name,
          locality: academy.locality,
          category: academy.category,
        },
      };
    }

    return {};
  }

  describe('Badge Rendering Engine', () => {
    it('should show TOP_IN_AREA and VERIFIED badges for premier verified academy', () => {
      const academy: AcademyCardViewModel = {
        id: 'acad-01',
        name: 'Agra Premier Badminton',
        isTopInArea: true,
        isVerifiedBatch: true,
        rating: 4.8,
        reviewsCount: 14,
      };

      const { badges, reviewDisplay, verificationTag } = getBadgeConfig(academy);

      assert.ok(badges.includes('TOP_IN_AREA'));
      assert.ok(badges.includes('VERIFIED_BATCH'));
      assert.strictEqual(verificationTag, 'VERIFIED');
      assert.strictEqual(reviewDisplay.type, 'RATING');
      assert.strictEqual(reviewDisplay.label, '4.8');
      assert.strictEqual(reviewDisplay.count, 14);
    });

    it('should display "New" badge for newly onboarded academy with 0 reviews', () => {
      const newAcademy: AcademyCardViewModel = {
        id: 'acad-02',
        name: 'New Football Club',
        isTopInArea: false,
        isVerifiedBatch: true,
        reviewsCount: 0,
      };

      const { reviewDisplay } = getBadgeConfig(newAcademy);
      assert.strictEqual(reviewDisplay.type, 'NEW');
      assert.strictEqual(reviewDisplay.label, 'New');
    });

    it('should display Self-Listed tag when academy has not completed verified batch audit', () => {
      const selfListedAcademy: AcademyCardViewModel = {
        id: 'acad-03',
        name: 'Local Cricket Nets',
        isVerifiedBatch: false,
      };

      const { verificationTag } = getBadgeConfig(selfListedAcademy);
      assert.strictEqual(verificationTag, 'SELF_LISTED');
    });
  });

  describe('User Interaction & Auth-Gated Action Routing', () => {
    const academy: AcademyCardViewModel = {
      id: 'acad-10',
      name: 'Delhi Olympic Tennis',
      locality: 'Vasant Kunj',
      category: 'tennis',
    };

    it('should redirect guest user to parent registration when requesting free trial', () => {
      const res = evaluateCardAction('TRIAL', true, academy);

      assert.strictEqual(res.routeRedirect, '/register-parent');
      assert.ok(res.toastMessage?.includes('Create a free parent account to claim your Free Trial pass'));
      assert.strictEqual(res.modalOpened, undefined);
    });

    it('should open trial booking modal directly when authenticated parent clicks trial', () => {
      const res = evaluateCardAction('TRIAL', false, academy);

      assert.strictEqual(res.routeRedirect, undefined);
      assert.strictEqual(res.modalOpened, 'trial-booking');
      assert.strictEqual(res.modalPayload?.acadId, 'acad-10');
      assert.strictEqual(res.modalPayload?.acadName, 'Delhi Olympic Tennis');
    });

    it('should redirect guest user to login callback when attempting monthly enrollment', () => {
      const res = evaluateCardAction('BATCH', true, academy);

      assert.strictEqual(res.routeRedirect, '/login?callbackUrl=/activities');
      assert.ok(res.toastMessage?.includes('Please sign in to enroll in monthly batches'));
    });

    it('should open batch booking modal for authenticated parent enrolling in batch', () => {
      const res = evaluateCardAction('BATCH', false, academy);

      assert.strictEqual(res.modalOpened, 'batch-booking');
      assert.strictEqual(res.modalPayload?.acadId, 'acad-10');
    });
  });
});
