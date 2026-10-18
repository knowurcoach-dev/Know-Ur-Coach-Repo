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
  }),
  useState: (initial: any) => [
    typeof initial === 'function' ? initial() : initial,
    () => {},
  ],
  useEffect: (fn: any) => {
    // Execute effect for logging/callbacks if needed
    try {
      fn();
    } catch {}
  },
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

import RootError from '../../src/app/error';
import GlobalError from '../../src/app/global-error';
import PublicError from '../../src/app/(public)/error';
import DashboardError from '../../src/app/(dashboard)/error';

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

describe('Phase 64: Next.js Error Boundaries Suite', () => {
  describe('RootError Component (src/app/error.tsx)', () => {
    it('should render DatabaseErrorView with retry callback and home link', () => {
      let resetCalled = false;
      const mockError = new Error('Client runtime unhandled exception');

      const el = RootError({
        error: mockError,
        reset: () => {
          resetCalled = true;
        },
      });

      assert.ok(el !== null);
      assert.ok(el.props.className.includes('min-h-[70vh]'));

      // Check inner DatabaseErrorView props
      const errorView = el.props.children;
      assert.strictEqual(errorView.props.title, 'Something went wrong');
      assert.strictEqual(errorView.props.showHomeButton, true);
      assert.strictEqual(errorView.props.error, mockError);

      // Verify onRetry invokes reset()
      errorView.props.onRetry();
      assert.strictEqual(resetCalled, true);
    });
  });

  describe('GlobalError Component (src/app/global-error.tsx)', () => {
    it('should render complete HTML shell with body and DatabaseErrorView', () => {
      let resetCalled = false;
      const mockError = new Error('Critical root layout failure');

      const el = GlobalError({
        error: mockError,
        reset: () => {
          resetCalled = true;
        },
      });

      assert.strictEqual(el.type, 'html');
      assert.strictEqual(el.props.lang, 'en');

      const body = el.props.children;
      assert.strictEqual(body.type, 'body');
      assert.ok(body.props.className.includes('bg-slate-50'));

      const errorView = body.props.children;
      assert.strictEqual(errorView.props.title, 'Something went wrong');
      assert.strictEqual(errorView.props.showHomeButton, true);

      errorView.props.onRetry();
      assert.strictEqual(resetCalled, true);
    });
  });

  describe('PublicError Component (src/app/(public)/error.tsx)', () => {
    it('should render public error boundary with directory-specific guidance', () => {
      let resetCalled = false;
      const mockError = new Error('Public catalogue fetch timeout');

      const el = PublicError({
        error: mockError,
        reset: () => {
          resetCalled = true;
        },
      });

      assert.ok(el.props.className.includes('max-w-4xl'));

      const errorView = el.props.children;
      assert.strictEqual(errorView.props.title, 'Unable to Load Directory');
      assert.ok(errorView.props.message.includes('loading academy listings right now'));

      errorView.props.onRetry();
      assert.strictEqual(resetCalled, true);
    });
  });

  describe('DashboardError Component (src/app/(dashboard)/error.tsx)', () => {
    it('should render dashboard error boundary with portal recovery messaging', () => {
      let resetCalled = false;
      const mockError = new Error('Dashboard authorization failure');

      const el = DashboardError({
        error: mockError,
        reset: () => {
          resetCalled = true;
        },
      });

      assert.ok(el.props.className.includes('max-w-4xl'));

      const errorView = el.props.children;
      assert.strictEqual(errorView.props.title, 'Unable to Load Dashboard');
      assert.ok(errorView.props.message.includes('loading your dashboard records right now'));

      errorView.props.onRetry();
      assert.strictEqual(resetCalled, true);
    });
  });
});
