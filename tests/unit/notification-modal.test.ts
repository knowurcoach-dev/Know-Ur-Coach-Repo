import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 48: Notification Modal Relative Time & Alert Categories Tests', () => {
  // Logic extracted directly from src/components/modals/NotificationModal.tsx
  function formatRelativeTime(dateStr?: string | Date, mockNow?: Date): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = mockNow || new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function getNotificationCategory(type: string) {
    switch (type) {
      case 'kyc':
        return { icon: 'ShieldCheck', color: 'blue' };
      case 'subscription':
        return { icon: 'CreditCard', color: 'purple' };
      case 'lead':
        return { icon: 'User', color: 'emerald' };
      case 'booking':
        return { icon: 'TennisBall', color: 'amber' };
      case 'competition':
        return { icon: 'Trophy', color: 'orange' };
      default:
        return { icon: 'Bell', color: 'blue' };
    }
  }

  function getModalSubtitle(unreadCount: number): string {
    return unreadCount > 0
      ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}`
      : 'Activity & Compliance Updates';
  }

  function determineNotificationViewState(isAuthenticated: boolean, notificationCount: number) {
    if (!isAuthenticated) return 'GUEST_PROMPT';
    if (notificationCount > 0) return 'NOTIFICATIONS_LIST';
    return 'ALL_CAUGHT_UP';
  }

  describe('Relative Time Formatting', () => {
    const fixedNow = new Date('2026-10-18T12:00:00Z');

    it('should return "Just now" for dates within the last 59 seconds', () => {
      const date = new Date('2026-10-18T11:59:30Z');
      assert.strictEqual(formatRelativeTime(date, fixedNow), 'Just now');
    });

    it('should return minutes ago for timestamps under 1 hour', () => {
      const date15m = new Date('2026-10-18T11:45:00Z');
      assert.strictEqual(formatRelativeTime(date15m, fixedNow), '15m ago');

      const date59m = new Date('2026-10-18T11:01:00Z');
      assert.strictEqual(formatRelativeTime(date59m, fixedNow), '59m ago');
    });

    it('should return hours ago for timestamps under 24 hours', () => {
      const date3h = new Date('2026-10-18T09:00:00Z');
      assert.strictEqual(formatRelativeTime(date3h, fixedNow), '3h ago');

      const date22h = new Date('2026-10-17T14:00:00Z');
      assert.strictEqual(formatRelativeTime(date22h, fixedNow), '22h ago');
    });

    it('should return "Yesterday" for dates exactly 1 day ago', () => {
      const yesterday = new Date('2026-10-17T10:00:00Z');
      assert.strictEqual(formatRelativeTime(yesterday, fixedNow), 'Yesterday');
    });

    it('should fallback to Indian locale date string for older timestamps', () => {
      const olderDate = new Date('2026-10-10T10:00:00Z');
      const formatted = formatRelativeTime(olderDate, fixedNow);
      assert.ok(formatted.includes('10'));
      assert.ok(formatted.includes('Oct'));
    });

    it('should return "Recently" when date is undefined or empty', () => {
      assert.strictEqual(formatRelativeTime(undefined), 'Recently');
      assert.strictEqual(formatRelativeTime(''), 'Recently');
    });
  });

  describe('Alert Category Icon & Color Mapping', () => {
    it('should map KYC alerts to blue ShieldCheck', () => {
      assert.deepStrictEqual(getNotificationCategory('kyc'), { icon: 'ShieldCheck', color: 'blue' });
    });

    it('should map Subscription alerts to purple CreditCard', () => {
      assert.deepStrictEqual(getNotificationCategory('subscription'), {
        icon: 'CreditCard',
        color: 'purple',
      });
    });

    it('should map Student Lead alerts to emerald User', () => {
      assert.deepStrictEqual(getNotificationCategory('lead'), { icon: 'User', color: 'emerald' });
    });

    it('should map Batch Booking alerts to amber TennisBall', () => {
      assert.deepStrictEqual(getNotificationCategory('booking'), { icon: 'TennisBall', color: 'amber' });
    });

    it('should map Competition alerts to orange Trophy', () => {
      assert.deepStrictEqual(getNotificationCategory('competition'), { icon: 'Trophy', color: 'orange' });
    });

    it('should fallback unrecognized types to blue Bell', () => {
      assert.deepStrictEqual(getNotificationCategory('system_announcement'), {
        icon: 'Bell',
        color: 'blue',
      });
    });
  });

  describe('Unread Subtitle Counter & View States', () => {
    it('should render singular or plural unread update count in subtitle', () => {
      assert.strictEqual(getModalSubtitle(1), '1 new update');
      assert.strictEqual(getModalSubtitle(4), '4 new updates');
      assert.strictEqual(getModalSubtitle(0), 'Activity & Compliance Updates');
    });

    it('should derive correct view states based on authentication and notification count', () => {
      assert.strictEqual(determineNotificationViewState(false, 0), 'GUEST_PROMPT');
      assert.strictEqual(determineNotificationViewState(true, 5), 'NOTIFICATIONS_LIST');
      assert.strictEqual(determineNotificationViewState(true, 0), 'ALL_CAUGHT_UP');
    });
  });
});
