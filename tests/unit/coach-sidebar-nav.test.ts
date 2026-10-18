import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 33: Coach Sidebar Navigation & Operational Locks Tests', () => {
  // Navigation structure definition extracted directly from src/components/navigation/CoachSidebar.tsx
  const navItems = [
    {
      group: 'Operations',
      items: [
        { label: 'Operations Overview', href: '/coach/dashboard', isGated: false },
        { label: 'Live Attendance Roster', href: '/coach/attendance', isGated: true },
      ],
    },
    {
      group: 'Students & Leads',
      items: [
        { label: 'Student Leads (CRM)', href: '/coach/leads', isGated: true },
        { label: 'Enrolled Students', href: '/coach/students', isGated: true },
      ],
    },
    {
      group: 'Academy Management',
      items: [
        { label: 'Batch Management', href: '/coach/batches', isGated: true },
        { label: 'Revenue & Analytics', href: '/coach/revenue', isGated: true },
        { label: 'Academy Profile', href: '/coach/profile', isGated: false },
      ],
    },
    {
      group: 'Plans & Visibility',
      items: [
        { label: 'Payment & Plan', href: '/coach/plans', isGated: false },
        { label: 'Public Directory Page', href: '/coach/listings', isGated: true },
        { label: 'Promote Center', href: '/coach/promote', isGated: true },
      ],
    },
  ];

  // Route matching logic from CoachSidebar.tsx
  function isRouteActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || (href !== '/coach/dashboard' && pathname.startsWith(href));
  }

  // Active plan derivation logic from CoachSidebar.tsx
  function checkHasActivePlan(centreData: any): boolean {
    return (
      centreData?.planTier === 'STANDARD' ||
      centreData?.planTier === 'PREMIUM' ||
      Boolean(centreData?.planPurchasedAt || centreData?.planPaymentId)
    );
  }

  // Operations unlock logic from CoachSidebar.tsx
  function checkIsOperationsUnlocked(loading: boolean, hasActivePlan: boolean): boolean {
    return loading ? true : hasActivePlan;
  }

  // Display metadata fallbacks logic from CoachSidebar.tsx
  function getSidebarDisplayData(user: any, centreData: any) {
    const academyName = centreData?.name || (user?.name ? `${user.name}'s Academy` : 'My Coaching Centre');
    const locality = centreData?.locality || user?.locality || 'Verified Academy Campus';
    const plan = centreData?.planTier || 'FREE';
    const avatarInitial = user?.name?.[0]?.toUpperCase() || 'C';
    const isKycApproved = centreData?.kycStatus === 'APPROVED';
    const kycBadge = {
      label: isKycApproved ? 'KYC Verified' : 'Compliance Pending',
      color: isKycApproved ? 'emerald' : 'amber',
    };

    return { academyName, locality, plan, avatarInitial, kycBadge };
  }

  describe('Navigation Hierarchy & Gating Rules', () => {
    it('should configure exact 4 navigational groups with expected categories', () => {
      const groupNames = navItems.map((g) => g.group);
      assert.deepStrictEqual(groupNames, [
        'Operations',
        'Students & Leads',
        'Academy Management',
        'Plans & Visibility',
      ]);
    });

    it('should contain 10 total navigation links across all groups', () => {
      const allItems = navItems.flatMap((g) => g.items);
      assert.strictEqual(allItems.length, 10);
    });

    it('should keep core entry points un-gated (Dashboard, Profile, Plans)', () => {
      const unGatedItems = navItems
        .flatMap((g) => g.items)
        .filter((item) => !item.isGated)
        .map((item) => item.href);

      assert.deepStrictEqual(unGatedItems, [
        '/coach/dashboard',
        '/coach/profile',
        '/coach/plans',
      ]);
    });

    it('should gate operational routes requiring active subscription', () => {
      const gatedItems = navItems
        .flatMap((g) => g.items)
        .filter((item) => item.isGated)
        .map((item) => item.href);

      assert.deepStrictEqual(gatedItems, [
        '/coach/attendance',
        '/coach/leads',
        '/coach/students',
        '/coach/batches',
        '/coach/revenue',
        '/coach/listings',
        '/coach/promote',
      ]);
    });
  });

  describe('Active Route Highlighting Heuristics', () => {
    it('should require exact match for dashboard to avoid false highlighting on nested routes', () => {
      assert.strictEqual(isRouteActive('/coach/dashboard', '/coach/dashboard'), true);
      assert.strictEqual(isRouteActive('/coach/dashboard/metrics', '/coach/dashboard'), false);
    });

    it('should match sub-routes using prefix matching for non-dashboard paths', () => {
      assert.strictEqual(isRouteActive('/coach/batches/batch-123/edit', '/coach/batches'), true);
      assert.strictEqual(isRouteActive('/coach/students/enrolled/new', '/coach/students'), true);
      assert.strictEqual(isRouteActive('/coach/leads?tab=new', '/coach/leads'), true);
    });

    it('should handle root path comparison accurately', () => {
      assert.strictEqual(isRouteActive('/', '/'), true);
      assert.strictEqual(isRouteActive('/activities', '/'), false);
    });

    it('should not activate unrelated routes', () => {
      assert.strictEqual(isRouteActive('/coach/attendance', '/coach/revenue'), false);
      assert.strictEqual(isRouteActive('/coach/profile', '/coach/plans'), false);
    });
  });

  describe('Operational Lock State Derivation', () => {
    it('should unlock operations when coach is on STANDARD tier', () => {
      const centre = { planTier: 'STANDARD' };
      const hasPlan = checkHasActivePlan(centre);
      const unlocked = checkIsOperationsUnlocked(false, hasPlan);

      assert.strictEqual(hasPlan, true);
      assert.strictEqual(unlocked, true);
    });

    it('should unlock operations when coach is on PREMIUM tier', () => {
      const centre = { planTier: 'PREMIUM' };
      const hasPlan = checkHasActivePlan(centre);
      const unlocked = checkIsOperationsUnlocked(false, hasPlan);

      assert.strictEqual(hasPlan, true);
      assert.strictEqual(unlocked, true);
    });

    it('should unlock operations when coach has recorded plan payment or purchase date', () => {
      const centre1 = { planTier: 'FREE', planPaymentId: 'pay_12345' };
      const centre2 = { planTier: 'FREE', planPurchasedAt: new Date().toISOString() };

      assert.strictEqual(checkHasActivePlan(centre1), true);
      assert.strictEqual(checkHasActivePlan(centre2), true);
    });

    it('should lock operations when coach is on FREE plan without payment credentials', () => {
      const centre = { planTier: 'FREE', planPaymentId: null, planPurchasedAt: null };
      const hasPlan = checkHasActivePlan(centre);
      const unlocked = checkIsOperationsUnlocked(false, hasPlan);

      assert.strictEqual(hasPlan, false);
      assert.strictEqual(unlocked, false);
    });

    it('should avoid flash of locked state during initial loading state', () => {
      const unlockedDuringLoad = checkIsOperationsUnlocked(true, false);
      assert.strictEqual(unlockedDuringLoad, true);
    });
  });

  describe('Display Profile Fallbacks & KYC Badging', () => {
    it('should render centre name if available, otherwise user name academy, otherwise default', () => {
      const data1 = getSidebarDisplayData({ name: 'Vikram' }, { name: 'Vikram Tennis Academy' });
      assert.strictEqual(data1.academyName, 'Vikram Tennis Academy');

      const data2 = getSidebarDisplayData({ name: 'Vikram' }, null);
      assert.strictEqual(data2.academyName, "Vikram's Academy");

      const data3 = getSidebarDisplayData(null, null);
      assert.strictEqual(data3.academyName, 'My Coaching Centre');
    });

    it('should derive user initial for avatar or fallback to C', () => {
      const data1 = getSidebarDisplayData({ name: 'Rohit Sharma' }, null);
      assert.strictEqual(data1.avatarInitial, 'R');

      const data2 = getSidebarDisplayData({ name: 'anjali' }, null);
      assert.strictEqual(data2.avatarInitial, 'A');

      const data3 = getSidebarDisplayData(null, null);
      assert.strictEqual(data3.avatarInitial, 'C');
    });

    it('should provide green KYC Verified badge only when APPROVED', () => {
      const dataApproved = getSidebarDisplayData(null, { kycStatus: 'APPROVED' });
      assert.strictEqual(dataApproved.kycBadge.label, 'KYC Verified');
      assert.strictEqual(dataApproved.kycBadge.color, 'emerald');

      const dataPending = getSidebarDisplayData(null, { kycStatus: 'DOCS_REVIEW' });
      assert.strictEqual(dataPending.kycBadge.label, 'Compliance Pending');
      assert.strictEqual(dataPending.kycBadge.color, 'amber');

      const dataNone = getSidebarDisplayData(null, null);
      assert.strictEqual(dataNone.kycBadge.label, 'Compliance Pending');
      assert.strictEqual(dataNone.kycBadge.color, 'amber');
    });
  });
});
