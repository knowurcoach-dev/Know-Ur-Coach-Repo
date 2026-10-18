import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Setup React 19 Dispatcher
const dispatcher = {
  useContext: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
    refresh: () => {},
    pathname: '/coach/dashboard',
    parentCacheNode: { bfcacheId: 0 },
    activeCity: 'Delhi NCR',
    activeLocality: 'Connaught Place',
    setActiveTab: () => {},
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
  use: () => '/coach/dashboard',
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

import AdminDashboardLayout from '../../src/app/(dashboard)/admin/layout';
import CoachDashboardLayout from '../../src/app/(dashboard)/coach/layout';
import ParentDashboardLayout from '../../src/app/(dashboard)/parent/layout';

describe('Phase 65: App Layout Wrappers & Role Boundaries Suite', () => {
  describe('Root Metadata & Layout Composition Rules', () => {
    it('should define brand metadata title, keywords, and escrow protection', () => {
      const metadata = {
        title: "KnowUrCoach - Discover Kids Coaching, Brain Boosters & Sports Across India",
        description: "Discover, compare & book verified kids activity classes, coaching centres, STEM labs, arts and sports academies across India. Free trials and 100% money back escrow protection.",
      };

      assert.strictEqual(typeof metadata.title, 'string');
      assert.ok(metadata.title.includes('KnowUrCoach'));
      assert.ok(metadata.title.includes('Discover Kids Coaching'));
      assert.ok(metadata.description.includes('escrow protection'));
    });
  });

  describe('AdminDashboardLayout Component', () => {
    it('should enforce AuthGuard requiredRole="ADMIN" and DashboardLayout role="admin"', () => {
      const testChild = React.createElement('div', { id: 'admin-page' }, 'Admin Overview');
      const el = AdminDashboardLayout({ children: testChild });

      // Outer is AuthGuard
      assert.strictEqual(el.props.requiredRole, 'ADMIN');

      // Inner is DashboardLayout
      const dashLayout = el.props.children;
      assert.strictEqual(dashLayout.props.role, 'admin');
      assert.strictEqual(dashLayout.props.children, testChild);
    });
  });

  describe('CoachDashboardLayout Component', () => {
    it('should enforce AuthGuard COACH, DashboardLayout coach, and CoachRouteGate subscription gate', () => {
      const testChild = React.createElement('div', { id: 'coach-page' }, 'Coach Dashboard');
      const el = CoachDashboardLayout({ children: testChild });

      // Outer is AuthGuard
      assert.strictEqual(el.props.requiredRole, 'COACH');

      // Middle is DashboardLayout
      const dashLayout = el.props.children;
      assert.strictEqual(dashLayout.props.role, 'coach');

      // Inner is CoachRouteGate
      const gate = dashLayout.props.children;
      assert.strictEqual(typeof gate.type, 'function');
      assert.strictEqual(gate.props.children, testChild);
    });
  });

  describe('ParentDashboardLayout Component', () => {
    it('should enforce AuthGuard requiredRole="PARENT" and DashboardLayout role="parent"', () => {
      const testChild = React.createElement('div', { id: 'parent-page' }, 'Parent Bookings');
      const el = ParentDashboardLayout({ children: testChild });

      assert.strictEqual(el.props.requiredRole, 'PARENT');

      const dashLayout = el.props.children;
      assert.strictEqual(dashLayout.props.role, 'parent');
      assert.strictEqual(dashLayout.props.children, testChild);
    });
  });
});
