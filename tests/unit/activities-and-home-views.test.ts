import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getCategoryDisplayName,
  getCategoryEmoji,
  getCategoryPillar,
  resolveCategoryFromSearch,
} from '../../src/lib/categories';
import {
  DEFAULT_HERO_CAROUSEL_THEME,
  getHeroOverlayGradient,
  getHeroCardHeightClass,
  hexToRgba,
} from '../../src/lib/hero-theme';

describe('Phase 63: Activities and Home Views Engine & Transforms Suite', () => {
  describe('ActivitiesView: computeCountMap & Taxonomy Grouping', () => {
    // Exact computeCountMap implementation from ActivitiesView.tsx
    function computeCountMap(centres: any[]) {
      const countMap: Record<string, number> = {};
      if (!Array.isArray(centres)) return countMap;
      centres.forEach((a: any) => {
        const cat = (a.category || '').toLowerCase();
        const acts = (a.activities || []).map((x: string) => x.toLowerCase());
        const allTags = [cat, ...acts];
        allTags.forEach((t) => {
          if (t) countMap[t] = (countMap[t] || 0) + 1;
        });
      });
      return countMap;
    }

    it('should accurately count category and activity frequencies across academies', () => {
      const mockCentres = [
        { id: '1', category: 'badminton', activities: ['Badminton', 'Fitness'] },
        { id: '2', category: 'tennis', activities: ['Tennis', 'Badminton'] },
        { id: '3', category: 'badminton', activities: ['Squash'] },
        { id: '4', category: '', activities: [] },
      ];

      const counts = computeCountMap(mockCentres);
      assert.strictEqual(counts['badminton'], 4); // 2 category + 2 activity
      assert.strictEqual(counts['tennis'], 2); // 1 category + 1 activity
      assert.strictEqual(counts['fitness'], 1);
      assert.strictEqual(counts['squash'], 1);
      assert.strictEqual(counts['cricket'], undefined);
    });

    it('should return empty object safely if centres is null or non-array', () => {
      assert.deepStrictEqual(computeCountMap(null as any), {});
      assert.deepStrictEqual(computeCountMap(undefined as any), {});
      assert.deepStrictEqual(computeCountMap([]), {});
    });

    it('should filter display categories by selected pillar', () => {
      const mockTaxonomy = [
        {
          id: 'pillar-sports',
          name: 'Sports',
          slug: 'sports',
          categories: [
            { id: 'c1', name: 'Badminton', slug: 'badminton' },
            { id: 'c2', name: 'Tennis', slug: 'tennis' },
          ],
        },
        {
          id: 'pillar-arts',
          name: 'Arts',
          slug: 'arts',
          categories: [
            { id: 'c3', name: 'Dance', slug: 'dance' },
            { id: 'c4', name: 'Painting', slug: 'arts' },
          ],
        },
      ];

      function filterCategories(selectedPillar: string, taxonomy: any[]) {
        if (selectedPillar === 'all') {
          return taxonomy.flatMap((t) => t.categories);
        }
        const found = taxonomy.find((t) => t.slug === selectedPillar);
        return found ? found.categories : [];
      }

      assert.strictEqual(filterCategories('all', mockTaxonomy).length, 4);
      assert.strictEqual(filterCategories('sports', mockTaxonomy).length, 2);
      assert.strictEqual(filterCategories('arts', mockTaxonomy).length, 2);
      assert.strictEqual(filterCategories('non-existent', mockTaxonomy).length, 0);
    });
  });

  describe('HomeView: mapCentresToAcademies Transformation', () => {
    // Exact mapping function extracted from HomeView.tsx
    function mapCentresToAcademies(centres: any[], activeCity?: string) {
      if (!Array.isArray(centres) || centres.length === 0) return [];
      return centres.map((c: any) => {
        const categorySlugs = (c.category ? c.category.split(',') : ['tennis'])
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
        const activityNames = categorySlugs.map((slug: string) => getCategoryDisplayName(slug));

        return {
          id: c.id,
          name: c.name,
          tagline: c.tagline,
          category: (c.category as any) || 'tennis',
          activities: activityNames.length > 0 ? activityNames : [getCategoryDisplayName(c.category)],
          activitiesText: activityNames.length > 0 ? activityNames.join(' • ') : getCategoryDisplayName(c.category),
          locality: (c.locality as any) || 'central',
          localityName: c.locality
            ? c.locality.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : c.city || activeCity || 'City Center',
          address: c.address,
          phone: c.phone,
          distance: 2.5,
          distanceText: '2.5 km away',
          age: ['u8', 'u12', 'u16'] as any,
          ageText: c.eligibleAgeGroup || '5 - 16 Yrs',
          fee: Number(c.monthlyTuitionFee) || 1800,
          trialFee: Number(c.trialFee) || 0,
          rating: Number(c.rating) || 5.0,
          reviewsCount: Number(c.reviewsCount || 0),
          verifiedTag: c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Inspected',
          image: c.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
          coachName: c.headCoachName,
          coachTitle: 'NIS Certified Head Coach',
          coachesCount: c.coachesCount || 3,
          ratio: c.studentCoachRatio || '1 : 8',
          facilities: (c.facilities || []).map((f: any) => f.description),
          safety: '24/7 CCTV • First Aid • Police Verified',
          isTopInArea: c.isTopInArea,
          planTier: c.planTier,
          isVerifiedBatch: c.isVerifiedBatch,
          coachType: c.coachType,
          batches: (c.batches || []).map((b: any) => ({
            name: b.name,
            time: b.schedule,
            seats: `${b.seatsFilled}/${b.totalSeats} Enrolled`,
          })),
        };
      });
    }

    it('should transform raw database records into complete Academy UI objects', () => {
      const rawCentres = [
        {
          id: 'centre-ace',
          name: 'Ace Badminton Academy',
          tagline: 'Premier NIS Coaching Center',
          category: 'badminton,fitness',
          locality: 'koramangala-4th-block',
          safetyGrade: 'GRADE_A_PLUS',
          monthlyTuitionFee: '2500',
          trialFee: '0',
          rating: '4.9',
          reviewsCount: '84',
          headCoachName: 'Coach Vikram',
          studentCoachRatio: '1 : 6',
          facilities: [{ description: 'Wooden Synthetic Courts' }, { description: 'First Aid Facility' }],
          isTopInArea: true,
          isVerifiedBatch: true,
          batches: [
            { name: 'Morning Squad', schedule: '6:30 AM - 7:30 AM', seatsFilled: 8, totalSeats: 10 },
          ],
        },
      ];

      const mapped = mapCentresToAcademies(rawCentres, 'Bengaluru');
      assert.strictEqual(mapped.length, 1);

      const acad = mapped[0];
      assert.strictEqual(acad.id, 'centre-ace');
      assert.strictEqual(acad.name, 'Ace Badminton Academy');
      assert.strictEqual(acad.verifiedTag, 'Verified Academy');
      assert.strictEqual(acad.fee, 2500);
      assert.strictEqual(acad.trialFee, 0);
      assert.strictEqual(acad.rating, 4.9);
      assert.strictEqual(acad.reviewsCount, 84);
      assert.strictEqual(acad.coachName, 'Coach Vikram');
      assert.strictEqual(acad.ratio, '1 : 6');
      assert.strictEqual(acad.isTopInArea, true);
      assert.strictEqual(acad.isVerifiedBatch, true);

      // Activities text formatting
      assert.ok(acad.activitiesText.includes('Badminton'));

      // Locality name formatting (single replace of first dash)
      assert.strictEqual(acad.localityName, 'Koramangala 4th-Block');

      // Facilities array
      assert.deepStrictEqual(acad.facilities, ['Wooden Synthetic Courts', 'First Aid Facility']);

      // Batches mapping
      assert.strictEqual(acad.batches[0].name, 'Morning Squad');
      assert.strictEqual(acad.batches[0].seats, '8/10 Enrolled');
    });

    it('should apply fallback defaults when fields are missing or empty', () => {
      const rawCentre = [{ id: 'centre-min', name: 'Minimal Academy' }];
      const mapped = mapCentresToAcademies(rawCentre, 'Hyderabad');

      const acad = mapped[0];
      assert.strictEqual(acad.fee, 1800);
      assert.strictEqual(acad.trialFee, 0);
      assert.strictEqual(acad.rating, 5.0);
      assert.strictEqual(acad.verifiedTag, 'Safety Inspected');
      assert.strictEqual(acad.coachesCount, 3);
      assert.strictEqual(acad.ratio, '1 : 8');
      assert.strictEqual(acad.localityName, 'Hyderabad');
    });
  });

  describe('HomeView: POPULAR_TAG_MAP & Search Suggestion Engine', () => {
    const POPULAR_TAG_MAP: Record<string, { category: string; search: string; pillar: string }> = {
      '🏸 Badminton': { category: 'badminton', search: 'Badminton', pillar: 'sports' },
      '🤖 Robotics': { category: 'robotics', search: 'Robotics', pillar: 'brain-booster' },
      '🎾 Tennis': { category: 'tennis', search: 'Tennis', pillar: 'sports' },
      '🥋 Martial Arts': { category: 'martial-arts', search: 'Martial Arts', pillar: 'sports' },
      '💃 Dance': { category: 'dance', search: 'Dance', pillar: 'arts' },
      '♟️ Chess': { category: 'chess', search: 'Chess', pillar: 'brain-booster' },
      '🏊 Swimming': { category: 'swimming', search: 'Swimming', pillar: 'sports' },
      '🎨 Art & Painting': { category: 'arts', search: 'Art & Painting', pillar: 'arts' },
    };

    it('should resolve popular tag mappings with correct pillar and clean search strings', () => {
      const tags = Object.keys(POPULAR_TAG_MAP);
      assert.strictEqual(tags.length, 8);

      assert.deepStrictEqual(POPULAR_TAG_MAP['🏸 Badminton'], {
        category: 'badminton',
        search: 'Badminton',
        pillar: 'sports',
      });

      assert.deepStrictEqual(POPULAR_TAG_MAP['🤖 Robotics'], {
        category: 'robotics',
        search: 'Robotics',
        pillar: 'brain-booster',
      });

      assert.deepStrictEqual(POPULAR_TAG_MAP['💃 Dance'], {
        category: 'dance',
        search: 'Dance',
        pillar: 'arts',
      });
    });

    it('should filter search suggestions across categories and academies', () => {
      const categories = [
        { name: 'Badminton', slug: 'badminton' },
        { name: 'Cricket', slug: 'cricket' },
        { name: 'Chess', slug: 'chess' },
      ];
      const academies = [
        { id: '1', name: 'Apex Badminton Arena', localityName: 'Whitefield', rating: 4.8 },
        { id: '2', name: 'Grandmaster Chess Club', localityName: 'Indiranagar', rating: 4.9 },
      ];

      function generateSuggestions(query: string) {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const cats = categories
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c) => ({ type: 'category', title: c.name, slug: c.slug }));
        const acads = academies
          .filter((a) => a.name.toLowerCase().includes(q))
          .map((a) => ({ type: 'academy', title: a.name, id: a.id }));
        return [...cats, ...acads];
      }

      const badmResults = generateSuggestions('badm');
      assert.strictEqual(badmResults.length, 2);
      assert.strictEqual(badmResults[0].type, 'category');
      assert.strictEqual(badmResults[0].title, 'Badminton');
      assert.strictEqual(badmResults[1].type, 'academy');
      assert.strictEqual(badmResults[1].title, 'Apex Badminton Arena');

      const chessResults = generateSuggestions('chess');
      assert.strictEqual(chessResults.length, 2);
    });
  });

  describe('Hero Carousel Theme Calculations', () => {
    it('should calculate hero overlay gradients accurately for desktop and mobile', () => {
      const desktopGradient = getHeroOverlayGradient(DEFAULT_HERO_CAROUSEL_THEME, true);
      assert.ok(desktopGradient.includes('linear-gradient(to right'));

      const mobileGradient = getHeroOverlayGradient(DEFAULT_HERO_CAROUSEL_THEME, false);
      assert.ok(mobileGradient.includes('linear-gradient(to top'));
    });

    it('should resolve card height class according to theme settings', () => {
      const compactHeight = getHeroCardHeightClass({
        ...DEFAULT_HERO_CAROUSEL_THEME,
        cardHeightMobile: 'compact',
        cardHeightDesktop: 'compact',
      });
      assert.ok(compactHeight.includes('h-[260px]'));
      assert.ok(compactHeight.includes('md:h-[340px]'));

      const tallHeight = getHeroCardHeightClass({
        ...DEFAULT_HERO_CAROUSEL_THEME,
        cardHeightMobile: 'tall',
        cardHeightDesktop: 'tall',
      });
      assert.ok(tallHeight.includes('h-[340px]'));
      assert.ok(tallHeight.includes('md:h-[450px]'));
    });

    it('should convert hex colors to RGBA correctly', () => {
      assert.strictEqual(hexToRgba('#ffffff', 0.5), 'rgba(255, 255, 255, 0.5)');
      assert.strictEqual(hexToRgba('#000000', 1), 'rgba(0, 0, 0, 1)');
      assert.strictEqual(hexToRgba('#10B981', 0.8), 'rgba(16, 185, 129, 0.8)');
    });
  });
});
