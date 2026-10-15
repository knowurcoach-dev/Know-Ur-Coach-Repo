export interface PlatformCategory {
  id?: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  isActive?: boolean;
  order?: number;
}

export const DEFAULT_PLATFORM_CATEGORIES: PlatformCategory[] = [
  // Sports & Athletics (8)
  { name: 'Badminton Academy', slug: 'badminton', icon: 'TennisBall', description: 'Wooden BWF-standard indoor courts with pro training.', order: 1, isActive: true },
  { name: 'Tennis & Racquet Sports', slug: 'tennis', icon: 'TennisBall', description: 'Synthetic and clay tennis courts, NIS certified coaching.', order: 2, isActive: true },
  { name: 'Cricket Academy', slug: 'cricket', icon: 'Baseball', description: 'Turf wickets, bowling machines, BCCI accredited coaches.', order: 3, isActive: true },
  { name: 'Football & Turf Sports', slug: 'football', icon: 'SoccerBall', description: 'FIFA standard 7v7 and 5v5 astroturf floodlit arenas.', order: 4, isActive: true },
  { name: 'Olympic Swimming', slug: 'swimming', icon: 'Waves', description: 'Heated & 50m Olympic pools with certified lifeguards.', order: 5, isActive: true },
  { name: 'Martial Arts & Taekwondo', slug: 'martial-arts', icon: 'ShieldCheck', description: 'Self-defense, belt gradings, WKF championship mats.', order: 6, isActive: true },
  { name: 'Speed Skating Hub', slug: 'skating', icon: 'Lightning', description: 'Banked roller skating rinks with national level mentors.', order: 7, isActive: true },
  { name: 'Athletics & Gymnastics', slug: 'athletics', icon: 'Trophy', description: 'Track & field sprints, gymnastics routines & agility.', order: 8, isActive: true },

  // Brain Booster & STEM (5)
  { name: 'Chess Masterclass', slug: 'chess', icon: 'Brain', description: 'FIDE certified grandmaster training, openings & endgame tactics.', order: 9, isActive: true },
  { name: 'Coding & AI for Juniors', slug: 'coding', icon: 'Cpu', description: 'Python, Scratch, Web apps and AI logic for kids.', order: 10, isActive: true },
  { name: 'Science & Experiential Labs', slug: 'science-labs', icon: 'Flask', description: 'Hands-on chemistry, physics demos and discovery kits.', order: 11, isActive: true },
  { name: 'Robotics & Automation Lab', slug: 'robotics', icon: 'Cpu', description: 'Arduino, Lego Mindstorms, automation & Olympiad prep.', order: 12, isActive: true },
  { name: 'Vedic Maths & Abacus', slug: 'abacus', icon: 'Calculator', description: 'Mental arithmetic speed math and cognitive brain gyms.', order: 13, isActive: true },

  // Cultural & Fine Arts (5)
  { name: 'Kathak & Classical Dance', slug: 'dance', icon: 'Palette', description: 'Kathak, Bharatnatyam, mudras & certified examinations.', order: 14, isActive: true },
  { name: 'Western Dance & Hip Hop', slug: 'western-dance', icon: 'Palette', description: 'Hip hop, freestyle, jazz, contemporary choreography.', order: 15, isActive: true },
  { name: 'Guitar & Keyboard Studio', slug: 'instruments', icon: 'MusicNote', description: 'Acoustic guitar, keyboard, drums & Trinity College syllabus.', order: 16, isActive: true },
  { name: 'Fine Arts & Sketching', slug: 'fine-arts', icon: 'Palette', description: 'Sketching, watercolor, oil canvas & creative craft.', order: 17, isActive: true },
  { name: 'Classical Vocal & Sangeet', slug: 'music', icon: 'MusicNote', description: 'Vocal classical, harmonium, tabla, riyaaz & bhajan.', order: 18, isActive: true },
];

export const CATEGORY_PILLAR_MAP: Record<string, 'sports' | 'brain-booster' | 'arts'> = {
  // Sports & Athletics
  sports: 'sports',
  tennis: 'sports',
  badminton: 'sports',
  cricket: 'sports',
  football: 'sports',
  swimming: 'sports',
  'martial-arts': 'sports',
  skating: 'sports',
  athletics: 'sports',
  gymnastics: 'sports',
  futsal: 'sports',
  // Brain Booster & STEM
  'brain-booster': 'brain-booster',
  stem: 'brain-booster',
  abacus: 'brain-booster',
  robotics: 'brain-booster',
  chess: 'brain-booster',
  coding: 'brain-booster',
  'science-labs': 'brain-booster',
  science: 'brain-booster',
  // Cultural & Fine Arts
  arts: 'arts',
  dance: 'arts',
  'western-dance': 'arts',
  music: 'arts',
  instruments: 'arts',
  guitar: 'arts',
  keyboard: 'arts',
  'fine-arts': 'arts',
  painting: 'arts',
  drawing: 'arts',
  sangeet: 'arts',
  drama: 'arts',
};

