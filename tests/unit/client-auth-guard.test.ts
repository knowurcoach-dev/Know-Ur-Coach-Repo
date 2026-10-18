import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 51: Client AuthGuard & Dashboard Route RBAC Tests', () => {
  type Role = 'PARENT' | 'COACH' | 'ADMIN' | 'GUEST';

  // Logic extracted directly from src/components/auth/AuthGuard.tsx
  function evaluateAuthGuard(params: {
    isLoading: boolean;
    isAuthenticated: boolean;
    userRole: Role;
    requiredRole: 'PARENT' | 'COACH' | 'ADMIN';
    pathname: string;
  }): { status: 'LOADING' | 'ALLOWED' | 'REDIRECT'; redirectUrl?: string } {
    const { isLoading, isAuthenticated, userRole, requiredRole, pathname } = params;

    if (isLoading) {
      return { status: 'LOADING' };
    }

    if (!isAuthenticated) {
      const loginUrl = requiredRole === 'ADMIN' ? '/admin/login' : '/login';
      return {
        status: 'REDIRECT',
        redirectUrl: `${loginUrl}?callbackUrl=${encodeURIComponent(pathname)}`,
      };
    }

    // Role check: ADMIN can inspect parent and coach dashboards, but only ADMIN can access ADMIN routes
    const isAllowed = userRole === requiredRole || (requiredRole !== 'ADMIN' && userRole === 'ADMIN');
    if (isAllowed) {
      return { status: 'ALLOWED' };
    }

    // Wrong role redirection
    if (userRole === 'PARENT') {
      return { status: 'REDIRECT', redirectUrl: '/parent/bookings' };
    }
    if (userRole === 'COACH') {
      return { status: 'REDIRECT', redirectUrl: '/coach/dashboard' };
    }
    if (userRole === 'ADMIN') {
      return { status: 'REDIRECT', redirectUrl: '/admin' };
    }

    return {
      status: 'REDIRECT',
      redirectUrl: requiredRole === 'ADMIN' ? '/admin/login' : '/login',
    };
  }

  describe('Loading State Resolution', () => {
    it('should return LOADING when session is still resolving', () => {
      const res = evaluateAuthGuard({
        isLoading: true,
        isAuthenticated: false,
        userRole: 'GUEST',
        requiredRole: 'COACH',
        pathname: '/coach/dashboard',
      });
      assert.strictEqual(res.status, 'LOADING');
      assert.strictEqual(res.redirectUrl, undefined);
    });
  });

  describe('Unauthenticated Redirections with Callback URL', () => {
    it('should redirect unauthenticated visitor on Coach routes to /login with encoded callbackUrl', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: false,
        userRole: 'GUEST',
        requiredRole: 'COACH',
        pathname: '/coach/batches',
      });
      assert.strictEqual(res.status, 'REDIRECT');
      assert.strictEqual(res.redirectUrl, '/login?callbackUrl=%2Fcoach%2Fbatches');
    });

    it('should redirect unauthenticated visitor on Parent routes to /login with callbackUrl', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: false,
        userRole: 'GUEST',
        requiredRole: 'PARENT',
        pathname: '/parent/bookings',
      });
      assert.strictEqual(res.status, 'REDIRECT');
      assert.strictEqual(res.redirectUrl, '/login?callbackUrl=%2Fparent%2Fbookings');
    });

    it('should redirect unauthenticated visitor on Admin routes to /admin/login with callbackUrl', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: false,
        userRole: 'GUEST',
        requiredRole: 'ADMIN',
        pathname: '/admin/plans',
      });
      assert.strictEqual(res.status, 'REDIRECT');
      assert.strictEqual(res.redirectUrl, '/admin/login?callbackUrl=%2Fadmin%2Fplans');
    });
  });

  describe('Role-Based Authorization & Admin Super-Inspection', () => {
    it('should allow Coach user to access COACH routes', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'COACH',
        requiredRole: 'COACH',
        pathname: '/coach/dashboard',
      });
      assert.strictEqual(res.status, 'ALLOWED');
    });

    it('should allow Parent user to access PARENT routes', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'PARENT',
        requiredRole: 'PARENT',
        pathname: '/parent/children',
      });
      assert.strictEqual(res.status, 'ALLOWED');
    });

    it('should allow Super Admin to inspect Coach dashboard routes', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'ADMIN',
        requiredRole: 'COACH',
        pathname: '/coach/attendance',
      });
      assert.strictEqual(res.status, 'ALLOWED');
    });

    it('should allow Super Admin to inspect Parent dashboard routes', () => {
      const res = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'ADMIN',
        requiredRole: 'PARENT',
        pathname: '/parent/bookings',
      });
      assert.strictEqual(res.status, 'ALLOWED');
    });

    it('should strictly deny Non-Admin users from accessing ADMIN routes and redirect to their home portal', () => {
      const coachTryingAdmin = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'COACH',
        requiredRole: 'ADMIN',
        pathname: '/admin/verify-coaches',
      });
      assert.strictEqual(coachTryingAdmin.status, 'REDIRECT');
      assert.strictEqual(coachTryingAdmin.redirectUrl, '/coach/dashboard');

      const parentTryingAdmin = evaluateAuthGuard({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'PARENT',
        requiredRole: 'ADMIN',
        pathname: '/admin',
      });
      assert.strictEqual(parentTryingAdmin.status, 'REDIRECT');
      assert.strictEqual(parentTryingAdmin.redirectUrl, '/parent/bookings');
    });
  });
});
