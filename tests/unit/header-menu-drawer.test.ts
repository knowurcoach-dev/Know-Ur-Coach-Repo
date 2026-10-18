import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 55: Header Menu Drawer Role Derivation & Modal Mechanics Tests', () => {
  // Logic extracted directly from src/components/navigation/HeaderMenuDrawer.tsx
  function deriveDrawerRoles(props: {
    isAuthenticated?: boolean;
    isCoach?: boolean;
    isAdmin?: boolean;
    isParent?: boolean;
    isGuest?: boolean;
    user?: { role?: string | null } | null;
  }) {
    const { isAuthenticated = false, isCoach = false, isAdmin = false, isParent = false, user = null } = props;

    const isActualCoach = Boolean(isCoach || user?.role === 'COACH');
    const isActualAdmin = Boolean(isAdmin || user?.role === 'ADMIN');
    const isActualParent = Boolean(
      !isActualCoach && !isActualAdmin && (isParent || user?.role === 'PARENT' || isAuthenticated)
    );
    const isActualGuest = !isAuthenticated;

    return {
      isActualCoach,
      isActualAdmin,
      isActualParent,
      isActualGuest,
    };
  }

  function formatDrawerCityLabel(activeLocality?: string, activeCity: string = 'Agra'): string {
    if (activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase()) {
      return `${activeLocality}, ${activeCity}`;
    }
    return activeCity;
  }

  function handleBodyScrollLock(isOpen: boolean, mockBody: { style: { overflow: string } }) {
    if (isOpen) {
      mockBody.style.overflow = 'hidden';
    } else {
      mockBody.style.overflow = '';
    }
  }

  function evaluateDrawerEscapeKey(key: string, isOpen: boolean, onClose: () => void) {
    if (key === 'Escape' && isOpen) {
      onClose();
    }
  }

  describe('Strict Mutual Role Resolution', () => {
    it('should resolve Coach role when user.role is COACH and suppress generic parent state', () => {
      const roles = deriveDrawerRoles({
        isAuthenticated: true,
        user: { role: 'COACH' },
      });
      assert.strictEqual(roles.isActualCoach, true);
      assert.strictEqual(roles.isActualAdmin, false);
      assert.strictEqual(roles.isActualParent, false);
      assert.strictEqual(roles.isActualGuest, false);
    });

    it('should resolve Admin role when user.role is ADMIN and suppress generic parent state', () => {
      const roles = deriveDrawerRoles({
        isAuthenticated: true,
        user: { role: 'ADMIN' },
      });
      assert.strictEqual(roles.isActualAdmin, true);
      assert.strictEqual(roles.isActualCoach, false);
      assert.strictEqual(roles.isActualParent, false);
      assert.strictEqual(roles.isActualGuest, false);
    });

    it('should resolve Parent role when authenticated member is neither coach nor admin', () => {
      const roles = deriveDrawerRoles({
        isAuthenticated: true,
        user: { role: 'PARENT' },
      });
      assert.strictEqual(roles.isActualParent, true);
      assert.strictEqual(roles.isActualCoach, false);
      assert.strictEqual(roles.isActualAdmin, false);
      assert.strictEqual(roles.isActualGuest, false);
    });

    it('should resolve Guest role when unauthenticated', () => {
      const roles = deriveDrawerRoles({
        isAuthenticated: false,
        user: null,
      });
      assert.strictEqual(roles.isActualGuest, true);
      assert.strictEqual(roles.isActualParent, false);
      assert.strictEqual(roles.isActualCoach, false);
      assert.strictEqual(roles.isActualAdmin, false);
    });
  });

  describe('City Label Formatting', () => {
    it('should format single city when locality matches city', () => {
      assert.strictEqual(formatDrawerCityLabel('Agra', 'Agra'), 'Agra');
      assert.strictEqual(formatDrawerCityLabel('agra', 'Agra'), 'Agra');
    });

    it('should format Locality, City when distinct locality is active', () => {
      assert.strictEqual(formatDrawerCityLabel('Dayalbagh', 'Agra'), 'Dayalbagh, Agra');
    });

    it('should fallback to activeCity when locality is empty or undefined', () => {
      assert.strictEqual(formatDrawerCityLabel(undefined, 'Agra'), 'Agra');
      assert.strictEqual(formatDrawerCityLabel('', 'Agra'), 'Agra');
    });
  });

  describe('Scroll Lock & Escape Key Dismissal', () => {
    it('should set body overflow to hidden when drawer opens, and reset when closed', () => {
      const mockBody = { style: { overflow: '' } };

      handleBodyScrollLock(true, mockBody);
      assert.strictEqual(mockBody.style.overflow, 'hidden');

      handleBodyScrollLock(false, mockBody);
      assert.strictEqual(mockBody.style.overflow, '');
    });

    it('should invoke onClose callback on Escape key when drawer is open', () => {
      let closeCalled = false;
      evaluateDrawerEscapeKey('Escape', true, () => {
        closeCalled = true;
      });
      assert.strictEqual(closeCalled, true);
    });

    it('should not invoke onClose when drawer is already closed', () => {
      let closeCalled = false;
      evaluateDrawerEscapeKey('Escape', false, () => {
        closeCalled = true;
      });
      assert.strictEqual(closeCalled, false);
    });
  });
});
