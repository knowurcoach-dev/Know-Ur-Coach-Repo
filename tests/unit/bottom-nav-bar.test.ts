import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 40: Mobile Bottom Navigation & Role Tab Switching Tests', () => {
  // Navigation generation logic extracted directly from src/components/navigation/BottomNavBar.tsx
  function generateBottomNavItems(roleState: {
    isCoach?: boolean;
    isAdmin?: boolean;
    isParent?: boolean;
    isGuest?: boolean;
  }) {
    const { isCoach, isAdmin, isParent } = roleState;

    if (isCoach) {
      return [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'activities', label: 'Discover', href: '/activities' },
        { id: 'leads', label: 'Leads', href: '/coach/leads' },
        { id: 'dashboard', label: 'Dashboard', href: '/coach/dashboard' },
      ];
    }
    if (isAdmin) {
      return [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'activities', label: 'Discover', href: '/activities' },
        { id: 'kyc', label: 'KYC Queue', href: '/admin/verify-coaches' },
        { id: 'admin', label: 'Admin', href: '/admin' },
      ];
    }
    if (isParent) {
      return [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'activities', label: 'Discover', href: '/activities' },
        { id: 'competitions', label: 'Tournaments', href: '/competitions' },
        { id: 'bookings', label: 'My Passes', href: '/parent/bookings' },
      ];
    }
    // Guest view: No authenticated "My Passes" link!
    return [
      { id: 'home', label: 'Home', href: '/' },
      { id: 'activities', label: 'Discover', href: '/activities' },
      { id: 'competitions', label: 'Tournaments', href: '/competitions' },
      { id: 'signin', label: 'Sign In', href: '/login' },
    ];
  }

  function isBottomNavActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  describe('Role-Based Tab Configurations', () => {
    it('should generate coach-centric operational tabs for Coach role', () => {
      const items = generateBottomNavItems({ isCoach: true });
      assert.strictEqual(items.length, 4);
      assert.deepStrictEqual(items.map((i) => i.id), ['home', 'activities', 'leads', 'dashboard']);
      assert.strictEqual(items[2].href, '/coach/leads');
      assert.strictEqual(items[3].href, '/coach/dashboard');
    });

    it('should generate governance and KYC tabs for Admin role', () => {
      const items = generateBottomNavItems({ isAdmin: true });
      assert.strictEqual(items.length, 4);
      assert.deepStrictEqual(items.map((i) => i.id), ['home', 'activities', 'kyc', 'admin']);
      assert.strictEqual(items[2].href, '/admin/verify-coaches');
      assert.strictEqual(items[3].href, '/admin');
    });

    it('should generate parent-centric passes and tournament tabs for Parent role', () => {
      const items = generateBottomNavItems({ isParent: true });
      assert.strictEqual(items.length, 4);
      assert.deepStrictEqual(items.map((i) => i.id), ['home', 'activities', 'competitions', 'bookings']);
      assert.strictEqual(items[3].label, 'My Passes');
      assert.strictEqual(items[3].href, '/parent/bookings');
    });

    it('should generate sign-in call-to-action for Guest without exposing parent passes route', () => {
      const items = generateBottomNavItems({ isGuest: true });
      assert.strictEqual(items.length, 4);
      assert.deepStrictEqual(items.map((i) => i.id), ['home', 'activities', 'competitions', 'signin']);
      assert.strictEqual(items[3].label, 'Sign In');
      assert.strictEqual(items[3].href, '/login');

      // Crucial security verification: guest navigation never points to parent bookings
      assert.strictEqual(items.some((i) => i.href.includes('/parent/')), false);
    });
  });

  describe('Mobile Route Activation Highlighting', () => {
    it('should match home route only on exact / path', () => {
      assert.strictEqual(isBottomNavActive('/', '/'), true);
      assert.strictEqual(isBottomNavActive('/activities', '/'), false);
      assert.strictEqual(isBottomNavActive('/parent/bookings', '/'), false);
    });

    it('should match sub-routes using prefix matching for non-home tabs', () => {
      assert.strictEqual(isBottomNavActive('/activities?category=badminton', '/activities'), true);
      assert.strictEqual(isBottomNavActive('/competitions/comp-101', '/competitions'), true);
      assert.strictEqual(isBottomNavActive('/coach/leads/lead-2', '/coach/leads'), true);
    });
  });
});
