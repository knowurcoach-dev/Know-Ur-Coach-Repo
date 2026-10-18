import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TOP_INDIAN_CITIES, TopCityItem, LocationResult } from '@/lib/location';

describe('Phase 47: Locality Selection Modal & City Resolver Tests', () => {
  // Logic extracted directly from src/components/modals/LocalityModal.tsx
  function prepareLocationCommit(selection: {
    locality: string;
    city: string;
    coords?: { lat: number; lon: number } | null;
  }): { valid: boolean; normalized?: { locality: string; city: string; coords: any }; toast?: string } {
    const loc = (selection.locality || '').trim();
    const city = (selection.city || '').trim();

    if (!loc && !city) {
      return { valid: false };
    }

    const normalizedLocality = loc || city;
    const normalizedCity = city || loc;

    const toast =
      normalizedLocality === normalizedCity
        ? `📍 Location set to ${normalizedCity}`
        : `📍 Location set to ${normalizedLocality}, ${normalizedCity}`;

    return {
      valid: true,
      normalized: {
        locality: normalizedLocality,
        city: normalizedCity,
        coords: selection.coords || null,
      },
      toast,
    };
  }

  function resolveCustomQueryLocation(
    searchQuery: string,
    activeCity: string = 'Agra'
  ): { locality: string; city: string; coords: { lat: number; lon: number } | null } {
    const queryText = searchQuery.trim();
    if (!queryText) {
      return { locality: activeCity, city: activeCity, coords: null };
    }

    const matchedCity = TOP_INDIAN_CITIES.find(
      (c) =>
        c.city.toLowerCase() === queryText.toLowerCase() ||
        queryText.toLowerCase().includes(c.city.toLowerCase())
    );

    const city = matchedCity?.city || activeCity || 'Delhi NCR';
    const locality =
      matchedCity && matchedCity.city.toLowerCase() === queryText.toLowerCase()
        ? matchedCity.city
        : queryText;

    return {
      locality,
      city,
      coords: matchedCity ? { lat: matchedCity.lat, lon: matchedCity.lon } : null,
    };
  }

  function resolveSearchResultItem(item: LocationResult) {
    const locality = item.locality || item.name;
    const city =
      item.city && item.city.toLowerCase() !== 'india'
        ? item.city
        : item.state || 'Delhi NCR';

    return {
      locality,
      city,
      coords: { lat: item.lat, lon: item.lon },
    };
  }

  function checkIsAllIndiaActive(city: string): boolean {
    return city.toLowerCase().includes('india') || city.toLowerCase() === 'all';
  }

  describe('Commit Location Sanitization & Toast Confirmation', () => {
    it('should ignore empty selection attempts', () => {
      const empty = prepareLocationCommit({ locality: '', city: '' });
      assert.strictEqual(empty.valid, false);

      const whitespace = prepareLocationCommit({ locality: '   ', city: '   ' });
      assert.strictEqual(whitespace.valid, false);
    });

    it('should format toast with single city name when locality equals city', () => {
      const commit = prepareLocationCommit({ locality: 'Agra', city: 'Agra' });
      assert.strictEqual(commit.valid, true);
      assert.strictEqual(commit.toast, '📍 Location set to Agra');
    });

    it('should format toast with combined locality and city when distinct', () => {
      const commit = prepareLocationCommit({ locality: 'Kamla Nagar', city: 'Agra' });
      assert.strictEqual(commit.valid, true);
      assert.strictEqual(commit.toast, '📍 Location set to Kamla Nagar, Agra');
    });
  });

  describe('All-India Wide Selection', () => {
    it('should correctly configure All India browse-everywhere state', () => {
      const commit = prepareLocationCommit({
        locality: 'All India',
        city: 'All India',
        coords: null,
      });

      assert.strictEqual(commit.valid, true);
      assert.strictEqual(commit.normalized?.locality, 'All India');
      assert.strictEqual(commit.normalized?.city, 'All India');
      assert.strictEqual(commit.normalized?.coords, null);
      assert.strictEqual(commit.toast, '📍 Location set to All India');
    });

    it('should detect All India active state from diverse city expressions', () => {
      assert.strictEqual(checkIsAllIndiaActive('All India'), true);
      assert.strictEqual(checkIsAllIndiaActive('india'), true);
      assert.strictEqual(checkIsAllIndiaActive('all'), true);
      assert.strictEqual(checkIsAllIndiaActive('Agra'), false);
      assert.strictEqual(checkIsAllIndiaActive('Delhi'), false);
    });
  });

  describe('Custom Query & Top Indian Cities Resolution', () => {
    it('should match known top cities with exact coordinates', () => {
      const res = resolveCustomQueryLocation('Mumbai');
      assert.strictEqual(res.city, 'Mumbai');
      assert.strictEqual(res.locality, 'Mumbai');
      assert.ok(res.coords !== null);
      assert.ok(res.coords.lat > 18 && res.coords.lat < 20); // Mumbai ~19.076
    });

    it('should match city contained within locality phrase', () => {
      const res = resolveCustomQueryLocation('Bandra, Mumbai');
      assert.strictEqual(res.city, 'Mumbai');
      assert.strictEqual(res.locality, 'Bandra, Mumbai');
      assert.ok(res.coords !== null);
    });

    it('should fallback to activeCity when query does not match standard city catalog', () => {
      const res = resolveCustomQueryLocation('Shastri Nagar', 'Agra');
      assert.strictEqual(res.city, 'Agra');
      assert.strictEqual(res.locality, 'Shastri Nagar');
      assert.strictEqual(res.coords, null);
    });
  });

  describe('Geocoding Result Resolution', () => {
    it('should extract locality and city from LocationResult schema', () => {
      const mockResult: LocationResult = {
        id: 'loc-1',
        name: 'Eklavya Stadium',
        displayName: 'Eklavya Stadium, Sadar Bazar, Agra',
        locality: 'Sadar Bazar',
        city: 'Agra',
        state: 'Uttar Pradesh',
        lat: 27.15,
        lon: 78.01,
      };

      const resolved = resolveSearchResultItem(mockResult);
      assert.strictEqual(resolved.locality, 'Sadar Bazar');
      assert.strictEqual(resolved.city, 'Agra');
      assert.strictEqual(resolved.coords.lat, 27.15);
    });

    it('should fallback to state when city is India or missing', () => {
      const mockResult: LocationResult = {
        id: 'loc-2',
        name: 'Connaught Place',
        displayName: 'Connaught Place, Delhi',
        locality: 'Connaught Place',
        city: 'India',
        state: 'Delhi',
        lat: 28.63,
        lon: 77.21,
      };

      const resolved = resolveSearchResultItem(mockResult);
      assert.strictEqual(resolved.locality, 'Connaught Place');
      assert.strictEqual(resolved.city, 'Delhi');
    });
  });
});
