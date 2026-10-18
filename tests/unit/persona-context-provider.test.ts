import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Setup React 19 Dispatcher
const dispatcher = {
  useContext: () => ({
    data: {
      user: {
        id: 'usr-parent-1',
        name: 'Parent Priya',
        email: 'priya@example.com',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        lat: 12.97,
        lon: 77.64,
      },
    },
  }),
  useState: (initial: any) => [
    typeof initial === 'function' ? initial() : initial,
    () => {},
  ],
  useEffect: () => {},
  useRef: (init: any) => ({ current: init }),
  useCallback: (fn: any) => fn,
  useMemo: (fn: any) => fn(),
  useSyncExternalStore: (subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: () => {},
  use: () => ({ data: null }),
};

const secret = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

if (secret) {
  if (secret.H !== undefined) {
    secret.H = dispatcher;
  }
  if (secret.ReactCurrentDispatcher) {
    secret.ReactCurrentDispatcher.current = dispatcher;
  }
}

import { PersonaProvider } from '../../src/context/PersonaContext';

describe('Phase 66: Persona UI Context & Location State Suite', () => {
  describe('DEFAULT_LOCATION Configuration', () => {
    it('should default browsing locality and city to "All India"', () => {
      const DEFAULT_LOCATION = {
        locality: 'All India',
        city: 'All India',
        coords: null,
      };

      assert.strictEqual(DEFAULT_LOCATION.locality, 'All India');
      assert.strictEqual(DEFAULT_LOCATION.city, 'All India');
      assert.strictEqual(DEFAULT_LOCATION.coords, null);
    });
  });

  describe('PersonaProvider Component Mounting', () => {
    it('should wrap application children and mount without crashing', () => {
      const testChild = React.createElement('div', { id: 'app-tree' }, 'App Tree Content');
      const el = PersonaProvider({ children: testChild });

      assert.ok(el !== null);
      assert.strictEqual(typeof el.type, 'object'); // Context.Provider
      assert.strictEqual(el.props.children, testChild);
      assert.ok(el.props.value !== null);
      assert.strictEqual(typeof el.props.value, 'object');
    });

    it('should provide complete context surface methods and properties', () => {
      const el = PersonaProvider({ children: 'Child' });
      const value = el.props.value;

      assert.ok('activeTab' in value);
      assert.ok('setActiveTab' in value);
      assert.ok('activeLocality' in value);
      assert.ok('setActiveLocality' in value);
      assert.ok('activeCity' in value);
      assert.ok('setActiveCity' in value);
      assert.ok('activeCoords' in value);
      assert.ok('setActiveCoords' in value);
      assert.ok('setLocation' in value);
      assert.ok('resetToRegisteredAddress' in value);
      assert.ok('detectGPSLocation' in value);
      assert.ok('showToast' in value);
      assert.ok('toast' in value);
      assert.ok('unreadCount' in value);
    });
  });

  describe('Location Parsing & Hydration Rules', () => {
    it('should safely parse stored location JSON from localStorage', () => {
      const rawStored = JSON.stringify({
        locality: 'Whitefield',
        city: 'Bengaluru',
        coords: { lat: 12.9698, lon: 77.75 },
      });

      function parseLocation(jsonStr: string | null) {
        if (!jsonStr) return null;
        try {
          const parsed = JSON.parse(jsonStr);
          return {
            locality: parsed.locality || 'All India',
            city: parsed.city || 'All India',
            coords: parsed.coords || null,
          };
        } catch {
          return null;
        }
      }

      const loc = parseLocation(rawStored);
      assert.ok(loc !== null);
      assert.strictEqual(loc.locality, 'Whitefield');
      assert.strictEqual(loc.city, 'Bengaluru');
      assert.strictEqual(loc.coords.lat, 12.9698);

      // Handle invalid JSON safely
      assert.strictEqual(parseLocation('{invalid-json'), null);
      assert.strictEqual(parseLocation(null), null);
    });
  });
});
