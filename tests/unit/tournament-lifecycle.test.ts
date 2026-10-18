import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Role } from '@prisma/client';

describe('Phase 21: Tournament Hosting, Registration & Role Permissions Tests', () => {
  interface TournamentInput {
    title: string;
    sport: string;
    category: string;
    organizer: string;
    dates: string;
    timing: string;
    venue: string;
    locality: string;
    registrationFee: number;
    ageDivisions: string;
    prizePool: string;
    equipmentRules?: string;
    reportingRules?: string;
    matchFormat?: string;
    umpiringRules?: string;
  }

  // Replicating createCompetition authorization & default rules fallback from actions.ts
  function validateAndCreateTournament(
    user: { id: string; role?: string } | null,
    data: TournamentInput
  ) {
    if (!user || (user.role !== Role.COACH && user.role !== Role.ADMIN)) {
      return {
        success: false,
        message: 'Unauthorized. Only registered coaches, organizers, and administrators can host tournaments.',
      };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, message: 'Tournament title is required.' };
    }

    if (data.registrationFee < 0) {
      return { success: false, message: 'Registration fee cannot be negative.' };
    }

    const competition = {
      id: `comp-${Date.now()}`,
      title: data.title.trim(),
      sport: data.sport,
      category: data.category,
      organizer: data.organizer,
      dates: data.dates,
      timing: data.timing,
      venue: data.venue,
      locality: data.locality,
      registrationFee: data.registrationFee,
      ageDivisions: data.ageDivisions,
      prizePool: data.prizePool,
      equipmentRules: data.equipmentRules || 'Standard safety equipment mandatory.',
      reportingRules: data.reportingRules || 'Reporting 30 minutes before match time.',
      matchFormat: data.matchFormat || 'Knockout format.',
      umpiringRules: data.umpiringRules || 'Federation certified officials.',
    };

    return {
      success: true,
      competition,
      message: `Tournament "${data.title}" created successfully!`,
    };
  }

  describe('Tournament Hosting RBAC Permissions', () => {
    const validData: TournamentInput = {
      title: 'Agra Junior Badminton Championship',
      sport: 'Badminton',
      category: 'badminton',
      organizer: 'Agra District Badminton Association',
      dates: 'Nov 14 - Nov 16, 2026',
      timing: '9:00 AM - 6:00 PM',
      venue: 'Eklavya Stadium',
      locality: 'Sadar Bazar',
      registrationFee: 500,
      ageDivisions: 'Under 13, Under 15, Under 17',
      prizePool: '₹25,000 + Medals',
    };

    it('should deny parents from hosting tournaments', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-parent', role: Role.PARENT },
        validData
      );

      assert.strictEqual(res.success, false);
      assert.ok(res.message.includes('Unauthorized. Only registered coaches, organizers, and administrators'));
    });

    it('should deny anonymous guest users from hosting tournaments', () => {
      const res = validateAndCreateTournament(null, validData);
      assert.strictEqual(res.success, false);
    });

    it('should allow registered coaches to host tournaments', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-coach', role: Role.COACH },
        validData
      );

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.competition?.title, 'Agra Junior Badminton Championship');
    });

    it('should allow platform administrators to host tournaments', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-admin', role: Role.ADMIN },
        validData
      );

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.competition?.organizer, 'Agra District Badminton Association');
    });
  });

  describe('Default Rules Fallback Engine', () => {
    it('should apply standardized rule defaults when optional rules are omitted', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-coach', role: Role.COACH },
        {
          title: 'All India Chess Open',
          sport: 'Chess',
          category: 'chess',
          organizer: 'Grandmaster Club',
          dates: 'Dec 1 - Dec 3, 2026',
          timing: '10:00 AM - 5:00 PM',
          venue: 'Youth Center',
          locality: 'Kamla Nagar',
          registrationFee: 300,
          ageDivisions: 'Open',
          prizePool: '₹15,000',
        }
      );

      assert.strictEqual(res.success, true);
      const c = res.competition;
      assert.strictEqual(c?.equipmentRules, 'Standard safety equipment mandatory.');
      assert.strictEqual(c?.reportingRules, 'Reporting 30 minutes before match time.');
      assert.strictEqual(c?.matchFormat, 'Knockout format.');
      assert.strictEqual(c?.umpiringRules, 'Federation certified officials.');
    });

    it('should preserve custom rules when provided by tournament organizer', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-coach', role: Role.COACH },
        {
          title: 'FIDE Rated Rapid Chess',
          sport: 'Chess',
          category: 'chess',
          organizer: 'Chess Academy',
          dates: 'Dec 10, 2026',
          timing: '9:00 AM',
          venue: 'Hall A',
          locality: 'Sanjay Place',
          registrationFee: 600,
          ageDivisions: 'Under 14',
          prizePool: '₹10,000',
          equipmentRules: 'Digital chess clocks provided. Bring personal score sheets.',
          matchFormat: 'Swiss League 7 Rounds (15m + 10s increment).',
        }
      );

      assert.strictEqual(res.success, true);
      assert.strictEqual(
        res.competition?.equipmentRules,
        'Digital chess clocks provided. Bring personal score sheets.'
      );
      assert.strictEqual(
        res.competition?.matchFormat,
        'Swiss League 7 Rounds (15m + 10s increment).'
      );
    });

    it('should reject tournaments with negative registration fees', () => {
      const res = validateAndCreateTournament(
        { id: 'usr-coach', role: Role.COACH },
        {
          title: 'Negative Fee Test',
          sport: 'Tennis',
          category: 'tennis',
          organizer: 'Club',
          dates: 'Dec 2026',
          timing: 'Morning',
          venue: 'Courts',
          locality: 'Agra',
          registrationFee: -100,
          ageDivisions: 'U14',
          prizePool: 'Trophies',
        }
      );

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.message, 'Registration fee cannot be negative.');
    });
  });
});
