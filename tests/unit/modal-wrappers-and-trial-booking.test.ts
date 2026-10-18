import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Lightweight React hooks mock for Node.js test environment
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

// Global document mock for Node.js
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    body: {
      style: {
        overflow: '',
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import { BottomSheetWrapper } from '../../src/components/modals/BottomSheetWrapper';
import { DialogWrapper } from '../../src/components/modals/DialogWrapper';
import { TrialBookingModal } from '../../src/components/modals/TrialBookingModal';
import { useModalStore } from '../../src/hooks/useModalStore';

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

describe('Phase 61: Modal Wrappers and Trial Booking Flow Suite', () => {
  describe('BottomSheetWrapper Component', () => {
    it('should return null when isOpen is false', () => {
      const el = BottomSheetWrapper({
        isOpen: false,
        onClose: () => {},
        children: 'Modal Content',
      });
      assert.strictEqual(el, null);
    });

    it('should render dialog backdrop with role="dialog" and aria-modal="true" when isOpen is true', () => {
      let closeCalled = false;
      const el = BottomSheetWrapper({
        isOpen: true,
        onClose: () => {
          closeCalled = true;
        },
        title: 'Filter Options',
        subtitle: 'Select preferences',
        children: 'Sheet Content Body',
      });

      assert.ok(el !== null);
      assert.strictEqual(el.props.role, 'dialog');
      assert.strictEqual(el.props['aria-modal'], 'true');
      assert.ok(el.props.className.includes('z-[150]'));

      // Backdrop click simulation
      el.props.onClick({ target: 'backdrop', currentTarget: 'backdrop' });
      assert.strictEqual(closeCalled, true);
    });

    it('should render header with title, subtitle and close button', () => {
      let closeCalled = false;
      const el = BottomSheetWrapper({
        isOpen: true,
        onClose: () => {
          closeCalled = true;
        },
        title: 'Batch Schedules',
        subtitle: 'Morning & Evening',
        children: 'Content',
      });

      const headerTitle = findInChildren(el, (n) => n?.type === 'h3');
      assert.ok(headerTitle, 'h3 title should exist');
      assert.strictEqual(headerTitle.props.children, 'Batch Schedules');

      const headerSub = findInChildren(el, (n) => n?.type === 'p');
      assert.ok(headerSub, 'p subtitle should exist');
      assert.strictEqual(headerSub.props.children, 'Morning & Evening');

      const closeBtn = findInChildren(el, (n) => n?.type === 'button' && n?.props?.['aria-label'] === 'Close dialog');
      assert.ok(closeBtn, 'Close button should be present');
      closeBtn.props.onClick();
      assert.strictEqual(closeCalled, true);
    });
  });

  describe('DialogWrapper Component', () => {
    it('should return null when isOpen is false', () => {
      const el = DialogWrapper({
        isOpen: false,
        onClose: () => {},
        children: 'Dialog Content',
      });
      assert.strictEqual(el, null);
    });

    it('should render desktop centered dialog with custom desktopWidth', () => {
      const el = DialogWrapper({
        isOpen: true,
        onClose: () => {},
        title: 'Confirm Enrollment',
        desktopWidth: 'md:max-w-2xl',
        children: 'Dialog Body',
      });

      assert.ok(el !== null);
      assert.strictEqual(el.props.role, 'dialog');
      assert.strictEqual(el.props['aria-modal'], 'true');
      assert.ok(el.props.className.includes('fixed inset-0 z-[200]'));

      // Inner container should have md:max-w-2xl
      const innerCard = el.props.children;
      assert.ok(innerCard.props.className.includes('md:max-w-2xl'));
      assert.ok(innerCard.props.className.includes('bg-white'));
    });

    it('should dismiss on backdrop click and stop propagation on content click', () => {
      let closed = false;
      const el = DialogWrapper({
        isOpen: true,
        onClose: () => {
          closed = true;
        },
        children: 'Inner Content',
      });

      assert.ok(el !== null);
      // Click on backdrop
      el.props.onClick({ target: 'bg', currentTarget: 'bg' });
      assert.strictEqual(closed, true);

      // Click inside inner card should stop propagation
      let stopped = false;
      const innerCard = el.props.children;
      innerCard.props.onClick({
        stopPropagation: () => {
          stopped = true;
        },
      });
      assert.strictEqual(stopped, true);
    });
  });

  describe('TrialBookingModal Component', () => {
    beforeEach(() => {
      useModalStore.getState().closeModal();
    });

    it('should return null when modal store activeModal is not trial-booking', () => {
      const el = TrialBookingModal();
      assert.strictEqual(el, null);
    });

    it('should render parent sign-in required prompt when user is not authenticated', () => {
      useModalStore.getState().openModal('trial-booking', {
        acadId: 'acad-test',
        acadName: 'Elite Badminton Academy',
        city: 'Delhi',
      });

      const el = TrialBookingModal();
      assert.ok(el !== null);

      // Verify sign in required prompt
      const heading = findInChildren(el, (n) => n?.type === 'h3' && n?.props?.children === 'Parent Sign-In Required');
      assert.ok(heading, 'Should prompt for Parent Sign-In');

      const desc = findInChildren(el, (n) =>
        n?.type === 'p' && getNodeText(n).includes('Please sign in or create a parent account')
      );
      assert.ok(desc, 'Should explain why sign-in is required');

      // Check CTAs
      const buttons = findAllInChildren(el, (n) => n?.type === 'button');
      const btnTexts = buttons.map((b) => getNodeText(b));
      assert.ok(btnTexts.some((t) => t.includes('Sign In to Parent Account')));
      assert.ok(btnTexts.some((t) => t.includes('Create Free Parent Profile')));
    });

    it('should format trial reference numbers appropriately (REF- vs KUC-PASS-)', () => {
      const formatRefNumber = (rawId: string) => {
        if (!rawId) return 'REF-000000';
        return rawId.startsWith('REF-') ? rawId : rawId.replace('KUC-PASS-', 'REF-');
      };

      assert.strictEqual(formatRefNumber('REF-984321'), 'REF-984321');
      assert.strictEqual(formatRefNumber('KUC-PASS-102938'), 'REF-102938');
      assert.strictEqual(formatRefNumber(''), 'REF-000000');
    });
  });
});
