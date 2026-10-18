import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCategoryPillar, getCategoryDisplayName } from '@/lib/categories';

describe('Phase 25: Public Activities Directory Search & Multi-Facet Filtering Engine Tests', () => {
  interface MockExploreAcademy {
    id: string;
    name: string;
    tagline?: string;
    category: string;
    activities: string[];
    activitiesText?: string;
    locality?: string;
    localityName?: string;
    address?: string;
    ageText: string;
    fee: number;
    distance: number;
    rating: number;
    reviewsCount: number;
    isTopInArea: boolean;
    isVerifiedBatch: boolean;
    planTier: string;
    kycStatus: string;
    safetyGrade?: string;
    verifiedTag?: string;
  }

  // Replicating matchesAgeGroup from ActivitiesExploreView.tsx
  function matchesAgeGroup(ageText: string | undefined, selectedAge: string): boolean {
    if (selectedAge === 'all') return true;
    if (!ageText) return true;
    const match = ageText.match(/(\d+)\s*[-to]+\s*(\d+)/i);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      switch (selectedAge) {
        case 'u5':
          return min <= 5;
        case 'u8':
          return min <= 8 && max >= 6;
        case 'u12':
          return min <= 12 && max >= 9;
        case 'u16':
          return max >= 13;
      }
    }
    return true;
  }

  // Replicating matchesCategory from ActivitiesExploreView.tsx
  function matchesCategory(acad: MockExploreAcademy, catSlug: string): boolean {
    if (!catSlug || catSlug === 'all') return true;

    if (catSlug === 'all-sports') {
      return getCategoryPillar(acad.category) === 'sports';
    }
    if (catSlug === 'all-brain-booster') {
      return getCategoryPillar(acad.category) === 'brain-booster';
    }
    if (catSlug === 'all-arts') {
      return getCategoryPillar(acad.category) === 'arts';
    }

    const cleanSlug = catSlug.toLowerCase().trim();
    const name = (acad.name || '').toLowerCase();
    const tagline = (acad.tagline || '').toLowerCase();
    const cat = (acad.category || '').toLowerCase().trim();
    const catSlugs = cat.split(',').map((s) => s.trim()).filter(Boolean);
    const activities = (acad.activities || []).map((a) => a.toLowerCase());
    const actText = (acad.activitiesText || '').toLowerCase();

    if (cat === cleanSlug || catSlugs.includes(cleanSlug)) return true;

    switch (cleanSlug) {
      case 'tennis':
        return (
          cat === 'tennis' ||
          name.includes('tennis') ||
          tagline.includes('tennis') ||
          actText.includes('tennis') ||
          activities.some((a) => a.includes('tennis'))
        );
      case 'badminton':
        return (
          cat === 'badminton' ||
          name.includes('badminton') ||
          name.includes('shuttle') ||
          tagline.includes('badminton') ||
          actText.includes('badminton') ||
          activities.some((a) => a.includes('badminton'))
        );
      case 'robotics':
      case 'stem':
        return (
          cat === 'stem' ||
          cat === 'robotics' ||
          name.includes('robot') ||
          name.includes('stem') ||
          activities.some((a) => a.includes('robot') || a.includes('stem'))
        );
      case 'dance':
        return (
          cat === 'dance' ||
          name.includes('dance') ||
          name.includes('kathak') ||
          activities.some((a) => a.includes('dance'))
        );
      default:
        return (
          cat.includes(cleanSlug) ||
          name.includes(cleanSlug) ||
          tagline.includes(cleanSlug) ||
          activities.some((a) => a.includes(cleanSlug))
        );
    }
  }

  // Replicating filter & sort engine from ActivitiesExploreView.tsx
  function filterAndSortAcademies(
    academies: MockExploreAcademy[],
    filters: {
      category?: string;
      activityPillar?: string;
      searchQuery?: string;
      locality?: string;
      age?: string;
      onlyTopInArea?: boolean;
      onlyVerified?: boolean;
      sortBy?: 'top' | 'rating' | 'fee-low' | 'distance';
    }
  ): MockExploreAcademy[] {
    let result = [...academies];

    if (filters.category && filters.category !== 'all') {
      result = result.filter((a) => matchesCategory(a, filters.category!));
    } else if (filters.activityPillar && filters.activityPillar !== 'all') {
      result = result.filter((a) => getCategoryPillar(a.category) === filters.activityPillar);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.locality && a.locality.toLowerCase().includes(q))
      );
    }

    if (filters.locality && filters.locality !== 'all') {
      const target = filters.locality.toLowerCase().replace(/\s+/g, '-');
      result = result.filter((a) => {
        const aLoc = (a.locality || '').toLowerCase().replace(/\s+/g, '-');
        return aLoc === target || aLoc.includes(target);
      });
    }

    if (filters.age && filters.age !== 'all') {
      result = result.filter((a) => matchesAgeGroup(a.ageText, filters.age!));
    }

    if (filters.onlyTopInArea) {
      result = result.filter((a) => a.isTopInArea || a.planTier === 'PREMIUM');
    }

    if (filters.onlyVerified) {
      result = result.filter(
        (a) => a.isVerifiedBatch || a.safetyGrade === 'GRADE_A_PLUS' || a.kycStatus === 'APPROVED'
      );
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (filters.sortBy === 'fee-low') return (a.fee || 0) - (b.fee || 0);
      if (filters.sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);

      // Default 'top' sort: Premier Top In Area > Verified > Rating
      if (a.isTopInArea !== b.isTopInArea) return a.isTopInArea ? -1 : 1;
      if (a.isVerifiedBatch !== b.isVerifiedBatch) return a.isVerifiedBatch ? -1 : 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    return result;
  }

  const sampleAcademies: MockExploreAcademy[] = [
    {
      id: 'a1',
      name: 'Agra Premier Badminton',
      category: 'badminton',
      activities: ['badminton'],
      locality: 'kamla-nagar',
      localityName: 'Kamla Nagar',
      ageText: '6 - 15 Yrs',
      fee: 2500,
      distance: 1.2,
      rating: 4.9,
      reviewsCount: 22,
      isTopInArea: true,
      isVerifiedBatch: true,
      planTier: 'PREMIUM',
      kycStatus: 'APPROVED',
      safetyGrade: 'GRADE_A_PLUS',
    },
    {
      id: 'a2',
      name: 'Sanjay Place STEM & Robotics Lab',
      category: 'robotics',
      activities: ['robotics', 'stem', 'coding'],
      locality: 'sanjay-place',
      localityName: 'Sanjay Place',
      ageText: '4 - 10 Yrs',
      fee: 2000,
      distance: 3.5,
      rating: 4.7,
      reviewsCount: 15,
      isTopInArea: false,
      isVerifiedBatch: true,
      planTier: 'STANDARD',
      kycStatus: 'APPROVED',
      safetyGrade: 'GRADE_A',
    },
    {
      id: 'a3',
      name: 'Kamla Nagar Kathak Dance Academy',
      category: 'dance',
      activities: ['dance', 'kathak'],
      locality: 'kamla-nagar',
      localityName: 'Kamla Nagar',
      ageText: '5 - 18 Yrs',
      fee: 1500,
      distance: 2.1,
      rating: 4.8,
      reviewsCount: 8,
      isTopInArea: false,
      isVerifiedBatch: false, // Self-listed
      planTier: 'FREE',
      kycStatus: 'DOCS_REVIEW',
    },
    {
      id: 'a4',
      name: 'Sadar Bazar Swimming Club',
      category: 'swimming',
      activities: ['swimming'],
      locality: 'sadar-bazar',
      localityName: 'Sadar Bazar',
      ageText: '11 - 18 Yrs',
      fee: 3500,
      distance: 5.0,
      rating: 4.6,
      reviewsCount: 12,
      isTopInArea: false,
      isVerifiedBatch: true,
      planTier: 'STANDARD',
      kycStatus: 'APPROVED',
    },
  ];

  describe('matchesAgeGroup() Filtering', () => {
    it('should match toddler/preschool age (u5) when min age <= 5', () => {
      assert.strictEqual(matchesAgeGroup('4 - 10 Yrs', 'u5'), true); // 4 <= 5
      assert.strictEqual(matchesAgeGroup('6 - 15 Yrs', 'u5'), false); // 6 > 5
      assert.strictEqual(matchesAgeGroup('11 - 18 Yrs', 'u5'), false);
    });

    it('should match junior age (u8) when age range overlaps 6 to 8', () => {
      assert.strictEqual(matchesAgeGroup('6 - 15 Yrs', 'u8'), true);
      assert.strictEqual(matchesAgeGroup('4 - 10 Yrs', 'u8'), true);
      assert.strictEqual(matchesAgeGroup('11 - 18 Yrs', 'u8'), false);
    });

    it('should match adolescent age (u16) when max age >= 13', () => {
      assert.strictEqual(matchesAgeGroup('6 - 15 Yrs', 'u16'), true); // 15 >= 13
      assert.strictEqual(matchesAgeGroup('11 - 18 Yrs', 'u16'), true); // 18 >= 13
      assert.strictEqual(matchesAgeGroup('4 - 10 Yrs', 'u16'), false); // 10 < 13
    });

    it('should match any age group when "all" is selected', () => {
      assert.strictEqual(matchesAgeGroup('11 - 18 Yrs', 'all'), true);
    });
  });

  describe('Pillar-wide "All in Pillar" Category Matching', () => {
    it('should filter all sports academies when "all-sports" is selected', () => {
      const sports = sampleAcademies.filter((a) => matchesCategory(a, 'all-sports'));
      assert.strictEqual(sports.length, 2); // Badminton (a1) + Swimming (a4)
      assert.ok(sports.every((a) => ['badminton', 'swimming'].includes(a.category)));
    });

    it('should filter all brain booster academies when "all-brain-booster" is selected', () => {
      const brain = sampleAcademies.filter((a) => matchesCategory(a, 'all-brain-booster'));
      assert.strictEqual(brain.length, 1);
      assert.strictEqual(brain[0].id, 'a2'); // Robotics
    });

    it('should filter all arts academies when "all-arts" is selected', () => {
      const arts = sampleAcademies.filter((a) => matchesCategory(a, 'all-arts'));
      assert.strictEqual(arts.length, 1);
      assert.strictEqual(arts[0].id, 'a3'); // Dance
    });
  });

  describe('Multi-Criteria Facet Filtering', () => {
    it('should filter by specific locality (kamla-nagar)', () => {
      const res = filterAndSortAcademies(sampleAcademies, { locality: 'kamla-nagar' });
      assert.strictEqual(res.length, 2);
      assert.ok(res.every((a) => a.locality === 'kamla-nagar'));
    });

    it('should filter by verified academies only', () => {
      const res = filterAndSortAcademies(sampleAcademies, { onlyVerified: true });
      assert.strictEqual(res.length, 3);
      assert.ok(!res.some((a) => a.id === 'a3')); // a3 is self-listed
    });

    it('should filter by top in area only', () => {
      const res = filterAndSortAcademies(sampleAcademies, { onlyTopInArea: true });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'a1');
    });
  });

  describe('Multi-Criteria Sorting Options', () => {
    it('should sort by fee ascending (fee-low)', () => {
      const res = filterAndSortAcademies(sampleAcademies, { sortBy: 'fee-low' });
      const fees = res.map((a) => a.fee);
      assert.deepStrictEqual(fees, [1500, 2000, 2500, 3500]);
    });

    it('should sort by rating descending (rating)', () => {
      const res = filterAndSortAcademies(sampleAcademies, { sortBy: 'rating' });
      const ratings = res.map((a) => a.rating);
      assert.deepStrictEqual(ratings, [4.9, 4.8, 4.7, 4.6]);
    });

    it('should sort by distance ascending (nearest first)', () => {
      const res = filterAndSortAcademies(sampleAcademies, { sortBy: 'distance' });
      const distances = res.map((a) => a.distance);
      assert.deepStrictEqual(distances, [1.2, 2.1, 3.5, 5.0]);
    });

    it('should sort by default priority ranking (Top In Area > Verified > Rating)', () => {
      const res = filterAndSortAcademies(sampleAcademies, { sortBy: 'top' });
      assert.strictEqual(res[0].id, 'a1'); // Top In Area
      assert.strictEqual(res[1].isVerifiedBatch, true);
    });
  });
});
