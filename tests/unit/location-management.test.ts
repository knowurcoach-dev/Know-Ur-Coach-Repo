import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_LOCATION_CONFIG,
  mergeLocationConfig,
  sortConfiguredCities,
  ConfiguredCityItem,
} from '../../src/lib/location-config';

describe('Location Management & Sorting Unit Tests', () => {
  test('should have valid default location configuration', () => {
    assert.strictEqual(DEFAULT_LOCATION_CONFIG.defaultCity, 'Agra');
    assert.strictEqual(DEFAULT_LOCATION_CONFIG.autoShowModal, true);
    assert.strictEqual(DEFAULT_LOCATION_CONFIG.isDismissible, true);
    assert.strictEqual(DEFAULT_LOCATION_CONFIG.showGpsButton, true);
    assert.strictEqual(DEFAULT_LOCATION_CONFIG.showAllIndiaButton, true);
    assert.ok(DEFAULT_LOCATION_CONFIG.cities.length >= 10);
  });

  test('should merge partial config with defaults safely', () => {
    const merged = mergeLocationConfig({
      defaultCity: 'Delhi NCR',
      autoShowModal: false,
    });
    assert.strictEqual(merged.defaultCity, 'Delhi NCR');
    assert.strictEqual(merged.autoShowModal, false);
    assert.strictEqual(merged.isDismissible, true); // preserved default
    assert.strictEqual(merged.cities.length, DEFAULT_LOCATION_CONFIG.cities.length);
  });

  test('should sort cities alphabetically (A to Z)', () => {
    const testCities: ConfiguredCityItem[] = [
      { id: '1', city: 'Pune', state: 'MH', lat: 0, lon: 0, isActive: true, order: 1 },
      { id: '2', city: 'Agra', state: 'UP', lat: 0, lon: 0, isActive: true, order: 2 },
      { id: '3', city: 'Bengaluru', state: 'KA', lat: 0, lon: 0, isActive: true, order: 3 },
    ];
    const sorted = sortConfiguredCities(testCities, 'alphabetical');
    assert.strictEqual(sorted[0].city, 'Agra');
    assert.strictEqual(sorted[1].city, 'Bengaluru');
    assert.strictEqual(sorted[2].city, 'Pune');
  });

  test('should sort cities by most academies count first', () => {
    const testCities: ConfiguredCityItem[] = [
      { id: '1', city: 'Agra', state: 'UP', lat: 0, lon: 0, isActive: true, order: 1 },
      { id: '2', city: 'Delhi NCR', state: 'DL', lat: 0, lon: 0, isActive: true, order: 2 },
      { id: '3', city: 'Mumbai', state: 'MH', lat: 0, lon: 0, isActive: true, order: 3 },
    ];
    const counts = {
      'Agra': 5,
      'Delhi NCR': 20,
      'Mumbai': 12,
    };
    const sorted = sortConfiguredCities(testCities, 'most_academies', counts);
    assert.strictEqual(sorted[0].city, 'Delhi NCR'); // 20
    assert.strictEqual(sorted[1].city, 'Mumbai');    // 12
    assert.strictEqual(sorted[2].city, 'Agra');      // 5
  });

  test('should respect manual order index when in manual mode', () => {
    const testCities: ConfiguredCityItem[] = [
      { id: '1', city: 'Mumbai', state: 'MH', lat: 0, lon: 0, isActive: true, order: 3 },
      { id: '2', city: 'Agra', state: 'UP', lat: 0, lon: 0, isActive: true, order: 1 },
      { id: '3', city: 'Bengaluru', state: 'KA', lat: 0, lon: 0, isActive: true, order: 2 },
    ];
    const sorted = sortConfiguredCities(testCities, 'manual');
    assert.strictEqual(sorted[0].city, 'Agra');
    assert.strictEqual(sorted[1].city, 'Bengaluru');
    assert.strictEqual(sorted[2].city, 'Mumbai');
  });
});
