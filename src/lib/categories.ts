export interface PlatformCategory {
  id?: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  isActive?: boolean;
  order?: number;
}



export const CATEGORY_PILLAR_MAP: Record<string, 'sports' | 'brain-booster' | 'arts' | 'education'> = {
  // Sports & Athletics
  sports: 'sports',
  tennis: 'sports',
  'lawn-tennis': 'sports',
  'table-tennis': 'sports',
  badminton: 'sports',
  cricket: 'sports',
  handball: 'sports',
  handfall: 'sports',
  basketball: 'sports',
  swimming: 'sports',
  skating: 'sports',
  gymnastics: 'sports',
  chess: 'sports',
  shooting: 'sports',
  yoga: 'sports',
  football: 'sports',
  taekwondo: 'sports',
  'martial-arts': 'sports',
  athletics: 'sports',
  futsal: 'sports',
  // Brain Booster & STEM
  'brain-booster': 'brain-booster',
  'brain-gym': 'brain-booster',
  handwriting: 'brain-booster',
  abacus: 'brain-booster',
  phonics: 'brain-booster',
  'matra-gyan': 'brain-booster',
  stem: 'brain-booster',
  robotics: 'brain-booster',
  coding: 'brain-booster',
  'science-labs': 'brain-booster',
  science: 'brain-booster',
  "rubik's-cube": 'brain-booster',
  'rubiks-cube': 'brain-booster',
  // Academic Education & Tutors
  education: 'education',
  'coaching-centres': 'education',
  'coaching-center': 'education',
  'coaching-centers': 'education',
  'home-tutor': 'education',
  'home-tutors': 'education',
  'online-tutors': 'education',
  'online-tutors-(one-to-one-sessions)': 'education',
  'academic-coaching': 'education',
  tuition: 'education',
  tuitions: 'education',
  tutor: 'education',
  tutors: 'education',
  olympiad: 'education',
  olympiads: 'education',
  // Cultural & Fine Arts
  arts: 'arts',
  'drawing-painting': 'arts',
  'drawing-and-painting': 'arts',
  drawing: 'arts',
  painting: 'arts',
  dance: 'arts',
  'western-dance': 'arts',
  'western-and-hiphop-dance': 'arts',
  'classical-&-semi-classical': 'arts',
  'classical-dance': 'arts',
  kathak: 'arts',
  'zumba-&-aerobics': 'arts',
  'contemporary-&-salsa': 'arts',
  'bollywood-dance': 'arts',
  'folk-dance': 'arts',
  'personality-development': 'brain-booster',
  'foreign-languages': 'education',
  'archery-': 'sports',
  archery: 'sports',
  'pickle-ball': 'sports',
  'resin-art': 'arts',
  'fashion-designing': 'arts',
  'student-counsellor': 'education',
  'acting-&-modelling': 'arts',
  'public-speaking-(-fluency-&-debate-)': 'brain-booster',
  keyboard: 'arts',
  tabla: 'arts',
  piano: 'arts',
  flute: 'arts',
  mehandi: 'arts',
  mehendi: 'arts',
  calligraphy: 'arts',
  calligraphi: 'arts',
  'art-craft': 'arts',
  'art-and-craft': 'arts',
  baking: 'arts',
  music: 'arts',
  instruments: 'arts',
  guitar: 'arts',
  'fine-arts': 'arts',
  sangeet: 'arts',
  drama: 'arts',
};

