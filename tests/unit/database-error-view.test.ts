import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Lightweight React hooks mock for Node.js test environment
(React as any).useState = (initial: any) => [
  typeof initial === 'function' ? initial() : initial,
  () => {},
];
(React as any).useEffect = () => {};
(React as any).useRef = (init: any) => ({ current: init });
(React as any).useCallback = (fn: any) => fn;
(React as any).useMemo = (fn: any) => fn();

import { DatabaseErrorView } from '../../src/components/ui/DatabaseErrorView';

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

describe('Phase 59: DatabaseErrorView Component Suite', () => {
  describe('Sanitization & Consumer-Friendly Error Masking', () => {
    it('should sanitize technical database error titles into consumer-friendly heading', () => {
      const technicalTitles = [
        'PrismaClientKnownRequestError: Can not reach database server',
        'Postgres connection terminated unexpectedly',
        'SQL syntax error at line 4',
        'Internal Error: failed to fetch remote replica',
        'zero-mock connection timed out',
      ];

      for (const rawTitle of technicalTitles) {
        const el = DatabaseErrorView({ title: rawTitle });
        const h2El = findInChildren(el, (n) => n?.type === 'h2');
        assert.ok(h2El, 'h2 element should exist');
        assert.strictEqual(h2El.props.children, 'Unable to Load Content');
      }
    });

    it('should sanitize technical messages into friendly network guidance', () => {
      const el = DatabaseErrorView({
        title: 'Safe Custom Title',
        message: 'prisma.academy.findMany() failed: postgres port 5432 unreachable',
      });
      const h2El = findInChildren(el, (n) => n?.type === 'h2');
      assert.strictEqual(h2El.props.children, 'Safe Custom Title');

      const pEl = findInChildren(el, (n) => n?.type === 'p');
      assert.ok(pEl, 'p element should exist');
      assert.ok(
        pEl.props.children.includes('Please check your internet connection or try again in a few moments.')
      );
    });

    it('should preserve non-technical consumer messages verbatim', () => {
      const friendlyMessage = 'No available slots found for the selected weekend batch.';
      const el = DatabaseErrorView({
        title: 'No Slots Available',
        message: friendlyMessage,
      });
      const pEl = findInChildren(el, (n) => n?.type === 'p');
      assert.strictEqual(pEl.props.children, friendlyMessage);
    });
  });

  describe('Compact Banner Mode', () => {
    it('should render amber compact alert banner with retry button', () => {
      let retryCalled = false;
      const el = DatabaseErrorView({
        compact: true,
        title: 'Reviews Offline',
        message: 'Could not load verified parent reviews right now.',
        onRetry: () => {
          retryCalled = true;
        },
      });

      assert.ok(el.props.className.includes('bg-amber-50/80'));
      assert.ok(el.props.className.includes('border-amber-200/80'));

      const h4El = findInChildren(el, (n) => n?.type === 'h4');
      assert.strictEqual(h4El.props.children, 'Reviews Offline');

      const retryBtn = findInChildren(el, (n) => n?.type === 'button');
      assert.ok(retryBtn, 'Retry button should be rendered');
      assert.strictEqual(retryBtn.props.type, 'button');

      // Trigger onClick
      retryBtn.props.onClick();
      assert.strictEqual(retryCalled, true);
    });

    it('should omit retry button in compact mode when onRetry is not provided', () => {
      const el = DatabaseErrorView({
        compact: true,
        title: 'Notice',
        message: 'Something went wrong',
      });
      const retryBtn = findInChildren(el, (n) => n?.type === 'button');
      assert.strictEqual(retryBtn, null);
    });
  });

  describe('Standard Full-Card Mode & Actions', () => {
    it('should render Return to Home button when showHomeButton is true (default)', () => {
      const el = DatabaseErrorView({ showHomeButton: true });
      const homeLink = findInChildren(el, (n) => n?.props?.href === '/');
      assert.ok(homeLink, 'Home Link should be present');
      assert.strictEqual(homeLink.props.href, '/');
    });

    it('should hide Return to Home button when showHomeButton is false', () => {
      const el = DatabaseErrorView({ showHomeButton: false });
      const homeLink = findInChildren(el, (n) => n?.props?.href === '/');
      assert.strictEqual(homeLink, null);
    });

    it('should render diagnostic details section when technical error or rawError is present', () => {
      const rawTechnicalError = 'Prisma Error P2002: Unique constraint failed on field: email';
      const el = DatabaseErrorView({
        title: 'Database Sync Failure',
        error: rawTechnicalError,
      });

      const toggleBtn = findInChildren(
        el,
        (n) => n?.type === 'button' && (n?.props?.children === 'Show Technical Details' || n?.props?.children === 'Hide Technical Details')
      );
      assert.ok(toggleBtn, 'Diagnostic toggle button should be rendered');
      assert.strictEqual(toggleBtn.props.children, 'Show Technical Details');
    });
  });
});
