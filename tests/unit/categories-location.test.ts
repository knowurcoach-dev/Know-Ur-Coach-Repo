import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveCategoryFromSearch,
  getCategoryDisplayName,
  getCategoryEmoji,
} from '@/lib/categories';
import {
  calculateDistance,
  formatDistanceText,
  isStateLocation,
  resolveCentreCity,
  getPopularNeighbourhoodsForCity,
} from '@/lib/location';

describe('Phase 16: Category Pillar Resolution & Location Geocoding Tests', () => {
  describe('resolveCategoryFromSearch() Natural Query Resolution', () => {
    it('should resolve dance queries to dance category and arts pillar', () => {
      const res = resolveCategoryFromSearch('kathak dance for kids');
      assert.deepStrictEqual(res, { category: 'dance', pillar: 'arts' });
    });

    it('should resolve badminton queries to sports pillar', () => {
      const res = resolveCategoryFromSearch('shuttle badminton coaching');
      assert.deepStrictEqual(res, { category: 'badminton', pillar: 'sports' });
    });

    it('should resolve robotics and STEM queries to brain-booster pillar', () => {
      const res1 = resolveCategoryFromSearch('lego robotics academy');
      assert.deepStrictEqual(res1, { category: 'robotics', pillar: 'brain-booster' });

      const res2 = resolveCategoryFromSearch('kids coding and python');
      assert.deepStrictEqual(res2, { category: 'robotics', pillar: 'brain-booster' });
    });

    it('should resolve martial arts queries (karate/taekwondo/judo)', () => {
      const res = resolveCategoryFromSearch('black belt karate class');
      assert.deepStrictEqual(res, { category: 'martial-arts', pillar: 'sports' });
    });

    it('should resolve swimming and aquatic queries', () => {
      const res = resolveCategoryFromSearch('indoor swimming pool');
      assert.deepStrictEqual(res, { category: 'swimming', pillar: 'sports' });
    });

    it('should resolve chess queries', () => {
      const res = resolveCategoryFromSearch('chess grandmaster club');
      assert.deepStrictEqual(res, { category: 'chess', pillar: 'brain-booster' });
    });

    it('should resolve abacus and vedic maths queries', () => {
      const res = resolveCategoryFromSearch('vedic arithmetic abacus');
      assert.deepStrictEqual(res, { category: 'abacus', pillar: 'brain-booster' });
    });

    it('should resolve music, guitar, and piano queries', () => {
      const res = resolveCategoryFromSearch('classical piano & guitar lessons');
      assert.deepStrictEqual(res, { category: 'music', pillar: 'arts' });
    });

    it('should return null for empty or unrecognized queries', () => {
      assert.strictEqual(resolveCategoryFromSearch(''), null);
      assert.strictEqual(resolveCategoryFromSearch('xyz123random'), null);
    });
  });

  describe('Category Display Names & Emojis', () => {
    it('should return curated display names and fallback cleanly for unknown', () => {
      assert.strictEqual(getCategoryDisplayName('badminton'), 'Badminton Academy');
      assert.strictEqual(getCategoryDisplayName('tennis'), 'Tennis & Racquet Sports');
      assert.strictEqual(getCategoryDisplayName('custom-sport'), 'Custom Sport');
    });

    it('should return matching emojis', () => {
      assert.strictEqual(getCategoryEmoji('badminton'), '🏸');
      assert.strictEqual(getCategoryEmoji('cricket'), '🏏');
      assert.strictEqual(getCategoryEmoji('robotics'), '🤖');
      assert.strictEqual(getCategoryEmoji('chess'), '♟️');
    });
  });

  describe('calculateDistance() Haversine Formula Calculations', () => {
    it('should return 0 km when distance is between the identical coordinate', () => {
      const dist = calculateDistance(27.2104, 78.0166, 27.2104, 78.0166);
      assert.strictEqual(dist, 0);
    });

    it('should accurately calculate distance between Delhi and Agra (approx 180-200 km)', () => {
      const delhi = { lat: 28.6139, lon: 77.2090 };
      const agra = { lat: 27.1767, lon: 78.0081 };

      const dist = calculateDistance(delhi.lat, delhi.lon, agra.lat, agra.lon);
      assert.ok(dist >= 170 && dist <= 210, `Calculated distance ${dist}km is outside expected range`);
    });

    it('should calculate local intra-city distance in Agra (Kamla Nagar to Sanjay Place ~2-3 km)', () => {
      const kamlaNagar = { lat: 27.2104, lon: 78.0166 };
      const sanjayPlace = { lat: 27.2001, lon: 78.0062 };

      const dist = calculateDistance(kamlaNagar.lat, kamlaNagar.lon, sanjayPlace.lat, sanjayPlace.lon);
      assert.ok(dist > 0.5 && dist < 3.5, `Calculated distance ${dist}km is outside expected range`);
    });
  });

  describe('formatDistanceText() Human Readability', () => {
    it('should format distance under 0.8 km as walking distance meters', () => {
      assert.strictEqual(formatDistanceText(0.45), '450m away (Walking distance)');
      assert.strictEqual(formatDistanceText(0.08), '80m away (Walking distance)');
    });

    it('should format distance >= 0.8 km with 1 decimal place km away', () => {
      assert.strictEqual(formatDistanceText(2.456), '2.5 km away');
      assert.strictEqual(formatDistanceText(12.0), '12.0 km away');
    });
  });

  describe('isStateLocation() State vs. City/Locality Detection', () => {
    it('should recognize Indian states as state queries', () => {
      assert.strictEqual(isStateLocation('Uttar Pradesh'), true);
      assert.strictEqual(isStateLocation('Maharashtra'), true);
      assert.strictEqual(isStateLocation('Karnataka'), true);
      assert.strictEqual(isStateLocation('Delhi NCR'), true);
    });

    it('should return false for neighborhood or city queries', () => {
      assert.strictEqual(isStateLocation('Kamla Nagar'), false);
      assert.strictEqual(isStateLocation('Sanjay Place'), false);
      assert.strictEqual(isStateLocation('Rohini'), false);
      assert.strictEqual(isStateLocation('Dwarka'), false);
      assert.strictEqual(isStateLocation(''), false);
      assert.strictEqual(isStateLocation(undefined), false);
    });
  });

  describe('resolveCentreCity() City Extraction Heuristics', () => {
    it('should prioritize explicit city property if present', () => {
      const centre = { city: 'Agra', address: 'Near Highway, Lucknow Road' };
      assert.strictEqual(resolveCentreCity(centre), 'Agra');
    });

    it('should parse city from address string if city property is missing', () => {
      const centre = { address: 'Sector 62, Noida, Uttar Pradesh 201301' };
      assert.strictEqual(resolveCentreCity(centre), 'Noida');
    });

    it('should fallback to Agra if neither city nor parseable address is found', () => {
      const centre = { address: 'Unknown address' };
      assert.strictEqual(resolveCentreCity(centre), 'Agra');
    });
  });

  describe('getPopularNeighbourhoodsForCity() Location Hub Resolution', () => {
    it('should return dedicated Etmadpur local hubs and not Kamla Nagar', () => {
      const etmadpurHubs = getPopularNeighbourhoodsForCity('Etmadpur');
      assert.ok(etmadpurHubs.length >= 4);

      const hubNames = etmadpurHubs.map((h) => h.name);
      assert.ok(hubNames.includes('Station Road'));
      assert.ok(hubNames.includes('Khandauli Road'));
      assert.ok(hubNames.includes('Mandi Samiti'));
      assert.ok(hubNames.includes('Highway Corridor (NH-19)'));
      // Verify Kamla Nagar is not erroneously listed as a direct local neighbourhood of Etmadpur
      assert.strictEqual(hubNames.includes('Kamla Nagar'), false);
    });

    it('should include Kamla Nagar and Etmadpur under Agra district hubs', () => {
      const agraHubs = getPopularNeighbourhoodsForCity('Agra');
      const hubNames = agraHubs.map((h) => h.name);
      assert.ok(hubNames.includes('Kamla Nagar'));
      assert.ok(hubNames.includes('Sanjay Place'));
      assert.ok(hubNames.includes('Dayalbagh'));
      assert.ok(hubNames.includes('Etmadpur'));
    });
  });
});