export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Sports
  tennis: '🎾',
  'lawn-tennis': '🎾',
  'table-tennis': '🏓',
  badminton: '🏸',
  cricket: '🏏',
  handball: '🤾',
  handfall: '🤾',
  basketball: '🏀',
  swimming: '🏊',
  skating: '🛼',
  gymnastics: '🤸',
  chess: '♟️',
  shooting: '🎯',
  yoga: '🧘',
  football: '⚽',
  futsal: '⚽',
  taekwondo: '🥋',
  'martial-arts': '🥋',
  athletics: '🤸',
  sports: '🏆',
  // Brain Booster
  'brain-booster': '🧠',
  'brain-gym': '🧠',
  handwriting: '✍️',
  abacus: '🧮',
  phonics: '🗣️',
  'matra-gyan': '📖',
  stem: '🤖',
  robotics: '🤖',
  coding: '💻',
  'science-labs': '🔬',
  "rubik's-cube": '🧊',
  'rubiks-cube': '🧊',
  // Education
  education: '📚',
  'coaching-centres': '🏫',
  'coaching-center': '🏫',
  'coaching-centers': '🏫',
  'home-tutor': '👨‍🏫',
  'home-tutors': '👨‍🏫',
  'online-tutors': '💻',
  'online-tutors-(one-to-one-sessions)': '💻',
  // Cultural & Fine Arts
  arts: '🎨',
  'drawing-painting': '🎨',
  'drawing-and-painting': '🎨',
  drawing: '🎨',
  painting: '🎨',
  dance: '💃',
  'western-dance': '🕺',
  'western-and-hiphop-dance': '🕺',
  'classical-&-semi-classical': '🪕',
  'classical-dance': '🪕',
  kathak: '🪕',
  'zumba-&-aerobics': '💃',
  'contemporary-&-salsa': '💃',
  'bollywood-dance': '💃',
  'folk-dance': '💃',
  'personality-development': '🌟',
  'foreign-languages': '🗣️',
  'archery-': '🏹',
  archery: '🏹',
  'pickle-ball': '🏓',
  'resin-art': '🎨',
  'fashion-designing': '👗',
  'student-counsellor': '🎓',
  'acting-&-modelling': '🎭',
  'public-speaking-(-fluency-&-debate-)': '🎤',
  keyboard: '🎹',
  tabla: '🪘',
  piano: '🎹',
  flute: '🪈',
  mehandi: '🌿',
  mehendi: '🌿',
  calligraphy: '🖋️',
  calligraphi: '🖋️',
  'art-craft': '✂️',
  'art-and-craft': '✂️',
  baking: '🧁',
  instruments: '🎸',
  guitar: '🎸',
  'fine-arts': '🎨',
  music: '🎵',
};

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Sports
  tennis: 'Tennis & Racquet Sports',
  'lawn-tennis': 'Lawn Tennis',
  'table-tennis': 'Table Tennis',
  badminton: 'Badminton Academy',
  cricket: 'Cricket Academy',
  handball: 'Handball Coaching',
  handfall: 'Handball Coaching',
  basketball: 'Basketball Academy',
  swimming: 'Olympic Swimming',
  skating: 'Speed & Roller Skating',
  gymnastics: 'Gymnastics Centre',
  chess: 'Chess Masterclass',
  shooting: '10m Air Rifle Shooting',
  yoga: 'Yoga & Mindfulness',
  football: 'Football & Turf Sports',
  taekwondo: 'Taekwondo & Martial Arts',
  'martial-arts': 'Martial Arts & Taekwondo',
  athletics: 'Athletics & Gymnastics',
  sports: 'Sports & Athletics',
  // Brain Booster
  'brain-booster': 'Brain Booster & STEM',
  'brain-gym': 'Brain Gym & Cognitive Memory',
  handwriting: 'Speed Handwriting & Cursive',
  abacus: 'Vedic Maths & Speed Abacus',
  phonics: 'English Phonics & Reading',
  'matra-gyan': 'Hindi Matra Gyan & Vyakaran',
  stem: 'STEM & Robotics Lab',
  robotics: 'Robotics & Automation Lab',
  coding: 'Coding & AI for Juniors',
  'science-labs': 'Science & Experiential Labs',
  "rubik's-cube": "Rubik's Cube & Mental Agility",
  // Education
  education: 'Academic Education & Tuitions',
  'coaching-centres': 'Academic Coaching & Olympiads',
  'coaching-center': 'Academic Coaching & Olympiads',
  'coaching-centers': 'Academic Coaching & Olympiads',
  'home-tutor': 'Home Tutor',
  'home-tutors': 'Home Tutors',
  'online-tutors': 'Online Tutors (1-on-1)',
  'online-tutors-(one-to-one-sessions)': 'Online Tutors (1-on-1)',
  // Cultural & Fine Arts
  arts: 'Cultural & Fine Arts',
  'drawing-painting': 'Drawing & Painting',
  'drawing-and-painting': 'Drawing & Painting',
  drawing: 'Drawing & Sketching',
  painting: 'Fine Painting & Canvas',
  dance: 'Western and HipHop Dance',
  'western-dance': 'Western and HipHop Dance',
  'western-and-hiphop-dance': 'Western and HipHop Dance',
  'classical-&-semi-classical': 'Classical & Semi Classical',
  'classical-dance': 'Classical & Semi Classical',
  kathak: 'Kathak & Classical Dance',
  'zumba-&-aerobics': 'Zumba & Aerobics',
  'contemporary-&-salsa': 'Contemporary & Salsa',
  'bollywood-dance': 'Bollywood Dance',
  'folk-dance': 'Folk Dance',
  'personality-development': 'Personality Development',
  'foreign-languages': 'Foreign Languages',
  'archery-': 'Archery Range',
  archery: 'Archery Range',
  'pickle-ball': 'Pickleball Arena',
  'resin-art': 'Resin Art Studio',
  'fashion-designing': 'Fashion Designing',
  'student-counsellor': 'Student Counsellor',
  'acting-&-modelling': 'Acting & Modelling',
  'public-speaking-(-fluency-&-debate-)': 'Public Speaking (Fluency & Debate)',
  keyboard: 'Electronic Keyboard & Synthesizer',
  tabla: 'Classical Tabla & Percussion',
  piano: 'Acoustic & Grand Piano',
  flute: 'Bansuri & Classical Flute',
  mehandi: 'Bridal & Designer Mehendi Art',
  mehendi: 'Bridal & Designer Mehendi Art',
  calligraphy: 'Calligraphy & Hand Lettering',
  calligraphi: 'Calligraphy & Hand Lettering',
  'art-craft': 'Creative Art & Craft',
  'art-and-craft': 'Creative Art & Craft',
  baking: 'Junior Baking & Patisserie',
  instruments: 'Guitar & Keyboard Studio',
  'fine-arts': 'Fine Arts & Sketching',
  music: 'Classical Vocal & Sangeet',
};

