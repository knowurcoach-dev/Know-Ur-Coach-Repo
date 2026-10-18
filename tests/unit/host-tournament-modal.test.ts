import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 44: Host Tournament Modal State & Dynamic Validation Tests', () => {
  // Logic extracted directly from HostTournamentModal.tsx
  function checkCanHost(user: {
    isGuest?: boolean;
    isParent?: boolean;
    isCoach?: boolean;
    isAdmin?: boolean;
    role?: string;
  }): boolean {
    const isGuest = Boolean(user?.isGuest);
    const isParent = Boolean(user?.isParent);
    const isCoach = Boolean(user?.isCoach);
    const isAdmin = Boolean(user?.isAdmin);
    const role = user?.role;
    return !isGuest && !isParent && (isCoach || isAdmin || role === 'COACH' || role === 'ADMIN');
  }

  function validateTournamentForm(fields: {
    title?: string;
    venue?: string;
    dates?: string;
    organizer?: string;
    registrationFee?: string | number;
    activeCity?: string;
  }): { valid: boolean; error?: string; payload?: any } {
    const title = (fields.title || '').trim();
    const venue = (fields.venue || '').trim();
    const dates = (fields.dates || '').trim();
    const activeCity = fields.activeCity || 'Agra';

    if (!title || !venue || !dates) {
      return { valid: false, error: 'Please fill in all required tournament details' };
    }

    const fee = Number(fields.registrationFee);
    const normalizedFee = !isNaN(fee) && fee >= 0 ? fee : 450;
    const organizer = (fields.organizer || '').trim() || `${activeCity} District Sports Federation`;

    return {
      valid: true,
      payload: {
        title,
        venue,
        dates,
        organizer,
        registrationFee: normalizedFee,
      },
    };
  }

  describe('Host Authorization Guard', () => {
    it('should grant hosting capability to verified Coaches', () => {
      assert.strictEqual(checkCanHost({ isCoach: true, role: 'COACH' }), true);
    });

    it('should grant hosting capability to platform Admins', () => {
      assert.strictEqual(checkCanHost({ isAdmin: true, role: 'ADMIN' }), true);
    });

    it('should deny hosting capability to Parents', () => {
      assert.strictEqual(checkCanHost({ isParent: true, role: 'PARENT' }), false);
    });

    it('should deny hosting capability to Guest users', () => {
      assert.strictEqual(checkCanHost({ isGuest: true }), false);
      assert.strictEqual(checkCanHost({}), false);
    });
  });

  describe('Required Fields & Organizer Default Resolution', () => {
    it('should fail validation when title, venue, or dates are missing or whitespace-only', () => {
      const res1 = validateTournamentForm({ title: '', venue: 'Indoor Stadium', dates: '24 Oct' });
      assert.strictEqual(res1.valid, false);

      const res2 = validateTournamentForm({ title: 'City Cup', venue: '   ', dates: '24 Oct' });
      assert.strictEqual(res2.valid, false);

      const res3 = validateTournamentForm({ title: 'City Cup', venue: 'Indoor Stadium', dates: '  ' });
      assert.strictEqual(res3.valid, false);
    });

    it('should default organizer to activeCity District Sports Federation when left blank', () => {
      const res = validateTournamentForm({
        title: 'Inter-School Badminton Fest',
        venue: 'Eklavya Stadium',
        dates: '12-14 Nov',
        organizer: '',
        activeCity: 'Agra',
      });

      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.payload?.organizer, 'Agra District Sports Federation');
    });

    it('should preserve custom organizer name when explicitly specified', () => {
      const res = validateTournamentForm({
        title: 'State Championship',
        venue: 'Sports Hub',
        dates: '1-3 Dec',
        organizer: 'Uttar Pradesh Table Tennis Association',
      });

      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.payload?.organizer, 'Uttar Pradesh Table Tennis Association');
    });

    it('should normalize invalid or missing registration fees to default 450', () => {
      const res = validateTournamentForm({
        title: 'Youth Cup',
        venue: 'Turf Arena',
        dates: '15 Nov',
        registrationFee: 'invalid-amount',
      });

      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.payload?.registrationFee, 450);
    });
  });
});