export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  tennis: '🎾',
  badminton: '🏸',
  cricket: '🏏',
  football: '⚽',
  futsal: '⚽',
  swimming: '🏊',
  'martial-arts': '🥋',
  skating: '🛼',
  athletics: '🤸',
  gymnastics: '🤸',
  stem: '🤖',
  robotics: '🤖',
  abacus: '🧮',
  chess: '♟️',
  coding: '💻',
  'science-labs': '🔬',
  dance: '💃',
  'western-dance': '🕺',
  instruments: '🎸',
  'fine-arts': '🎨',
  music: '🎵',
  arts: '🎨',
  painting: '🎨',
  sports: '🏆',
  'brain-booster': '🧠',
};

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  tennis: 'Tennis & Racquet Sports',
  badminton: 'Badminton Academy',
  cricket: 'Cricket Academy',
  football: 'Football & Turf Sports',
  swimming: 'Olympic Swimming',
  'martial-arts': 'Martial Arts & Taekwondo',
  skating: 'Speed Skating Hub',
  athletics: 'Athletics & Gymnastics',
  gymnastics: 'Gymnastics Centre',
  stem: 'STEM & Robotics Lab',
  robotics: 'Robotics & Automation Lab',
  abacus: 'Vedic Maths & Abacus',
  chess: 'Chess Masterclass',
  coding: 'Coding & AI for Juniors',
  'science-labs': 'Science & Experiential Labs',
  dance: 'Kathak & Classical Dance',
  'western-dance': 'Western Dance & Hip Hop',
  instruments: 'Guitar & Keyboard Studio',
  'fine-arts': 'Fine Arts & Sketching',
  music: 'Classical Vocal & Sangeet',
  arts: 'Fine Arts & Painting',
  sports: 'Sports & Athletics',
  'brain-booster': 'Brain Booster & STEM',
};

export const CATEGORY_SHORT_NAMES: Record<string, string> = {
  all: 'All Activities',
  badminton: 'Badminton',
  tennis: 'Lawn Tennis',
  cricket: 'Cricket',
  football: 'Football',
  swimming: 'Swimming',
  'martial-arts': 'Martial Arts',
  skating: 'Skating',
  athletics: 'Athletics',
  chess: 'Chess',
  coding: 'Coding & AI',
  'science-labs': 'Science Labs',
  robotics: 'Robotics',
  abacus: 'Vedic Maths',
  dance: 'Classical Dance',
  'western-dance': 'Western Dance',
  instruments: 'Instruments',
  'fine-arts': 'Fine Arts',
  music: 'Vocal Music',
  stem: 'Robotics',
  arts: 'Fine Arts',
};

export interface TaxonomyCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  shortName?: string;
}

export interface TaxonomyGroup {
  id: string;
  name: string;
  slug: string;
  categories: TaxonomyCategoryItem[];
}

export const FALLBACK_TAXONOMY_GROUPS: TaxonomyGroup[] = [
  {
    id: 'sports',
    name: 'Sports & Athletics',
    slug: 'sports',
    categories: [
      { id: 'badminton', name: 'Badminton Academy', slug: 'badminton', icon: '🏸', shortName: 'Badminton' },
      { id: 'tennis', name: 'Tennis & Racquet Sports', slug: 'tennis', icon: '🎾', shortName: 'Lawn Tennis' },
      { id: 'cricket', name: 'Cricket Academy', slug: 'cricket', icon: '🏏', shortName: 'Cricket' },
      { id: 'football', name: 'Football & Turf Sports', slug: 'football', icon: '⚽', shortName: 'Football' },
      { id: 'swimming', name: 'Olympic Swimming', slug: 'swimming', icon: '🏊', shortName: 'Swimming' },
      { id: 'martial-arts', name: 'Martial Arts & Taekwondo', slug: 'martial-arts', icon: '🥋', shortName: 'Martial Arts' },
      { id: 'skating', name: 'Speed Skating Hub', slug: 'skating', icon: '🛼', shortName: 'Skating' },
      { id: 'athletics', name: 'Athletics & Gymnastics', slug: 'athletics', icon: '🤸', shortName: 'Athletics' },
    ],
  },
  {
    id: 'brain-booster',
    name: 'Brain Booster & STEM',
    slug: 'brain-booster',
    categories: [
      { id: 'chess', name: 'Chess Masterclass', slug: 'chess', icon: '♟️', shortName: 'Chess' },
      { id: 'coding', name: 'Coding & AI for Juniors', slug: 'coding', icon: '💻', shortName: 'Coding & AI' },
      { id: 'science-labs', name: 'Science & Experiential Labs', slug: 'science-labs', icon: '🔬', shortName: 'Science Labs' },
      { id: 'robotics', name: 'Robotics & Automation Lab', slug: 'robotics', icon: '🤖', shortName: 'Robotics' },
      { id: 'abacus', name: 'Vedic Maths & Abacus', slug: 'abacus', icon: '🧮', shortName: 'Vedic Maths' },
    ],
  },
  {
    id: 'arts',
    name: 'Cultural & Fine Arts',
    slug: 'arts',
    categories: [
      { id: 'dance', name: 'Kathak & Classical Dance', slug: 'dance', icon: '💃', shortName: 'Classical Dance' },
      { id: 'western-dance', name: 'Western Dance & Hip Hop', slug: 'western-dance', icon: '🕺', shortName: 'Western Dance' },
      { id: 'instruments', name: 'Guitar & Keyboard Studio', slug: 'instruments', icon: '🎸', shortName: 'Instruments' },
      { id: 'fine-arts', name: 'Fine Arts & Sketching', slug: 'fine-arts', icon: '🎨', shortName: 'Fine Arts' },
      { id: 'music', name: 'Classical Vocal & Sangeet', slug: 'music', icon: '🎵', shortName: 'Vocal Music' },
    ],
  },
];

