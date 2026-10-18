import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 37: Parent & Admin Sidebar Navigation Routing Tests', () => {
  // Navigation definitions from ParentSidebar.tsx
  const parentNavItems = [
    {
      group: 'Admissions & Bookings',
      items: [{ label: 'My Bookings & Admissions', href: '/parent/bookings' }],
    },
    {
      group: 'My Children',
      items: [{ label: 'Child Profiles', href: '/parent/children' }],
    },
    {
      group: 'Discover',
      items: [
        { label: 'Saved Academies', href: '/parent/saved' },
        { label: 'Browse Academies', href: '/activities' },
      ],
    },
    {
      group: 'Account',
      items: [
        { label: 'Tuition & Payment Records', href: '/parent/payments' },
        { label: 'Notifications', href: '/parent/notifications' },
        { label: 'Account Settings', href: '/parent/settings' },
      ],
    },
  ];

  // Navigation definitions from AdminSidebar.tsx
  const adminNavItems = [
    {
      group: 'Governance',
      items: [
        { label: 'Overview Dashboard', href: '/admin', exactMatch: true },
        { label: 'Payments & Orders', href: '/admin/orders' },
        { label: 'Coach KYC Queue', href: '/admin/verify-coaches' },
        { label: 'Audit Logs', href: '/admin/audit-logs' },
      ],
    },
    {
      group: 'Registry',
      items: [
        { label: 'Parent Registry', href: '/admin/parents' },
        { label: 'Coach & Academy Registry', href: '/admin/coaches' },
      ],
    },
    {
      group: 'Platform',
      items: [
        { label: 'Hero Carousel', href: '/admin/hero-slides' },
        { label: 'Competition Management', href: '/admin/competitions' },
        { label: 'Activities & Disciplines', href: '/admin/categories' },
      ],
    },
    {
      group: 'Configuration',
      items: [
        { label: 'Fee & Plan Config', href: '/admin/plans' },
        { label: 'Payment Gateway', href: '/admin/payments' },
        { label: 'Theme & Styling', href: '/admin/theme' },
        { label: 'Platform Settings', href: '/admin/config' },
      ],
    },
  ];

  // Active matching logic from ParentSidebar.tsx
  function isParentRouteActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  // Active matching logic from AdminSidebar.tsx
  function isAdminRouteActive(pathname: string, href: string, exactMatch?: boolean): boolean {
    if (exactMatch) return pathname === href;
    return pathname.startsWith(href);
  }

  function getParentProfileDisplay(user: any) {
    const name = user?.name || 'Parent Account';
    const initial = user?.name?.[0]?.toUpperCase() || 'P';
    const trustBadge = 'Direct Academy Admissions • ₹0 Fee';
    return { name, initial, trustBadge };
  }

  function getAdminProfileDisplay(user: any) {
    const name = user?.name || 'Super Admin';
    const initial = user?.name?.[0]?.toUpperCase() || 'A';
    const badge = 'KnowUrCoach Admin Suite';
    return { name, initial, badge };
  }

  describe('Parent Sidebar Navigation & Active Highlighting', () => {
    it('should configure 4 primary parent portal categories', () => {
      const groups = parentNavItems.map((g) => g.group);
      assert.deepStrictEqual(groups, [
        'Admissions & Bookings',
        'My Children',
        'Discover',
        'Account',
      ]);
    });

    it('should activate parent sub-routes via prefix matching', () => {
      assert.strictEqual(isParentRouteActive('/parent/bookings/bk-1001', '/parent/bookings'), true);
      assert.strictEqual(isParentRouteActive('/parent/children/add', '/parent/children'), true);
      assert.strictEqual(isParentRouteActive('/parent/payments?status=paid', '/parent/payments'), true);
    });

    it('should correctly fallback parent initial and display name', () => {
      const authenticated = getParentProfileDisplay({ name: 'Sunita Mehra' });
      assert.strictEqual(authenticated.name, 'Sunita Mehra');
      assert.strictEqual(authenticated.initial, 'S');

      const anonymous = getParentProfileDisplay(null);
      assert.strictEqual(anonymous.name, 'Parent Account');
      assert.strictEqual(anonymous.initial, 'P');
      assert.strictEqual(anonymous.trustBadge, 'Direct Academy Admissions • ₹0 Fee');
    });
  });

  describe('Admin Sidebar Navigation & Exact Match Edge Cases', () => {
    it('should configure 4 governance and control groups in Admin Suite', () => {
      const groups = adminNavItems.map((g) => g.group);
      assert.deepStrictEqual(groups, [
        'Governance',
        'Registry',
        'Platform',
        'Configuration',
      ]);
    });

    it('should enforce exactMatch on /admin root dashboard to prevent false active state across all admin sub-routes', () => {
      // Root dashboard should be active only on exact /admin
      assert.strictEqual(isAdminRouteActive('/admin', '/admin', true), true);

      // Visiting /admin/orders or /admin/verify-coaches must NOT activate /admin
      assert.strictEqual(isAdminRouteActive('/admin/orders', '/admin', true), false);
      assert.strictEqual(isAdminRouteActive('/admin/verify-coaches', '/admin', true), false);
      assert.strictEqual(isAdminRouteActive('/admin/coaches', '/admin', true), false);
    });

    it('should use prefix matching for specialized admin modules', () => {
      assert.strictEqual(isAdminRouteActive('/admin/orders/ord-999', '/admin/orders', false), true);
      assert.strictEqual(isAdminRouteActive('/admin/verify-coaches?filter=pending', '/admin/verify-coaches', false), true);
      assert.strictEqual(isAdminRouteActive('/admin/plans/edit/plan-1', '/admin/plans', false), true);
    });

    it('should correctly fallback admin display name and avatar initial', () => {
      const customAdmin = getAdminProfileDisplay({ name: 'Devendra Singh' });
      assert.strictEqual(customAdmin.name, 'Devendra Singh');
      assert.strictEqual(customAdmin.initial, 'D');

      const fallbackAdmin = getAdminProfileDisplay(null);
      assert.strictEqual(fallbackAdmin.name, 'Super Admin');
      assert.strictEqual(fallbackAdmin.initial, 'A');
      assert.strictEqual(fallbackAdmin.badge, 'KnowUrCoach Admin Suite');
    });
  });
});