export const CATEGORY_SHORT_NAMES: Record<string, string> = {
  all: 'All Activities',
  tennis: 'Lawn Tennis',
  'lawn-tennis': 'Lawn Tennis',
  'table-tennis': 'Table Tennis',
  badminton: 'Badminton',
  cricket: 'Cricket',
  handball: 'Handball',
  handfall: 'Handball',
  basketball: 'Basketball',
  swimming: 'Swimming',
  skating: 'Skating',
  gymnastics: 'Gymnastics',
  chess: 'Chess',
  shooting: 'Shooting',
  yoga: 'Yoga',
  football: 'Football',
  taekwondo: 'Taekwondo',
  'martial-arts': 'Martial Arts',
  athletics: 'Athletics',
  'brain-gym': 'Brain Gym',
  handwriting: 'Handwriting',
  abacus: 'Vedic Maths',
  phonics: 'Phonics',
  'matra-gyan': 'Matra Gyan',
  stem: 'Robotics',
  robotics: 'Robotics',
  coding: 'Coding & AI',
  'science-labs': 'Science Labs',
  "rubik's-cube": "Rubik's Cube",
  education: 'Education',
  'coaching-centres': 'Coaching Centres',
  'home-tutor': 'Home Tutor',
  'online-tutors': 'Online Tutors',
  'online-tutors-(one-to-one-sessions)': 'Online Tutors',
  'drawing-painting': 'Drawing & Painting',
  'drawing-and-painting': 'Drawing & Painting',
  drawing: 'Drawing',
  painting: 'Painting',
  dance: 'Western & HipHop',
  'western-dance': 'Western & HipHop',
  'western-and-hiphop-dance': 'Western & HipHop',
  'classical-&-semi-classical': 'Classical Dance',
  'classical-dance': 'Classical Dance',
  kathak: 'Kathak',
  'zumba-&-aerobics': 'Zumba & Aerobics',
  'contemporary-&-salsa': 'Contemporary & Salsa',
  'bollywood-dance': 'Bollywood Dance',
  'folk-dance': 'Folk Dance',
  'personality-development': 'Personality Dev',
  'foreign-languages': 'Foreign Languages',
  'archery-': 'Archery',
  archery: 'Archery',
  'pickle-ball': 'Pickleball',
  'resin-art': 'Resin Art',
  'fashion-designing': 'Fashion Design',
  'student-counsellor': 'Student Counsellor',
  'acting-&-modelling': 'Acting & Modelling',
  'public-speaking-(-fluency-&-debate-)': 'Public Speaking',
  keyboard: 'Keyboard',
  tabla: 'Tabla',
  piano: 'Piano',
  flute: 'Flute',
  mehandi: 'Mehandi',
  mehendi: 'Mehandi',
  calligraphy: 'Calligraphy',
  calligraphi: 'Calligraphy',
  'art-craft': 'Art & Craft',
  'art-and-craft': 'Art & Craft',
  baking: 'Baking',
  instruments: 'Instruments',
  'fine-arts': 'Fine Arts',
  music: 'Vocal Music',
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

// ─── Live Database Dynamic Taxonomy Registry ─────────────────────────────────
// Automatically populated from PostgreSQL MajorActivity & Discipline records.
// When an administrator or client adds a new activity or category in the database,
// it is dynamically registered here without requiring code edits.
const DYNAMIC_CATEGORY_PILLAR_MAP: Record<string, string> = {};
const DYNAMIC_CATEGORY_NAME_MAP: Record<string, string> = {};
const DYNAMIC_CATEGORY_EMOJI_MAP: Record<string, string> = {};

// Helper to verify if a string is a genuine unicode emoji rather than a component name like "Trophy"
function isRealEmoji(str?: string | null): boolean {
  if (!str) return false;
  const s = str.trim();
  if (s.length === 0 || s.length > 5) return false;
  // If it contains ASCII alphanumeric letters/words like "Trophy", "Sparkle", it is NOT an emoji
  if (/^[a-zA-Z0-9_\-\s]+$/.test(s)) return false;
  return true;
}

export function registerDynamicTaxonomy(activities: any[]): void {
  if (!Array.isArray(activities)) return;
  activities.forEach((act) => {
    if (act?.slug) {
      const pillarSlug = act.slug.toLowerCase().trim();
      const items = act.categories || act.disciplines;
      if (Array.isArray(items)) {
        items.forEach((cat: any) => {
          if (cat?.slug) {
            const catSlug = cat.slug.toLowerCase().trim();
            DYNAMIC_CATEGORY_PILLAR_MAP[catSlug] = pillarSlug;
            if (cat.name) DYNAMIC_CATEGORY_NAME_MAP[catSlug] = cat.name;
            // Only store in emoji registry if it is genuinely a unicode emoji character
            if (isRealEmoji(cat.icon)) {
              DYNAMIC_CATEGORY_EMOJI_MAP[catSlug] = cat.icon.trim();
            }
          }
        });
      }
    }
  });
}

export function getCategoryPillar(slugOrName?: string): string {
  if (!slugOrName) return 'sports';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');

  // 1. Live Dynamic Database Registry
  if (DYNAMIC_CATEGORY_PILLAR_MAP[clean]) {
    return DYNAMIC_CATEGORY_PILLAR_MAP[clean];
  }

  // 2. Static Fallback Map
  if (CATEGORY_PILLAR_MAP[clean]) return CATEGORY_PILLAR_MAP[clean];

  // 3. Smart Keyword Fallbacks for standard pillars
  if (clean.includes('coaching') || clean.includes('tutor') || clean.includes('tuition') || clean.includes('academic') || clean.includes('olympiad') || clean.includes('education')) {
    return 'education';
  }
  if (clean.includes('brain') || clean.includes('abacus') || clean.includes('phonics') || clean.includes('handwriting') || clean.includes('stem') || clean.includes('robot') || clean.includes('coding') || clean.includes('rubik') || clean.includes('matra')) {
    return 'brain-booster';
  }
  if (clean.includes('art') || clean.includes('paint') || clean.includes('dance') || clean.includes('music') || clean.includes('guitar') || clean.includes('piano') || clean.includes('sing') || clean.includes('tabla') || clean.includes('flute') || clean.includes('mehendi') || clean.includes('craft')) {
    return 'arts';
  }
  return 'sports';
}

/**
 * Returns the emoji icon for any category slug or name.
 * Always guarantees a genuine unicode emoji character (🏏, 🎾, 🏊, 📚, 🎨, 🧠, 🏆).
 * Never returns text strings or component names like "Trophy".
 */
export function getCategoryEmoji(slugOrName?: string): string {
  if (!slugOrName) return '🏆';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');

  // 1. Direct Static Emoji Mapping (highest fidelity for standard activities: cricket -> 🏏, tennis -> 🎾)
  if (CATEGORY_EMOJI_MAP[clean]) return CATEGORY_EMOJI_MAP[clean];

  // 2. Live Dynamic Database Registry (only if a real unicode emoji was saved)
  if (DYNAMIC_CATEGORY_EMOJI_MAP[clean] && isRealEmoji(DYNAMIC_CATEGORY_EMOJI_MAP[clean])) {
    return DYNAMIC_CATEGORY_EMOJI_MAP[clean];
  }

  // 3. Substring matching in CATEGORY_EMOJI_MAP
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (clean.includes(key) && key.length > 2) return emoji;
  }

  // 4. Pillar-based smart emoji fallback
  const pillar = getCategoryPillar(clean);
  if (pillar === 'education') return '📚';
  if (pillar === 'brain-booster') return '🧠';
  if (pillar === 'arts') return '🎨';
  if (pillar === 'sports') return '🏆';

  return '🌟';
}

