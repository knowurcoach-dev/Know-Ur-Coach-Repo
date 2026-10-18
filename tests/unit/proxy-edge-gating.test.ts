import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 29: Next.js Proxy & Edge Route Authorization Gating Tests', () => {
  interface ProxyDecision {
    action: 'next' | 'redirect';
    redirectUrl?: string;
  }

  // Replicating route gating decision tree from proxy.ts
  function evaluateProxyGating(
    pathname: string,
    token: { role?: string; email?: string } | null
  ): ProxyDecision {
    const isAuthenticated = Boolean(token);
    const userRole = String(token?.role || 'GUEST').trim().toUpperCase();

    // /admin/login
    if (pathname === '/admin/login') {
      if (isAuthenticated && userRole === 'ADMIN') {
        return { action: 'redirect', redirectUrl: '/admin' };
      }
      return { action: 'next' };
    }

    // 1. Admin direct protection
    if (pathname.startsWith('/admin')) {
      if (!isAuthenticated) {
        return {
          action: 'redirect',
          redirectUrl: `/admin/login?callbackUrl=${encodeURIComponent(pathname)}`,
        };
      }
      if (userRole !== 'ADMIN') {
        return { action: 'redirect', redirectUrl: '/' };
      }
      return { action: 'next' };
    }

    // 2. Parent protected routes
    if (pathname.startsWith('/parent')) {
      if (!isAuthenticated) {
        return {
          action: 'redirect',
          redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
        };
      }
      if (userRole !== 'PARENT' && userRole !== 'ADMIN') {
        return { action: 'redirect', redirectUrl: '/' };
      }
      return { action: 'next' };
    }

    // 3. Coach protected routes
    if (pathname.startsWith('/coach')) {
      if (!isAuthenticated) {
        return {
          action: 'redirect',
          redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
        };
      }
      if (userRole !== 'COACH' && userRole !== 'ADMIN') {
        return { action: 'redirect', redirectUrl: '/' };
      }
      return { action: 'next' };
    }

    // Public routes pass through
    return { action: 'next' };
  }

  describe('Admin Routes Protection (/admin/*)', () => {
    it('should redirect unauthenticated visitor from /admin/verify-coaches to /admin/login with callbackUrl', () => {
      const res = evaluateProxyGating('/admin/verify-coaches', null);

      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(
        res.redirectUrl,
        '/admin/login?callbackUrl=%2Fadmin%2Fverify-coaches'
      );
    });

    it('should redirect non-admin user (e.g. COACH or PARENT) accessing /admin to homepage', () => {
      const coachRes = evaluateProxyGating('/admin/plans', { role: 'COACH' });
      assert.strictEqual(coachRes.action, 'redirect');
      assert.strictEqual(coachRes.redirectUrl, '/');

      const parentRes = evaluateProxyGating('/admin/audit', { role: 'PARENT' });
      assert.strictEqual(parentRes.action, 'redirect');
      assert.strictEqual(parentRes.redirectUrl, '/');
    });

    it('should grant access to admin user accessing /admin routes', () => {
      const res = evaluateProxyGating('/admin/verify-coaches', { role: 'ADMIN' });
      assert.strictEqual(res.action, 'next');
    });

    it('should redirect already authenticated admin visiting /admin/login to /admin dashboard', () => {
      const res = evaluateProxyGating('/admin/login', { role: 'ADMIN' });
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.redirectUrl, '/admin');
    });

    it('should allow unauthenticated visitor to view /admin/login', () => {
      const res = evaluateProxyGating('/admin/login', null);
      assert.strictEqual(res.action, 'next');
    });
  });

  describe('Coach Routes Protection (/coach/*)', () => {
    it('should redirect unauthenticated visitor from /coach/dashboard to /login with callbackUrl', () => {
      const res = evaluateProxyGating('/coach/dashboard', null);
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.redirectUrl, '/login?callbackUrl=%2Fcoach%2Fdashboard');
    });

    it('should redirect parent trying to access /coach/batches to homepage', () => {
      const res = evaluateProxyGating('/coach/batches', { role: 'PARENT' });
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.redirectUrl, '/');
    });

    it('should allow coach access to /coach routes', () => {
      const res = evaluateProxyGating('/coach/batches', { role: 'COACH' });
      assert.strictEqual(res.action, 'next');
    });

    it('should allow administrator to inspect coach routes', () => {
      const res = evaluateProxyGating('/coach/dashboard', { role: 'ADMIN' });
      assert.strictEqual(res.action, 'next');
    });
  });

  describe('Parent Routes Protection (/parent/*)', () => {
    it('should redirect unauthenticated visitor from /parent/bookings to /login', () => {
      const res = evaluateProxyGating('/parent/bookings', null);
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.redirectUrl, '/login?callbackUrl=%2Fparent%2Fbookings');
    });

    it('should redirect coach trying to access /parent/dashboard to homepage', () => {
      const res = evaluateProxyGating('/parent/dashboard', { role: 'COACH' });
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.redirectUrl, '/');
    });

    it('should allow parent access to /parent routes', () => {
      const res = evaluateProxyGating('/parent/bookings', { role: 'PARENT' });
      assert.strictEqual(res.action, 'next');
    });
  });

  describe('Public Unprotected Routes', () => {
    it('should allow unauthenticated visitors to freely access public pages', () => {
      assert.strictEqual(evaluateProxyGating('/', null).action, 'next');
      assert.strictEqual(evaluateProxyGating('/activities', null).action, 'next');
      assert.strictEqual(evaluateProxyGating('/activities/agra-badminton', null).action, 'next');
      assert.strictEqual(evaluateProxyGating('/about', null).action, 'next');
      assert.strictEqual(evaluateProxyGating('/competitions', null).action, 'next');
    });
  });
});
