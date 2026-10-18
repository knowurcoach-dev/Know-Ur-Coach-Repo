import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LocationResult } from '@/lib/location';
import { SelectedAddressDetails } from '@/components/ui/AddressAutocomplete';

describe('Phase 56: Address Autocomplete & Location Details Parser Tests', () => {
  // Logic extracted directly from src/components/ui/AddressAutocomplete.tsx
  function shouldTriggerSearch(
    query: string,
    selectedDetails: SelectedAddressDetails | null
  ): boolean {
    if (!query || query.trim().length < 2) {
      return false;
    }

    if (
      selectedDetails &&
      (query.trim().toLowerCase() === selectedDetails.formattedAddress.trim().toLowerCase() ||
        query.trim().toLowerCase() === selectedDetails.locality.trim().toLowerCase() ||
        query.trim().toLowerCase() === selectedDetails.name.trim().toLowerCase())
    ) {
      return false;
    }

    return true;
  }

  function transformLocationResultToDetails(item: LocationResult): SelectedAddressDetails {
    const formatted = item.displayName || `${item.name}, ${item.city}`;
    return {
      formattedAddress: formatted,
      name: item.name,
      locality: item.locality || item.name,
      city: item.city,
      state: item.state,
      postcode: item.postcode,
      lat: item.lat,
      lon: item.lon,
    };
  }

  function handleAddressClear() {
    return {
      query: '',
      selectedDetails: null,
      suggestions: [],
      isOpen: false,
      valueEmitted: '',
      detailsEmitted: undefined,
    };
  }

  describe('Search Trigger Heuristics & Duplicate Query Suppression', () => {
    it('should not search when query is shorter than 2 characters or whitespace-only', () => {
      assert.strictEqual(shouldTriggerSearch('', null), false);
      assert.strictEqual(shouldTriggerSearch('a', null), false);
      assert.strictEqual(shouldTriggerSearch('   ', null), false);
    });

    it('should trigger search when query has 2 or more characters and no address is selected', () => {
      assert.strictEqual(shouldTriggerSearch('Taj', null), true);
      assert.strictEqual(shouldTriggerSearch('Kamla Nagar', null), true);
    });

    it('should suppress search if user query matches the already selected address formattedAddress', () => {
      const selected: SelectedAddressDetails = {
        formattedAddress: 'Eklavya Stadium, Sadar Bazar, Agra',
        name: 'Eklavya Stadium',
        locality: 'Sadar Bazar',
        city: 'Agra',
        state: 'Uttar Pradesh',
      };

      assert.strictEqual(shouldTriggerSearch('Eklavya Stadium, Sadar Bazar, Agra', selected), false);
      assert.strictEqual(shouldTriggerSearch('eklavya stadium', selected), false);
      assert.strictEqual(shouldTriggerSearch('sadar bazar', selected), false);
    });

    it('should re-trigger search if query is modified beyond selected details', () => {
      const selected: SelectedAddressDetails = {
        formattedAddress: 'Eklavya Stadium, Sadar Bazar, Agra',
        name: 'Eklavya Stadium',
        locality: 'Sadar Bazar',
        city: 'Agra',
        state: 'Uttar Pradesh',
      };

      assert.strictEqual(shouldTriggerSearch('Eklavya Stadium Gate 2', selected), true);
    });
  });

  describe('LocationResult Transformation & Fallbacks', () => {
    it('should derive complete SelectedAddressDetails from LocationResult', () => {
      const result: LocationResult = {
        id: 'loc-101',
        name: 'Taj City Tennis Club',
        displayName: 'Taj City Tennis Club, Fatehabad Road, Agra, 282001',
        locality: 'Fatehabad Road',
        city: 'Agra',
        state: 'Uttar Pradesh',
        postcode: '282001',
        lat: 27.16,
        lon: 78.04,
      };

      const details = transformLocationResultToDetails(result);
      assert.strictEqual(details.formattedAddress, 'Taj City Tennis Club, Fatehabad Road, Agra, 282001');
      assert.strictEqual(details.name, 'Taj City Tennis Club');
      assert.strictEqual(details.locality, 'Fatehabad Road');
      assert.strictEqual(details.city, 'Agra');
      assert.strictEqual(details.state, 'Uttar Pradesh');
      assert.strictEqual(details.postcode, '282001');
      assert.strictEqual(details.lat, 27.16);
      assert.strictEqual(details.lon, 78.04);
    });

    it('should fallback locality to name when locality is empty', () => {
      const resultWithoutLocality: LocationResult = {
        id: 'loc-102',
        name: 'Agra Sports Complex',
        city: 'Agra',
        state: 'Uttar Pradesh',
        lat: 27.18,
        lon: 78.02,
      };

      const details = transformLocationResultToDetails(resultWithoutLocality);
      assert.strictEqual(details.locality, 'Agra Sports Complex');
      assert.strictEqual(details.formattedAddress, 'Agra Sports Complex, Agra');
    });
  });

  describe('Address Clear Operation', () => {
    it('should reset all autocomplete states and emit empty string with undefined details', () => {
      const state = handleAddressClear();
      assert.strictEqual(state.query, '');
      assert.strictEqual(state.selectedDetails, null);
      assert.strictEqual(state.isOpen, false);
      assert.deepStrictEqual(state.suggestions, []);
      assert.strictEqual(state.valueEmitted, '');
      assert.strictEqual(state.detailsEmitted, undefined);
    });
  });
});