/**
 * Splits a comma-separated category string into an array of clean slugs.
 */
export function parseCategorySlugs(categoryString?: string): string[] {
  if (!categoryString) return [];
  return categoryString
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns formatted display names for a category string (e.g. "badminton,tennis" -> ["Badminton Academy", "Tennis & Racquet Sports"])
 */
export function getCategoriesDisplayNames(categoryString?: string): string[] {
  const slugs = parseCategorySlugs(categoryString);
  if (slugs.length === 0) return ['Sports & Athletics'];
  return slugs.map(getCategoryDisplayName);
}

/**
 * Returns the parent pillar ('sports' | 'brain-booster' | 'arts') for any category slug or name.
 */
export function getCategoryPillar(slugOrName?: string): 'sports' | 'brain-booster' | 'arts' {
  if (!slugOrName) return 'sports';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');
  return CATEGORY_PILLAR_MAP[clean] || 'sports';
}

/**
 * Returns the emoji icon for any category slug or name.
 */
export function getCategoryEmoji(slugOrName?: string): string {
  if (!slugOrName) return '🏆';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');
  if (CATEGORY_EMOJI_MAP[clean]) return CATEGORY_EMOJI_MAP[clean];
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (clean.includes(key)) return emoji;
  }
  return '🌟';
}

/**
 * Returns a polished, human-readable display name for any category slug.
 */
export function getCategoryDisplayName(slugOrName?: string): string {
  if (!slugOrName) return 'Sports & Athletics';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');
  if (CATEGORY_DISPLAY_NAMES[clean]) return CATEGORY_DISPLAY_NAMES[clean];
  // If already formatted with spaces and capitals, return it
  if (slugOrName.includes(' ') && /[A-Z]/.test(slugOrName)) return slugOrName;
  // Fallback: title case
  return slugOrName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Returns a high-resolution, thematic cover photo for any activity or category.
 */
export function resolveCategoryCoverImage(slugOrName?: string, existingUrl?: string | null): string {
  if (existingUrl && existingUrl.startsWith('http')) return existingUrl;
  const s = (slugOrName || '').toLowerCase();

  if (s.includes('badminton') || s.includes('shuttle')) {
    return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('swim') || s.includes('aquatic') || s.includes('pool')) {
    return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('tennis')) {
    return 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('football') || s.includes('soccer') || s.includes('turf') || s.includes('futsal')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('cricket')) {
    return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('skat') || s.includes('roller')) {
    return 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('martial') || s.includes('karate') || s.includes('taekwondo') || s.includes('judo') || s.includes('boxing') || s.includes('combat')) {
    return 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('robot') || s.includes('stem') || s.includes('arduino')) {
    return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('chess')) {
    return 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('abacus') || s.includes('math') || s.includes('vedic')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('dance') || s.includes('kathak') || s.includes('ballet') || s.includes('hiphop')) {
    return 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('music') || s.includes('guitar') || s.includes('vocal') || s.includes('sangeet') || s.includes('sing') || s.includes('piano') || s.includes('keyboard')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('art') || s.includes('paint') || s.includes('draw') || s.includes('sketch') || s.includes('craft')) {
    return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('gymnast') || s.includes('athletic')) {
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('cod') || s.includes('tech') || s.includes('python') || s.includes('ai')) {
    return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop';
  }
  if (s.includes('science') || s.includes('lab') || s.includes('experiment')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=600&auto=format&fit=crop';
}
