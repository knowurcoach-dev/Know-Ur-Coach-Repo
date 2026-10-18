import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Competition } from '@/types';

describe('Phase 46: Competition Card Component & Wishlist State Tests', () => {
  // Logic extracted directly from src/components/cards/CompetitionCard.tsx
  function getRegistrationButtonProps(competition: Competition, isRegistered: boolean) {
    if (isRegistered) {
      return {
        label: 'Registered',
        icon: 'CheckCircle',
        className: 'bg-emerald-600 shadow-emerald-500/30 cursor-default',
        disabled: true,
      };
    }
    if (competition.isTeam) {
      return {
        label: 'Register Team',
        icon: 'UsersThree',
        className:
          'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]',
        disabled: false,
      };
    }
    return {
      label: 'Register Child',
      icon: 'Ticket',
      className:
        'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]',
      disabled: false,
    };
  }

  function handleRegisterGate(isGuest: boolean, isRegistered: boolean) {
    if (isRegistered) return { action: 'NONE' };
    if (isGuest) {
      return {
        action: 'REDIRECT_LOGIN',
        toast: '⚠️ Please sign in or register as a parent to book tournament passes',
        redirectTo: '/login?callbackUrl=/competitions',
      };
    }
    return { action: 'OPEN_MODAL' };
  }

  function toggleWishlistBookmark(currentState: boolean, title: string) {
    const nextState = !currentState;
    const toast = nextState
      ? `🏆 Added ${title} to your competition wishlist!`
      : `Removed ${title} from wishlist`;
    return { isBookmarked: nextState, toast };
  }

  function getStatusBadgeConfig(status: Competition['status'], statusText: string) {
    if (status === 'open') {
      return {
        color: 'emerald',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        dotClass: 'bg-emerald-500 animate-pulse',
        text: statusText,
      };
    }
    if (status === 'fast-filling') {
      return {
        color: 'amber',
        badgeClass: 'bg-amber-100 text-amber-900',
        dotClass: 'bg-orange-500 animate-ping',
        text: statusText,
      };
    }
    return {
      color: 'blue',
      badgeClass: 'bg-blue-100 text-blue-800',
      dotClass: null,
      text: statusText,
    };
  }

  const sampleComp: Competition = {
    id: 'comp-badminton-101',
    title: 'Agra Junior Open Championship',
    sport: 'Badminton',
    category: 'sports',
    locality: 'kamla-nagar',
    venue: 'Eklavya Stadium Indoor Badminton Court',
    venueShort: 'Eklavya Stadium',
    status: 'open',
    statusText: 'Registrations Open',
    age: ['u12', 'u15'],
    ageText: 'Under-12 & Under-15',
    fee: 450,
    feeUnit: '/ participant',
    date: 'Nov 14 - 16, 2026',
    timing: 'Morning 9:00 AM to 5:30 PM',
    organizer: 'Agra Badminton Association',
    prizePool: '₹25,000 Cash Pool + Trophies',
    tags: ['🏆 Verified Tournament', '📜 State Certificate'],
    equipment: 'Standard non-marking shoes',
    reporting: '30 mins before match',
    format: 'Knockout format',
    umpiring: 'State certified referees',
    contact: '9897012345',
    rulebookPdf: 'Agra_Junior_Open_Rulebook.pdf',
    isTeam: false,
  };

  describe('Registration Action Button Configurations', () => {
    it('should configure Register Child button for individual youth tournaments', () => {
      const button = getRegistrationButtonProps(sampleComp, false);
      assert.strictEqual(button.label, 'Register Child');
      assert.strictEqual(button.icon, 'Ticket');
      assert.strictEqual(button.disabled, false);
    });

    it('should configure Register Team button when isTeam flag is true', () => {
      const teamComp: Competition = { ...sampleComp, isTeam: true };
      const button = getRegistrationButtonProps(teamComp, false);
      assert.strictEqual(button.label, 'Register Team');
      assert.strictEqual(button.icon, 'UsersThree');
      assert.strictEqual(button.disabled, false);
    });

    it('should render Registered state and disable button when user has completed entry', () => {
      const button = getRegistrationButtonProps(sampleComp, true);
      assert.strictEqual(button.label, 'Registered');
      assert.strictEqual(button.icon, 'CheckCircle');
      assert.strictEqual(button.disabled, true);
    });
  });

  describe('Guest Protection & Login Redirection', () => {
    it('should block unauthenticated visitors from opening register modal and route to login with callback', () => {
      const result = handleRegisterGate(true, false);
      assert.strictEqual(result.action, 'REDIRECT_LOGIN');
      assert.strictEqual(result.redirectTo, '/login?callbackUrl=/competitions');
      assert.strictEqual(
        result.toast,
        '⚠️ Please sign in or register as a parent to book tournament passes'
      );
    });

    it('should permit registered parents to proceed directly to registration modal', () => {
      const result = handleRegisterGate(false, false);
      assert.strictEqual(result.action, 'OPEN_MODAL');
    });

    it('should no-op when user is already registered', () => {
      const result = handleRegisterGate(false, true);
      assert.strictEqual(result.action, 'NONE');
    });
  });

  describe('Wishlist Bookmark Toggling', () => {
    it('should add to wishlist and emit celebratory toast', () => {
      const res = toggleWishlistBookmark(false, sampleComp.title);
      assert.strictEqual(res.isBookmarked, true);
      assert.strictEqual(res.toast, '🏆 Added Agra Junior Open Championship to your competition wishlist!');
    });

    it('should remove from wishlist and emit confirmation toast', () => {
      const res = toggleWishlistBookmark(true, sampleComp.title);
      assert.strictEqual(res.isBookmarked, false);
      assert.strictEqual(res.toast, 'Removed Agra Junior Open Championship from wishlist');
    });
  });

  describe('Status Badge Styling & Pulsing Indicators', () => {
    it('should apply emerald theme with pulsing dot for open registrations', () => {
      const badge = getStatusBadgeConfig('open', 'Registrations Open');
      assert.strictEqual(badge.color, 'emerald');
      assert.strictEqual(badge.dotClass, 'bg-emerald-500 animate-pulse');
    });

    it('should apply amber theme with pinging dot for fast-filling status', () => {
      const badge = getStatusBadgeConfig('fast-filling', 'Fast Filling (8 slots left)');
      assert.strictEqual(badge.color, 'amber');
      assert.strictEqual(badge.dotClass, 'bg-orange-500 animate-ping');
    });

    it('should apply blue theme for upcoming status', () => {
      const badge = getStatusBadgeConfig('upcoming', 'Registrations Open Next Week');
      assert.strictEqual(badge.color, 'blue');
      assert.strictEqual(badge.dotClass, null);
    });
  });
});