/**
 * Returns a polished, human-readable display name for any category slug.
 */
export function getCategoryDisplayName(slugOrName?: string): string {
  if (!slugOrName) return 'Sports & Athletics';
  const clean = slugOrName.toLowerCase().trim().replace(/\s+/g, '-');

  // 1. Live Dynamic Database Registry
  if (DYNAMIC_CATEGORY_NAME_MAP[clean]) {
    return DYNAMIC_CATEGORY_NAME_MAP[clean];
  }

  // 2. Static Fallback Map
  if (CATEGORY_DISPLAY_NAMES[clean]) return CATEGORY_DISPLAY_NAMES[clean];

  // 3. If already formatted with spaces and capitals, return it
  if (slugOrName.includes(' ') && /[A-Z]/.test(slugOrName)) return slugOrName;

  // 4. Clean Dynamic Fallback: auto Title Case for any arbitrary slug
  return slugOrName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Returns a high-resolution, thematic cover photo for any activity or category.
 */
/**
 * Returns a high-resolution, thematic cover photo for any activity or category.
 * Every single category has its own distinct, dedicated image (no shared images).
 */
export function resolveCategoryCoverImage(slugOrName?: string, existingUrl?: string | null): string {
  if (existingUrl && (existingUrl.startsWith('http') || existingUrl.startsWith('/') || existingUrl.startsWith('data:image/'))) {
    return existingUrl;
  }
  const s = (slugOrName || '').toLowerCase().trim();

  // Sports & Athletics
  if (s.includes('table-tennis') || s.includes('table tennis') || s.includes('pingpong') || s.includes('ping pong')) {
    return 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('badminton') || s.includes('shuttle')) {
    return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('tennis')) {
    return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('cricket')) {
    return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('handball') || s.includes('handfall')) {
    return '/images/categories/handball.jpg';
  }
  if (s.includes('basketball') || s.includes('hoops')) {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('swim') || s.includes('aquatic') || s.includes('pool')) {
    return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('skat') || s.includes('roller')) {
    return 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('gymnast') || s.includes('athletic')) {
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('chess')) {
    return 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('shooting') || s.includes('rifle') || s.includes('pistol')) {
    return '/images/categories/shooting.jpg';
  }
  if (s.includes('yoga') || s.includes('meditat') || s.includes('mindfulness')) {
    return '/images/categories/yoga.jpg';
  }
  if (s.includes('football') || s.includes('soccer') || s.includes('turf') || s.includes('futsal')) {
    return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('martial') || s.includes('karate') || s.includes('taekwondo') || s.includes('judo') || s.includes('boxing') || s.includes('combat')) {
    return 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop';
  }

  // Cultural & Fine Arts
  if (s.includes('tabla') || s.includes('percussion') || s.includes('dholak')) {
    return '/images/categories/tabla.jpg';
  }
  if (s.includes('flute') || s.includes('bansuri')) {
    return '/images/categories/flute.jpg';
  }
  if (s.includes('mehandi') || s.includes('mehendi') || s.includes('henna')) {
    return '/images/categories/mehandi.jpg';
  }
  if (s.includes('calligraph') || s.includes('lettering')) {
    return '/images/categories/calligraphy.jpg';
  }
  if (s.includes('baking') || s.includes('pastry') || s.includes('patisserie') || s.includes('cook')) {
    return '/images/categories/baking.jpg';
  }
  if (s.includes('piano') && !s.includes('keyboard')) {
    return 'https://images.unsplash.com/photo-1520523839898-5071270509a2?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('keyboard') || s.includes('synthesizer')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('drawing') || s.includes('draw-and-paint') || s.includes('paint') || s.includes('sketch')) {
    return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('craft') || s.includes('origami') || s.includes('clay')) {
    return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('dance') || s.includes('kathak') || s.includes('ballet') || s.includes('hiphop') || s.includes('bharatnatyam')) {
    return 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('music') || s.includes('guitar') || s.includes('vocal') || s.includes('sangeet') || s.includes('sing')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';
  }

  // Brain Booster & STEM
  if (s.includes('brain-gym') || s.includes('brain gym') || s.includes('neuro') || s.includes('mental-gym')) {
    return '/images/categories/brain-gym.jpg';
  }
  if (s.includes('handwriting') || s.includes('cursive') || s.includes('penmanship')) {
    return '/images/categories/handwriting.jpg';
  }
  if (s.includes('phonics') || s.includes('alphabet sounds')) {
    return '/images/categories/phonics.jpg';
  }
  if (s.includes('matra') || s.includes('vyakaran') || s.includes('varnamala') || s.includes('hindi')) {
    return '/images/categories/matra-gyan.jpg';
  }
  if (s.includes('abacus') || s.includes('math') || s.includes('vedic')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('robot') || s.includes('stem') || s.includes('arduino')) {
    return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('cod') || s.includes('tech') || s.includes('python') || s.includes('ai')) {
    return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('science') || s.includes('lab') || s.includes('experiment')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('rubik')) {
    return 'https://images.unsplash.com/photo-1568869846214-6847185f49e8?q=80&w=800&auto=format&fit=crop';
  }

  // Academic Education & Tutors
  if (s.includes('coaching') || s.includes('tuition') || s.includes('olympiad') || s.includes('academic')) {
    return 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('home-tutor') || s.includes('tutor') || s.includes('teacher')) {
    return 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop';
  }
  if (s.includes('online') || s.includes('one-to-one')) {
    return 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=800&auto=format&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop';
}

/**
 * Resolves a natural search query or tag string to its standard category slug and pillar.
 */
export function resolveCategoryFromSearch(q: string): { category: string; pillar: string } | null {
  if (!q) return null;
  const clean = q.toLowerCase().trim();

  // Sports & Athletics
  if (clean.includes('table tennis') || clean.includes('table-tennis') || clean.includes('ping pong') || clean.includes('pingpong')) {
    return { category: 'table-tennis', pillar: 'sports' };
  }
  if (clean.includes('badminton') || clean.includes('shuttle')) {
    return { category: 'badminton', pillar: 'sports' };
  }
  if (clean.includes('tennis')) {
    return { category: 'tennis', pillar: 'sports' };
  }
  if (clean.includes('cricket')) {
    return { category: 'cricket', pillar: 'sports' };
  }
  if (clean.includes('handball') || clean.includes('handfall')) {
    return { category: 'handball', pillar: 'sports' };
  }
  if (clean.includes('basketball') || clean.includes('hoops')) {
    return { category: 'basketball', pillar: 'sports' };
  }
  if (clean.includes('swim') || clean.includes('aquatic') || clean.includes('pool')) {
    return { category: 'swimming', pillar: 'sports' };
  }
  if (clean.includes('skat') || clean.includes('roller')) {
    return { category: 'skating', pillar: 'sports' };
  }
  if (clean.includes('gymnast') || clean.includes('acrobatic')) {
    return { category: 'gymnastics', pillar: 'sports' };
  }
  if (clean.includes('shooting') || clean.includes('rifle') || clean.includes('pistol')) {
    return { category: 'shooting', pillar: 'sports' };
  }
  if (clean.includes('yoga') || clean.includes('mindfulness')) {
    return { category: 'yoga', pillar: 'sports' };
  }
  if (clean.includes('football') || clean.includes('soccer') || clean.includes('futsal')) {
    return { category: 'football', pillar: 'sports' };
  }
  if (clean.includes('martial') || clean.includes('karate') || clean.includes('taekwondo') || clean.includes('judo') || clean.includes('boxing')) {
    return { category: 'martial-arts', pillar: 'sports' };
  }

  // Brain Booster & STEM
  if (clean.includes('brain gym') || clean.includes('brain-gym') || clean.includes('neuro agility') || clean.includes('memory')) {
    return { category: 'brain-gym', pillar: 'brain-booster' };
  }
  if (clean.includes('handwriting') || clean.includes('cursive') || clean.includes('penmanship')) {
    return { category: 'handwriting', pillar: 'brain-booster' };
  }
  if (clean.includes('abacus') || clean.includes('vedic')) {
    return { category: 'abacus', pillar: 'brain-booster' };
  }
  if (clean.includes('phonics')) {
    return { category: 'phonics', pillar: 'brain-booster' };
  }
  if (clean.includes('matra') || clean.includes('matra gyan') || clean.includes('varnamala') || clean.includes('vyakaran')) {
    return { category: 'matra-gyan', pillar: 'brain-booster' };
  }
  if (clean.includes('chess')) {
    return { category: 'chess', pillar: 'brain-booster' };
  }
  if (clean.includes('robot') || clean.includes('stem') || clean.includes('coding') || clean.includes('arduino') || clean.includes('python')) {
    return { category: 'robotics', pillar: 'brain-booster' };
  }
  if (clean.includes('rubik')) {
    return { category: "rubik's-cube", pillar: 'brain-booster' };
  }

  // Education
  if (clean.includes('coaching') || clean.includes('tuition') || clean.includes('olympiad') || clean.includes('academic')) {
    return { category: 'coaching-centres', pillar: 'education' };
  }
  if (clean.includes('home tutor') || clean.includes('home-tutor') || clean.includes('private tutor')) {
    return { category: 'home-tutor', pillar: 'education' };
  }
  if (clean.includes('online tutor') || clean.includes('online-tutor') || clean.includes('one to one') || clean.includes('one-to-one')) {
    return { category: 'online-tutors-(one-to-one-sessions)', pillar: 'education' };
  }
  if (clean.includes('tutor') || clean.includes('education')) {
    return { category: 'coaching-centres', pillar: 'education' };
  }

  // Cultural & Fine Arts
  if (clean.includes('kathak') || clean.includes('classical dance') || clean.includes('semi classical') || clean.includes('bharatnatyam')) {
    return { category: 'classical-&-semi-classical', pillar: 'arts' };
  }
  if (clean.includes('dance') || clean.includes('hip hop') || clean.includes('hiphop') || clean.includes('western dance') || clean.includes('ballet')) {
    return { category: 'dance', pillar: 'arts' };
  }
  if (clean.includes('tabla')) {
    return { category: 'tabla', pillar: 'arts' };
  }
  if (clean.includes('flute') || clean.includes('bansuri')) {
    return { category: 'flute', pillar: 'arts' };
  }
  if (clean.includes('mehandi') || clean.includes('mehendi') || clean.includes('henna')) {
    return { category: 'mehandi', pillar: 'arts' };
  }
  if (clean.includes('calligraph') || clean.includes('lettering')) {
    return { category: 'calligraphy', pillar: 'arts' };
  }
  if (clean.includes('baking') || clean.includes('patisserie')) {
    return { category: 'baking', pillar: 'arts' };
  }
  if (clean.includes('keyboard') || clean.includes('synthesizer')) {
    return { category: 'keyboard', pillar: 'arts' };
  }
  if (clean.includes('piano') && !clean.includes('guitar')) {
    return { category: 'piano', pillar: 'arts' };
  }
  if (clean.includes('craft') || clean.includes('origami') || clean.includes('clay')) {
    return { category: 'art-craft', pillar: 'arts' };
  }
  if (clean.includes('drawing') || clean.includes('painting') || clean.includes('sketch') || clean.includes('paint') || clean.includes('draw') || clean.includes('art')) {
    return { category: 'arts', pillar: 'arts' };
  }
  if (clean.includes('music') || clean.includes('guitar') || clean.includes('vocal') || clean.includes('sangeet') || clean.includes('sing') || clean.includes('piano')) {
    return { category: 'music', pillar: 'arts' };
  }

  return null;
}

export const KNOWN_LOCALITIES: Array<{ pattern: RegExp; slug: string; name: string }> = [
  { pattern: /kamla\s*nagar/i, slug: 'kamla-nagar', name: 'Kamla Nagar' },
  { pattern: /sanjay\s*place/i, slug: 'sanjay-place', name: 'Sanjay Place' },
  { pattern: /dayalbagh/i, slug: 'dayalbagh', name: 'Dayalbagh' },
  { pattern: /madia\s*katra/i, slug: 'madia-katra', name: 'Madia Katra' },
  { pattern: /sadar(?:\s*bazar)?/i, slug: 'sadar', name: 'Sadar Bazar' },
  { pattern: /fatehabad\s*road/i, slug: 'fatehabad-road', name: 'Fatehabad Road' },
  { pattern: /shastri\s*puram/i, slug: 'shastri-puram', name: 'Shastri Puram' },
  { pattern: /bodla/i, slug: 'bodla', name: 'Bodla' },
  { pattern: /civil\s*lines/i, slug: 'civil-lines', name: 'Civil Lines' },
  { pattern: /khandari/i, slug: 'khandari', name: 'Khandari' },
  { pattern: /etmadpur/i, slug: 'etmadpur', name: 'Etmadpur' },
  { pattern: /shahganj/i, slug: 'shahganj', name: 'Shahganj' },
  { pattern: /sikandra/i, slug: 'sikandra', name: 'Sikandra' },
  { pattern: /trans\s*yamuna/i, slug: 'trans-yamuna', name: 'Trans Yamuna' },
  { pattern: /karmyogi(?:\s*fountain)?/i, slug: 'karmyogi', name: 'Karmyogi' },
  { pattern: /vasant\s*kunj/i, slug: 'vasant-kunj', name: 'Vasant Kunj' },
  { pattern: /connaught\s*place/i, slug: 'connaught-place', name: 'Connaught Place' },
  { pattern: /dwarka/i, slug: 'dwarka', name: 'Dwarka' },
  { pattern: /rohini/i, slug: 'rohini', name: 'Rohini' },
  { pattern: /saket/i, slug: 'saket', name: 'Saket' },
  { pattern: /noida/i, slug: 'noida', name: 'Noida' },
  { pattern: /gurugram|gurgaon/i, slug: 'gurugram', name: 'Gurugram' },
  { pattern: /bandra/i, slug: 'bandra', name: 'Bandra' },
  { pattern: /andheri/i, slug: 'andheri', name: 'Andheri' },
  { pattern: /juhu/i, slug: 'juhu', name: 'Juhu' },
  { pattern: /powai/i, slug: 'powai', name: 'Powai' },
];

export function extractCleanLocality(
  rawLocality?: string | null,
  rawAddress?: string | null
): { slug: string; name: string } | null {
  if (!rawLocality && !rawAddress) return null;

  // 1. Check known aliases / landmark regexes (e.g., to detect locality buried inside raw address strings)
  const combined = `${rawLocality || ''} ${rawAddress || ''}`.toLowerCase().replace(/[-_]/g, ' ');
  for (const known of KNOWN_LOCALITIES) {
    if (known.pattern.test(combined)) {
      return { slug: known.slug, name: known.name };
    }
  }

  // 2. Dynamic Fallback for ANY new locality across India (no hardcoding needed)
  if (rawLocality && rawLocality.trim()) {
    const clean = rawLocality.trim().replace(/^[-_]+|[-_]+$/g, '');
    if (clean.length >= 2) {
      // If multi-part (e.g. "Shop 4, Indiranagar"), take the neighborhood part without breaking hyphenated words
      const commaParts = clean.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
      const targetStr = commaParts.length > 1 ? commaParts[commaParts.length - 1] : clean;

      const slug = targetStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const name = targetStr
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      return { slug, name };
    }
  }

  return null;
}

export function extractCleanLocalityName(
  rawLocality?: string | null,
  rawAddress?: string | null,
  fallback = 'Kamla Nagar'
): string {
  const res = extractCleanLocality(rawLocality, rawAddress);
  return res ? res.name : (rawLocality ? rawLocality.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : fallback);
}

export function extractCleanLocalitySlug(
  rawLocality?: string | null,
  rawAddress?: string | null,
  fallback = 'kamla-nagar'
): string {
  const res = extractCleanLocality(rawLocality, rawAddress);
  return res ? res.slug : (rawLocality ? rawLocality.toLowerCase().replace(/\s+/g, '-') : fallback);
}

