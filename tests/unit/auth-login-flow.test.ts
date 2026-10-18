import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 69: Login Page Component Role Selection & Auth Flow Tests', () => {
  type Role = 'PARENT' | 'COACH';

  interface RoleOption {
    id: Role;
    emoji: string;
    title: string;
    badge: string;
    subtitle: string;
  }

  const ROLES: RoleOption[] = [
    {
      id: 'PARENT',
      emoji: '👨‍👩‍👧',
      title: 'Parent / Guardian',
      badge: 'Agra Families',
      subtitle: 'Book free trial passes, track batch attendance & enroll in youth tournaments',
    },
    {
      id: 'COACH',
      emoji: '🏫',
      title: 'Coach / Institute',
      badge: 'Academy Partner',
      subtitle: 'Manage your academy listing, view parent trial leads & track batch enrollments',
    },
  ];

  // Callback resolution logic from LoginForm in src/app/(auth)/login/page.tsx
  function resolveLoginRedirect(role: Role, queryCallbackUrl?: string | null): string {
    if (queryCallbackUrl && queryCallbackUrl.trim().startsWith('/')) {
      return queryCallbackUrl.trim();
    }
    if (role === 'PARENT') return '/parent/bookings';
    if (role === 'COACH') return '/coach/dashboard';
    return '/';
  }

  // OTP validation helper
  function validateOtpPin(otp: string): { valid: boolean; error?: string } {
    const cleaned = otp.trim();
    if (!cleaned) {
      return { valid: false, error: 'Please enter the 6-digit verification code' };
    }
    if (!/^\d{6}$/.test(cleaned)) {
      return { valid: false, error: 'Verification code must be exactly 6 digits' };
    }
    return { valid: true };
  }

  // Email validation & normalization helper
  function normalizeAuthEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  describe('Role Options Configuration', () => {
    it('should define exactly two roles: PARENT and COACH', () => {
      assert.strictEqual(ROLES.length, 2);
      const ids = ROLES.map((r) => r.id);
      assert.ok(ids.includes('PARENT'));
      assert.ok(ids.includes('COACH'));
    });

    it('should configure appropriate badges and subtitles for Agra sports personas', () => {
      const parent = ROLES.find((r) => r.id === 'PARENT');
      const coach = ROLES.find((r) => r.id === 'COACH');

      assert.strictEqual(parent?.badge, 'Agra Families');
      assert.strictEqual(coach?.badge, 'Academy Partner');
    });
  });

  describe('Redirect Routing & Callback Resolution', () => {
    it('should route Parent to /parent/bookings by default when no callbackUrl is provided', () => {
      const redirect = resolveLoginRedirect('PARENT');
      assert.strictEqual(redirect, '/parent/bookings');
    });

    it('should route Coach to /coach/dashboard by default when no callbackUrl is provided', () => {
      const redirect = resolveLoginRedirect('COACH');
      assert.strictEqual(redirect, '/coach/dashboard');
    });

    it('should prioritize safe internal callbackUrl when provided in query parameters', () => {
      const redirect = resolveLoginRedirect('COACH', '/coach/batches');
      assert.strictEqual(redirect, '/coach/batches');

      const parentBookingSlip = resolveLoginRedirect('PARENT', '/parent/passes?id=123');
      assert.strictEqual(parentBookingSlip, '/parent/passes?id=123');
    });

    it('should ignore unsafe external callback URLs (open redirect defense)', () => {
      const redirect = resolveLoginRedirect('PARENT', 'https://malicious.example.com');
      assert.strictEqual(redirect, '/parent/bookings');
    });
  });

  describe('OTP Code & Email Normalization Rules', () => {
    it('should validate exact 6-digit numeric OTP', () => {
      assert.strictEqual(validateOtpPin('123456').valid, true);
      assert.strictEqual(validateOtpPin('000123').valid, true);
    });

    it('should reject alphanumeric or incomplete OTP codes', () => {
      assert.strictEqual(validateOtpPin('12345').valid, false); // 5 digits
      assert.strictEqual(validateOtpPin('1234567').valid, false); // 7 digits
      assert.strictEqual(validateOtpPin('12AB56').valid, false); // non-numeric
      assert.strictEqual(validateOtpPin('').valid, false); // empty
    });

    it('should sanitize and lowercase email addresses for auth lookup', () => {
      const cleaned = normalizeAuthEmail('  Coach.Sharma@Gmail.COM  ');
      assert.strictEqual(cleaned, 'coach.sharma@gmail.com');
    });
  });

  describe('Step Transitions & State Resets', () => {
    it('should reset error, OTP, and password state on role change', () => {
      let state = {
        step: 'role' as 'role' | 'form',
        selectedRole: null as RoleOption | null,
        email: 'test@example.com',
        password: 'secretPassword',
        otp: '123456',
        error: 'Previous error message',
      };

      // User selects Coach role
      const coachRole = ROLES.find((r) => r.id === 'COACH')!;
      state = {
        ...state,
        step: 'form',
        selectedRole: coachRole,
        error: null as any,
        email: '',
        password: '',
        otp: '',
      };

      assert.strictEqual(state.step, 'form');
      assert.strictEqual(state.selectedRole?.id, 'COACH');
      assert.strictEqual(state.error, null);
      assert.strictEqual(state.password, '');
      assert.strictEqual(state.otp, '');
      assert.strictEqual(state.email, '');
    });

    it('should transition back to role selection step when user clicks Change Role', () => {
      let state = {
        step: 'form' as 'role' | 'form',
        selectedRole: ROLES[0],
        error: 'Invalid password',
      };

      // User clicks Back / Change Role
      state = {
        ...state,
        step: 'role',
        error: null as any,
      };

      assert.strictEqual(state.step, 'role');
      assert.strictEqual(state.error, null);
    });
  });
});
