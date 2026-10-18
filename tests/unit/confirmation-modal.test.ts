import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 52: Confirmation Modal State & Pending Lock Tests', () => {
  // Logic extracted directly from src/components/modals/ConfirmationModal.tsx
  function getModalVariantStyles(variant: 'danger' | 'warning' = 'danger') {
    if (variant === 'danger') {
      return {
        iconClass: 'bg-red-50 text-red-600 border border-red-200',
        confirmBtnClass: 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500',
      };
    }
    return {
      iconClass: 'bg-amber-50 text-amber-600 border border-amber-200',
      confirmBtnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500',
    };
  }

  function evaluateEscapeKeyHandler(
    key: string,
    isOpen: boolean,
    isPending: boolean,
    onCancelCalled: { count: number }
  ) {
    if (key === 'Escape' && isOpen && !isPending) {
      onCancelCalled.count += 1;
    }
  }

  function evaluateBackdropClickHandler(
    isBackdropTarget: boolean,
    isPending: boolean,
    onCancelCalled: { count: number }
  ) {
    if (isBackdropTarget && !isPending) {
      onCancelCalled.count += 1;
    }
  }

  function getButtonState(isPending: boolean, defaultConfirmText: string = 'Delete Permanently') {
    return {
      isCancelDisabled: isPending,
      isConfirmDisabled: isPending,
      confirmLabel: isPending ? 'Processing...' : defaultConfirmText,
      hasSpinner: isPending,
    };
  }

  describe('Modal Variant Tokens & Styling', () => {
    it('should configure red danger styles for critical actions', () => {
      const styles = getModalVariantStyles('danger');
      assert.ok(styles.iconClass.includes('text-red-600'));
      assert.ok(styles.confirmBtnClass.includes('bg-red-600'));
    });

    it('should configure amber warning styles for caution actions', () => {
      const styles = getModalVariantStyles('warning');
      assert.ok(styles.iconClass.includes('text-amber-600'));
      assert.ok(styles.confirmBtnClass.includes('bg-amber-600'));
    });
  });

  describe('Pending Lock & Dismissal Prevention', () => {
    it('should disable action buttons and show Processing spinner while isPending is true', () => {
      const pendingState = getButtonState(true, 'Confirm Action');
      assert.strictEqual(pendingState.isConfirmDisabled, true);
      assert.strictEqual(pendingState.isCancelDisabled, true);
      assert.strictEqual(pendingState.confirmLabel, 'Processing...');
      assert.strictEqual(pendingState.hasSpinner, true);
    });

    it('should enable action buttons and show original confirm text when isPending is false', () => {
      const idleState = getButtonState(false, 'Delete Batch');
      assert.strictEqual(idleState.isConfirmDisabled, false);
      assert.strictEqual(idleState.isCancelDisabled, false);
      assert.strictEqual(idleState.confirmLabel, 'Delete Batch');
      assert.strictEqual(idleState.hasSpinner, false);
    });

    it('should dismiss modal on Escape key when not pending', () => {
      const tracker = { count: 0 };
      evaluateEscapeKeyHandler('Escape', true, false, tracker);
      assert.strictEqual(tracker.count, 1);
    });

    it('should block Escape key dismissal while isPending is active', () => {
      const tracker = { count: 0 };
      evaluateEscapeKeyHandler('Escape', true, true, tracker);
      // Escape is blocked during pending operation
      assert.strictEqual(tracker.count, 0);
    });

    it('should dismiss on backdrop click when not pending, but block during pending', () => {
      const tracker = { count: 0 };
      evaluateBackdropClickHandler(true, false, tracker);
      assert.strictEqual(tracker.count, 1);

      // Blocked when pending
      evaluateBackdropClickHandler(true, true, tracker);
      assert.strictEqual(tracker.count, 1); // Remains 1, not incremented
    });
  });
});
