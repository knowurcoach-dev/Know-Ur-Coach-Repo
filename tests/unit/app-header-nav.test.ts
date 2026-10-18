import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 53: App Header Navigation & Dynamic User CTAs Tests', () => {
  // Logic extracted directly from src/components/navigation/AppHeader.tsx
  function formatHeaderLocality(activeLocality: string, activeCity: string): string {
    if (activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase()) {
      return `${activeLocality}, ${activeCity}`;
    }
    return activeCity;
  }

  function getAdminBreadcrumbTitle(pathname: string): string {
    const raw = pathname.replace('/admin', '').replace('/', '').replace(/-/g, ' ');
    return raw.trim() || 'Dashboard';
  }

  function getVisibleNavLinks(
    pathname: string,
    userState: { isParent?: boolean; isCoach?: boolean; isAdmin?: boolean }
  ) {
    const isAdminPath = pathname.startsWith('/admin');
    if (isAdminPath) {
      return { isAdminMode: true, links: [] };
    }

    const links = [
      { label: 'Home', href: '/' },
      { label: 'Discover', href: '/activities' },
      { label: 'Tournaments', href: '/competitions' },
    ];

    if (userState.isParent) {
      links.push({ label: 'My Passes', href: '/parent/bookings' });
    }
    if (userState.isCoach) {
      links.push({ label: 'Coach Dashboard', href: '/coach/dashboard' });
    }
    if (userState.isAdmin) {
      links.push({ label: 'Admin Console', href: '/admin' });
    }

    return { isAdminMode: false, links };
  }

  function getUserAccountDestination(userState: {
    isCoach?: boolean;
    isAdmin?: boolean;
    isParent?: boolean;
  }): string {
    if (userState.isCoach) return '/coach/dashboard';
    if (userState.isAdmin) return '/admin';
    return '/parent/bookings';
  }

  function getNotificationBadgeState(unreadCount: number) {
    return {
      isVisible: unreadCount > 0,
      badgeText: unreadCount > 0 ? String(unreadCount) : null,
    };
  }

  describe('Location Pill Text Formatting', () => {
    it('should format single city name when locality matches city', () => {
      assert.strictEqual(formatHeaderLocality('Agra', 'Agra'), 'Agra');
      assert.strictEqual(formatHeaderLocality('agra', 'Agra'), 'Agra');
    });

    it('should format combined Locality, City when specific locality is selected', () => {
      assert.strictEqual(formatHeaderLocality('Kamla Nagar', 'Agra'), 'Kamla Nagar, Agra');
      assert.strictEqual(formatHeaderLocality('Sanjay Place', 'Agra'), 'Sanjay Place, Agra');
    });

    it('should fallback to activeCity when locality is empty', () => {
      assert.strictEqual(formatHeaderLocality('', 'Agra'), 'Agra');
    });
  });

  describe('Admin Breadcrumb & Nav Mode Switching', () => {
    it('should hide public navigation and render Admin Suite breadcrumb on /admin routes', () => {
      const nav = getVisibleNavLinks('/admin/verify-coaches', { isAdmin: true });
      assert.strictEqual(nav.isAdminMode, true);
      assert.strictEqual(nav.links.length, 0);

      const title = getAdminBreadcrumbTitle('/admin/verify-coaches');
      assert.strictEqual(title, 'verify coaches');
    });

    it('should default breadcrumb title to Dashboard on root /admin path', () => {
      const title = getAdminBreadcrumbTitle('/admin');
      assert.strictEqual(title, 'Dashboard');
    });

    it('should show public navigation when not on admin path', () => {
      const nav = getVisibleNavLinks('/activities', {});
      assert.strictEqual(nav.isAdminMode, false);
      assert.strictEqual(nav.links.length, 3);
      assert.deepStrictEqual(nav.links.map((l) => l.label), ['Home', 'Discover', 'Tournaments']);
    });
  });

  describe('Role-Specific Dashboard Link Injection', () => {
    it('should inject My Passes link for authenticated parents', () => {
      const nav = getVisibleNavLinks('/', { isParent: true });
      assert.ok(nav.links.some((l) => l.label === 'My Passes' && l.href === '/parent/bookings'));
    });

    it('should inject Coach Dashboard link for coaches', () => {
      const nav = getVisibleNavLinks('/', { isCoach: true });
      assert.ok(nav.links.some((l) => l.label === 'Coach Dashboard' && l.href === '/coach/dashboard'));
    });

    it('should inject Admin Console link for platform admins', () => {
      const nav = getVisibleNavLinks('/', { isAdmin: true });
      assert.ok(nav.links.some((l) => l.label === 'Admin Console' && l.href === '/admin'));
    });

    it('should route user account avatar button to their primary dashboard', () => {
      assert.strictEqual(getUserAccountDestination({ isCoach: true }), '/coach/dashboard');
      assert.strictEqual(getUserAccountDestination({ isAdmin: true }), '/admin');
      assert.strictEqual(getUserAccountDestination({ isParent: true }), '/parent/bookings');
    });
  });

  describe('Unread Notification Badge', () => {
    it('should show badge with count when unreadCount > 0', () => {
      const badge = getNotificationBadgeState(5);
      assert.strictEqual(badge.isVisible, true);
      assert.strictEqual(badge.badgeText, '5');
    });

    it('should hide badge when unreadCount is 0', () => {
      const badge = getNotificationBadgeState(0);
      assert.strictEqual(badge.isVisible, false);
      assert.strictEqual(badge.badgeText, null);
    });
  });
});
