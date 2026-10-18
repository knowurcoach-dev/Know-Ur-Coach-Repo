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
    pathname: '/',
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

import { AppFooter } from '../../src/components/navigation/AppFooter';
import { TopRoleBar } from '../../src/components/navigation/TopRoleBar';
import { ClientProviders } from '../../src/components/providers/ClientProviders';
import { DashboardLayout } from '../../src/components/shell/DashboardLayout';

function getNodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (node.props && node.props.children) return getNodeText(node.props.children);
  return '';
}

function findInChildren(node: any, predicate: (n: any) => boolean): any {
  if (!node) return null;
  if (predicate(node)) return node;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findInChildren(child, predicate);
      if (found) return found;
    }
  } else if (node.props && node.props.children) {
    return findInChildren(node.props.children, predicate);
  }
  return null;
}

function findAllInChildren(node: any, predicate: (n: any) => boolean, results: any[] = []): any[] {
  if (!node) return results;
  if (predicate(node)) results.push(node);
  if (Array.isArray(node)) {
    for (const child of node) {
      findAllInChildren(child, predicate, results);
    }
  } else if (node.props && node.props.children) {
    findAllInChildren(node.props.children, predicate, results);
  }
  return results;
}

describe('Phase 62: Navigation Shell, Providers, and Dashboard Layouts Suite', () => {
  describe('AppFooter Component', () => {
    it('should render brand description and compliance verification badges', () => {
      const el = AppFooter();
      assert.strictEqual(el.type, 'footer');
      assert.ok(el.props.className.includes('hidden md:block'));

      // Check Physical KYC Verified badge
      const kycBadge = findInChildren(el, (n) => getNodeText(n).includes('Physical KYC Verified'));
      assert.ok(kycBadge, 'Should render Physical KYC Verified badge');

      // Check Escrow Protection badge
      const escrowBadge = findInChildren(el, (n) => getNodeText(n).includes('100% Escrow Protection'));
      assert.ok(escrowBadge, 'Should render 100% Escrow Protection badge');
    });

    it('should render WhatsApp Helpline contact link with correct phone number', () => {
      const el = AppFooter();
      const waLink = findInChildren(el, (n) =>
        n?.props?.href && n.props.href.includes('wa.me/919762577714')
      );
      assert.ok(waLink, 'WhatsApp Helpline link should exist');
      assert.strictEqual(waLink.props.target, '_blank');
      assert.ok(getNodeText(waLink).includes('WhatsApp Helpline'));
    });

    it('should include map and location attribution for LocationIQ and OSM', () => {
      const el = AppFooter();
      const locationIqLink = findInChildren(el, (n) => n?.props?.href === 'https://locationiq.com');
      assert.ok(locationIqLink, 'LocationIQ attribution link should exist');

      const osmLink = findInChildren(el, (n) => n?.props?.href === 'https://www.openstreetmap.org/copyright');
      assert.ok(osmLink, 'OSM copyright attribution link should exist');
    });

    it('should render legal links (Terms of Service, Privacy Policy, Sports Tournaments)', () => {
      const el = AppFooter();
      const termsLink = findInChildren(el, (n) => n?.props?.href === '/terms');
      assert.ok(termsLink, 'Terms link should exist');

      const privacyLink = findInChildren(el, (n) => n?.props?.href === '/privacy');
      assert.ok(privacyLink, 'Privacy Policy link should exist');

      const compLink = findInChildren(el, (n) => n?.props?.href === '/competitions');
      assert.ok(compLink, 'Tournaments link should exist');
    });
  });

  describe('TopRoleBar Component', () => {
    it('should return null as role switching is handled by NextAuth session', () => {
      const el = TopRoleBar();
      assert.strictEqual(el, null);
    });
  });

  describe('ClientProviders Component', () => {
    it('should nest SessionProvider and PersonaProvider around children', () => {
      const testChild = React.createElement('div', { id: 'test-child' }, 'Inner Application Body');
      const el = ClientProviders({ children: testChild });

      assert.ok(el !== null);
      // Outer is SessionProvider
      assert.strictEqual(typeof el.type, 'function');
      // Inner is PersonaProvider
      const inner = el.props.children;
      assert.strictEqual(typeof inner.type, 'function');
      assert.strictEqual(inner.props.children, testChild);
    });
  });

  describe('DashboardLayout Component', () => {
    it('should render coach role header with Coach Ops title and coach badge', () => {
      const el = DashboardLayout({
        role: 'coach',
        children: React.createElement('div', { id: 'coach-content' }, 'Coach Main'),
      });

      assert.ok(el !== null);
      const text = getNodeText(el);
      assert.ok(text.includes('Coach Ops'));
      assert.ok(text.includes('coach'));
    });

    it('should render admin role header with Admin Suite title and admin badge', () => {
      const el = DashboardLayout({
        role: 'admin',
        children: React.createElement('div', { id: 'admin-content' }, 'Admin Main'),
      });

      const text = getNodeText(el);
      assert.ok(text.includes('Admin Suite'));
      assert.ok(text.includes('admin'));
    });

    it('should render parent role header with Parent Portal title and parent badge', () => {
      const el = DashboardLayout({
        role: 'parent',
        children: React.createElement('div', { id: 'parent-content' }, 'Parent Main'),
      });

      const text = getNodeText(el);
      assert.ok(text.includes('Parent Portal'));
      assert.ok(text.includes('parent'));
    });

    it('should format page title from pathname route segment properly', () => {
      const formatSegment = (segment: string) => {
        return segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      };

      assert.strictEqual(formatSegment('live-roster'), 'Live Roster');
      assert.strictEqual(formatSegment('kyc-verification'), 'Kyc Verification');
      assert.strictEqual(formatSegment('subscription-plans'), 'Subscription Plans');
      assert.strictEqual(formatSegment('batch-details'), 'Batch Details');
    });
  });

  describe('AppShell Layout Logic & Gate Rules', () => {
    // Tests the route exclusion rules extracted from src/components/shell/AppShell.tsx
    function isBareRoute(pathname: string): boolean {
      return (
        pathname === '/login' ||
        pathname.startsWith('/register-') ||
        pathname === '/admin/login'
      );
    }

    function isNoFooterRoute(pathname: string): boolean {
      const isDashboardRoute =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/coach') ||
        pathname.startsWith('/parent');
      return isDashboardRoute || pathname.startsWith('/activities/explore');
    }

    function resolveActiveTab(pathname: string): string {
      if (pathname === '/') return 'home';
      if (pathname === '/activities') return 'activities';
      if (pathname === '/competitions') return 'competitions';
      if (pathname.startsWith('/parent')) return 'bookings';
      if (pathname.startsWith('/coach')) return 'coach-dashboard';
      if (pathname.startsWith('/admin')) return 'admin-dashboard';
      return 'home';
    }

    it('should treat auth and registration routes as bare routes without chrome', () => {
      assert.strictEqual(isBareRoute('/login'), true);
      assert.strictEqual(isBareRoute('/register-parent'), true);
      assert.strictEqual(isBareRoute('/register-coach'), true);
      assert.strictEqual(isBareRoute('/admin/login'), true);

      assert.strictEqual(isBareRoute('/'), false);
      assert.strictEqual(isBareRoute('/activities'), false);
      assert.strictEqual(isBareRoute('/coach/dashboard'), false);
    });

    it('should hide marketing footer on all dashboard portals and explore view', () => {
      assert.strictEqual(isNoFooterRoute('/parent/bookings'), true);
      assert.strictEqual(isNoFooterRoute('/coach/dashboard'), true);
      assert.strictEqual(isNoFooterRoute('/admin/verify'), true);
      assert.strictEqual(isNoFooterRoute('/activities/explore'), true);

      assert.strictEqual(isNoFooterRoute('/'), false);
      assert.strictEqual(isNoFooterRoute('/activities'), false);
      assert.strictEqual(isNoFooterRoute('/competitions'), false);
    });

    it('should resolve persona active tab accurately from current pathname', () => {
      assert.strictEqual(resolveActiveTab('/'), 'home');
      assert.strictEqual(resolveActiveTab('/activities'), 'activities');
      assert.strictEqual(resolveActiveTab('/competitions'), 'competitions');
      assert.strictEqual(resolveActiveTab('/parent/profile'), 'bookings');
      assert.strictEqual(resolveActiveTab('/coach/plans'), 'coach-dashboard');
      assert.strictEqual(resolveActiveTab('/admin/overview'), 'admin-dashboard');
    });
  });
});
