import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_HERO_CAROUSEL_THEME } from '@/lib/hero-theme';
import { formatBatchItem } from '@/lib/batch-helpers';

describe('Phase 27: Cached Queries & Data Serialization Engine Tests', () => {
  // Replicating toPlainObject from cached-queries.ts
  function toPlainObject<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }

  // Replicating discovery data mapping logic from cached-queries.ts
  function mapDiscoveryData(raw: {
    centres: any[];
    competitions?: any[];
    majorActivities?: any[];
    heroSlides?: any[];
    heroCarouselTheme?: any;
    config?: any;
  }) {
    const mappedActivities = (raw.majorActivities || []).map((act: any) => ({
      id: act.id,
      name: act.name,
      slug: act.slug,
      description: act.description,
      imageUrl: act.imageUrl,
      icon: act.icon,
      accentColor: act.accentColor,
      order: act.order,
      isActive: act.isActive,
      categories: (act.disciplines || []).map((d: any) => ({
        id: d.id,
        activityId: d.activityId,
        name: d.name,
        slug: d.slug,
        shortDesc: d.shortDesc,
        imageUrl: d.imageUrl,
        icon: d.icon,
        badge: d.badge,
        order: d.order,
        isActive: d.isActive,
      })),
    }));

    const allCategories = mappedActivities.flatMap((act) => act.categories);

    const mappedCentres = (raw.centres || []).map((c: any) => ({
      ...c,
      batches: (c.batches || []).map((b: any) => formatBatchItem(b, c.category)),
    }));

    return toPlainObject({
      centres: mappedCentres,
      competitions: raw.competitions || [],
      activities: mappedActivities,
      categories: allCategories,
      config: raw.config || null,
      heroSlides: raw.heroSlides || [],
      heroCarouselTheme: raw.heroCarouselTheme || DEFAULT_HERO_CAROUSEL_THEME,
    });
  }

  // Replicating safe fallback when DB query fails
  function getSafeDiscoveryFallback() {
    return toPlainObject({
      centres: [],
      competitions: [],
      activities: [],
      categories: [],
      config: null,
      heroSlides: [],
      heroCarouselTheme: DEFAULT_HERO_CAROUSEL_THEME,
    });
  }

  describe('toPlainObject() JSON Serialization', () => {
    it('should convert Date instances into ISO strings and strip circular or undefined properties', () => {
      const complexObject = {
        id: 'c-1',
        name: 'Test Academy',
        createdAt: new Date('2026-10-18T12:00:00.000Z'),
        undefinedProperty: undefined,
      };

      const plain = toPlainObject(complexObject);

      assert.strictEqual(plain.id, 'c-1');
      assert.strictEqual(plain.createdAt, '2026-10-18T12:00:00.000Z');
      assert.strictEqual('undefinedProperty' in plain, false);
    });
  });

  describe('Discovery Data Aggregation & Batch Formatting', () => {
    it('should compile disciplines into flat allCategories list and format centre batches', () => {
      const raw = {
        centres: [
          {
            id: 'ctr-1',
            name: 'Agra Badminton Star',
            category: 'badminton',
            batches: [
              {
                id: 'b-1',
                name: 'Morning Batch',
                schedule: 'Daily • 6:00 AM - 7:30 AM',
                totalSeats: 15,
                seatsFilled: 10,
              },
            ],
          },
        ],
        majorActivities: [
          {
            id: 'act-sports',
            name: 'Sports & Athletics',
            slug: 'sports',
            disciplines: [
              { id: 'd-1', name: 'Badminton', slug: 'badminton', badge: 'Certified' },
              { id: 'd-2', name: 'Tennis', slug: 'tennis', badge: 'Clay Courts' },
            ],
          },
        ],
      };

      const result = mapDiscoveryData(raw);

      // Verify centre batch formatting
      assert.strictEqual(result.centres.length, 1);
      assert.strictEqual(result.centres[0].batches[0].categoryDisplayName, 'Badminton Academy');
      assert.strictEqual(result.centres[0].batches[0].categoryEmoji, '🏸');
      assert.strictEqual(result.centres[0].batches[0].seats, '10/15 Enrolled');

      // Verify disciplines flattened into categories
      assert.strictEqual(result.activities.length, 1);
      assert.strictEqual(result.categories.length, 2);
      assert.deepStrictEqual(
        result.categories.map((c: any) => c.slug),
        ['badminton', 'tennis']
      );
    });
  });

  describe('Database Offline Resilience Fallback', () => {
    it('should return safe fallback object with empty collections and default theme on DB error', () => {
      const fallback = getSafeDiscoveryFallback();

      assert.deepStrictEqual(fallback.centres, []);
      assert.deepStrictEqual(fallback.competitions, []);
      assert.deepStrictEqual(fallback.activities, []);
      assert.deepStrictEqual(fallback.categories, []);
      assert.strictEqual(fallback.config, null);
      assert.strictEqual(fallback.heroCarouselTheme.overlayColor, '#020617');
    });
  });
});
