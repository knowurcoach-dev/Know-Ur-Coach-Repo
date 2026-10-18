import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 38: Competitions Directory Filtering & Youth Categorization Tests', () => {
  // Logic extracted directly from CompetitionsView.tsx
  function normalizeCategory(rawCategory?: string): string {
    const rawCat = (rawCategory || 'sports').toLowerCase();
    const isStandardSport = ['badminton', 'football', 'tennis', 'cricket', 'swimming', 'athletics', 'sports'].includes(rawCat);
    return isStandardSport ? 'sports' : rawCat;
  }

  function deriveAgeDivisions(rawAgeText?: string): string[] {
    const text = (rawAgeText || '').toLowerCase();
    const derivedAge: string[] = [];
    if (text.includes('9') || text.includes('u-9') || text.includes('u9')) derivedAge.push('u9');
    if (text.includes('11') || text.includes('12') || text.includes('u-11') || text.includes('u-12') || text.includes('u12')) derivedAge.push('u12');
    if (text.includes('15') || text.includes('16') || text.includes('u-15') || text.includes('u-16') || text.includes('u15')) derivedAge.push('u15');
    if (text.includes('17') || text.includes('18') || text.includes('u-17') || text.includes('u-18') || text.includes('u18')) derivedAge.push('u18');
    if (derivedAge.length === 0) derivedAge.push('u12', 'u15');
    return derivedAge;
  }

  function canHostTournament(user: {
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

  function filterCompetitions(
    competitions: any[],
    filters: {
      searchQuery?: string;
      selectedLocality?: string;
      selectedStatus?: string;
      selectedAge?: string;
      selectedCategory?: string;
    }
  ) {
    const {
      searchQuery = '',
      selectedLocality = 'all',
      selectedStatus = 'all',
      selectedAge = 'all',
      selectedCategory = 'all',
    } = filters;

    return competitions.filter((comp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        comp.title.toLowerCase().includes(q) ||
        comp.sport.toLowerCase().includes(q) ||
        comp.venue.toLowerCase().includes(q) ||
        comp.organizer.toLowerCase().includes(q);

      const matchLocality =
        selectedLocality === 'all' || comp.locality === selectedLocality;

      const matchStatus =
        selectedStatus === 'all' || comp.status === selectedStatus;

      const matchAge =
        selectedAge === 'all' ||
        (Array.isArray(comp.age) && comp.age.includes(selectedAge)) ||
        (comp.ageText && comp.ageText.toLowerCase().includes(selectedAge));

      const matchCategory =
        selectedCategory === 'all' ||
        comp.category === selectedCategory ||
        (selectedCategory === 'sports' &&
          ['badminton', 'football', 'tennis', 'cricket', 'sports'].includes(comp.category));

      return matchSearch && matchLocality && matchStatus && matchAge && matchCategory;
    });
  }

  describe('Category Normalization & Age Derivation', () => {
    it('should normalize standard athletic sports to unified sports category', () => {
      assert.strictEqual(normalizeCategory('Badminton'), 'sports');
      assert.strictEqual(normalizeCategory('Football'), 'sports');
      assert.strictEqual(normalizeCategory('Tennis'), 'sports');
      assert.strictEqual(normalizeCategory('Cricket'), 'sports');
      assert.strictEqual(normalizeCategory('Swimming'), 'sports');
      assert.strictEqual(normalizeCategory('Athletics'), 'sports');
    });

    it('should preserve non-athletic disciplines (robotics, chess, arts)', () => {
      assert.strictEqual(normalizeCategory('chess'), 'chess');
      assert.strictEqual(normalizeCategory('robotics'), 'robotics');
      assert.strictEqual(normalizeCategory('arts'), 'arts');
    });

    it('should derive age divisions from diverse string formats (e.g., Under-11, U-15, U18)', () => {
      const parsed1 = deriveAgeDivisions('Under-9 and Under-12 Championship');
      assert.deepStrictEqual(parsed1, ['u9', 'u12']);

      const parsed2 = deriveAgeDivisions('U-15 & U-18 Inter-District Trophy');
      assert.deepStrictEqual(parsed2, ['u15', 'u18']);

      const parsedAll = deriveAgeDivisions('Open for U9, U12, U15, U18 age brackets');
      assert.deepStrictEqual(parsedAll, ['u9', 'u12', 'u15', 'u18']);
    });

    it('should fallback to default [u12, u15] when no age division keywords are detected', () => {
      const fallback = deriveAgeDivisions('Junior Open Invitational');
      assert.deepStrictEqual(fallback, ['u12', 'u15']);

      const empty = deriveAgeDivisions('');
      assert.deepStrictEqual(empty, ['u12', 'u15']);
    });
  });

  describe('Tournament Hosting RBAC Enforcement', () => {
    it('should allow verified Coaches to host tournaments', () => {
      assert.strictEqual(canHostTournament({ isCoach: true, role: 'COACH' }), true);
      assert.strictEqual(canHostTournament({ role: 'COACH' }), true);
    });

    it('should allow Super Admins to host tournaments', () => {
      assert.strictEqual(canHostTournament({ isAdmin: true, role: 'ADMIN' }), true);
      assert.strictEqual(canHostTournament({ role: 'ADMIN' }), true);
    });

    it('should strictly disallow Parents from hosting tournaments', () => {
      assert.strictEqual(canHostTournament({ isParent: true, role: 'PARENT' }), false);
      assert.strictEqual(canHostTournament({ isParent: true, isCoach: true }), false);
    });

    it('should strictly disallow Guest visitors from hosting tournaments', () => {
      assert.strictEqual(canHostTournament({ isGuest: true }), false);
      assert.strictEqual(canHostTournament({ isGuest: true, role: 'COACH' }), false);
    });
  });

  describe('Multi-Facet Tournament Filtering', () => {
    const mockCompetitions = [
      {
        id: 'comp-1',
        title: 'Agra Junior Badminton Championship',
        sport: 'Badminton',
        category: 'sports',
        locality: 'kamla-nagar',
        venue: 'Eklavya Stadium Indoor Court',
        organizer: 'Agra District Badminton Association',
        status: 'open',
        age: ['u12', 'u15'],
        ageText: 'Under-12 & Under-15',
      },
      {
        id: 'comp-2',
        title: 'Taj Youth Chess Grandmaster Open',
        sport: 'Chess',
        category: 'chess',
        locality: 'sanjay-place',
        venue: 'Youth Cultural Club, Sanjay Place',
        organizer: 'UP State Chess Federation',
        status: 'open',
        age: ['u9', 'u12'],
        ageText: 'Under-9 & Under-12',
      },
      {
        id: 'comp-3',
        title: 'Braj Football League',
        sport: 'Football',
        category: 'sports',
        locality: 'dayalbagh',
        venue: 'Dayalbagh Sports Ground',
        organizer: 'Braj Sports Foundation',
        status: 'closed',
        age: ['u15', 'u18'],
        ageText: 'Under-15 & Under-18',
      },
    ];

    it('should search across title, sport, venue, and organizer', () => {
      const resTitle = filterCompetitions(mockCompetitions, { searchQuery: 'badminton' });
      assert.strictEqual(resTitle.length, 1);
      assert.strictEqual(resTitle[0].id, 'comp-1');

      const resVenue = filterCompetitions(mockCompetitions, { searchQuery: 'Eklavya' });
      assert.strictEqual(resVenue.length, 1);
      assert.strictEqual(resVenue[0].id, 'comp-1');

      const resOrganizer = filterCompetitions(mockCompetitions, { searchQuery: 'Federation' });
      assert.strictEqual(resOrganizer.length, 1);
      assert.strictEqual(resOrganizer[0].id, 'comp-2');
    });

    it('should filter by locality and registration status', () => {
      const openInKamlaNagar = filterCompetitions(mockCompetitions, {
        selectedLocality: 'kamla-nagar',
        selectedStatus: 'open',
      });
      assert.strictEqual(openInKamlaNagar.length, 1);
      assert.strictEqual(openInKamlaNagar[0].id, 'comp-1');

      const closedComps = filterCompetitions(mockCompetitions, { selectedStatus: 'closed' });
      assert.strictEqual(closedComps.length, 1);
      assert.strictEqual(closedComps[0].id, 'comp-3');
    });

    it('should match age division accurately', () => {
      const u9Comps = filterCompetitions(mockCompetitions, { selectedAge: 'u9' });
      assert.strictEqual(u9Comps.length, 1);
      assert.strictEqual(u9Comps[0].id, 'comp-2');

      const u15Comps = filterCompetitions(mockCompetitions, { selectedAge: 'u15' });
      assert.strictEqual(u15Comps.length, 2);
    });

    it('should return all tournaments when default filters (all) are applied', () => {
      const all = filterCompetitions(mockCompetitions, {});
      assert.strictEqual(all.length, 3);
    });
  });
});
