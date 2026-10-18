import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SEED_CATEGORIES_DATA = [
  // Sports & Athletics
  { name: 'Lawn Tennis', slug: 'tennis', icon: 'TennisBall', description: 'Synthetic and clay tennis courts, NIS certified coaching.' },
  { name: 'Table Tennis', slug: 'table-tennis', icon: 'PingPong', description: 'Stiga tournament tables, multi-ball agility drills, national coaches.' },
  { name: 'Badminton Academy', slug: 'badminton', icon: 'TennisBall', description: 'Wooden BWF-standard indoor courts with pro training.' },
  { name: 'Cricket Academy', slug: 'cricket', icon: 'Baseball', description: 'Turf wickets, bowling machines, BCCI accredited coaches.' },
  { name: 'Handball Coaching', slug: 'handball', icon: 'SoccerBall', description: 'Fast-paced Olympic handball tactical drills and league track.' },
  { name: 'Basketball Academy', slug: 'basketball', icon: 'Basketball', description: 'FIBA standard indoor & outdoor wooden/synthetic courts.' },
  { name: 'Olympic Swimming', slug: 'swimming', icon: 'Waves', description: 'Heated & 50m Olympic pools with certified lifeguards.' },
  { name: 'Speed & Roller Skating', slug: 'skating', icon: 'Lightning', description: 'Banked roller skating rinks with national level mentors.' },
  { name: 'Gymnastics Centre', slug: 'gymnastics', icon: 'Barbell', description: 'Foam pits, balancing beams, floor acrobatic routines.' },
  { name: 'Chess Master Academy', slug: 'chess', icon: 'Crown', description: 'FIDE rated coaches, tournament endgame tactics, and opening mastery.' },
  { name: '10m Air Rifle Shooting', slug: 'shooting', icon: 'Target', description: '10m Olympic air rifle & pistol electronic targets with certified coaches.' },
  { name: 'Yoga & Mindfulness', slug: 'yoga', icon: 'Heart', description: 'Hatha, Ashtanga, pranayama, and mindful meditation.' },
  { name: 'Football & Turf Sports', slug: 'football', icon: 'SoccerBall', description: 'FIFA standard 7v7 and 5v5 astroturf floodlit arenas.' },
  { name: 'Taekwondo & Martial Arts', slug: 'taekwondo', icon: 'ShieldCheck', description: 'Self-defense, belt gradings, WKF championship mats.' },
  { name: 'Martial Arts & Combat', slug: 'martial-arts', icon: 'ShieldCheck', description: 'Self-defense, belt gradings, and combat arts.' },

  // Cultural & Fine Arts
  { name: 'Drawing & Painting', slug: 'drawing-painting', icon: 'Palette', description: 'Pencil sketching, watercolor, acrylic and oil canvas.' },
  { name: 'Dance Academy', slug: 'dance', icon: 'Palette', description: 'Kathak, Bharatnatyam, Contemporary, and Hip Hop studios.' },
  { name: 'Electronic Keyboard & Synthesizer', slug: 'keyboard', icon: 'MusicNote', description: 'Electronic synthesizer chords, scales, and staff notation music.' },
  { name: 'Classical Tabla & Percussion', slug: 'tabla', icon: 'MusicNote', description: 'Authentic Hindustani classical tabla, taal beats, teentaal riyaaz.' },
  { name: 'Acoustic & Grand Piano', slug: 'piano', icon: 'MusicNote', description: 'Classical piano lessons, Trinity College grade prep.' },
  { name: 'Bansuri & Classical Flute', slug: 'flute', icon: 'MusicNote', description: 'Hindustani bamboo bansuri, classical ragas, and melodic improvisation.' },
  { name: 'Bridal & Designer Mehendi Art', slug: 'mehandi', icon: 'Sparkle', description: 'Arabic, Rajasthani, bridal henna, modern fine-line cones.' },
  { name: 'Calligraphy & Hand Lettering', slug: 'calligraphy', icon: 'Pen', description: 'Dip pen, copperplate script, modern brush lettering.' },
  { name: 'Creative Art & Craft', slug: 'art-craft', icon: 'Scissors', description: 'Origami, clay modeling, papercraft, recycling arts.' },
  { name: 'Junior Baking & Patisserie', slug: 'baking', icon: 'CookingPot', description: 'Hands-on cupcakes, artisan breads, cookie decoration.' },
  { name: 'Classical Music & Sangeet', slug: 'music', icon: 'MusicNote', description: 'Vocal classical, harmonium, tabla, guitar & piano.' },
  { name: 'Fine Arts & Painting', slug: 'arts', icon: 'Palette', description: 'Sketching, watercolor, oil canvas & creative craft.' },

  // Brain Booster & STEM
  { name: 'Brain Gym & Cognitive Memory', slug: 'brain-gym', icon: 'Brain', description: 'Neuro-agility drills, spatial memory puzzles, speed-thinking.' },
  { name: 'Speed Handwriting & Cursive', slug: 'handwriting', icon: 'Pen', description: 'Ergonomic pencil grip, cursive penmanship, neatness correction.' },
  { name: 'Vedic Maths & Speed Abacus', slug: 'abacus', icon: 'Calculator', description: 'Lightning fast mental arithmetic, soroban visualization.' },
  { name: 'English Phonics & Reading', slug: 'phonics', icon: 'BookOpen', description: 'Jolly Phonics, letter sounds, blending, vocabulary building.' },
  { name: 'Hindi Matra Gyan & Vyakaran', slug: 'matra-gyan', icon: 'BookBookmark', description: 'Hindi varnamala, swar, vyanjan, matra pronunciation.' },
  { name: 'STEM & Robotics Lab', slug: 'stem', icon: 'Cpu', description: 'Arduino, Lego Mindstorms, Python coding and Olympiad prep.' },
];

export const SEED_MAJOR_ACTIVITIES_DATA = [
  {
    name: 'Sports & Athletics',
    slug: 'sports',
    icon: 'Trophy',
    accentColor: '#10B981',
    description: 'Physical outdoor & indoor athletic programs with verified NIS instructors.',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    order: 1,
    disciplines: [
      { name: 'Lawn Tennis', slug: 'tennis', shortDesc: 'Clay and synthetic hard courts for all age divisions.', icon: 'Trophy', badge: 'Pro Clay/Synthetic', imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80', order: 1 },
      { name: 'Table Tennis Studio', slug: 'table-tennis', shortDesc: 'Stiga tournament tables, multi-ball drills and pro footwork.', icon: 'Trophy', badge: 'Stiga Tables', imageUrl: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80', order: 2 },
      { name: 'Badminton Academy', slug: 'badminton', shortDesc: 'Wooden BWF-standard indoor courts with certified mentors.', icon: 'Trophy', badge: 'BWF Wooden Courts', imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', order: 3 },
      { name: 'Cricket Academy', slug: 'cricket', shortDesc: 'Turf wickets, bowling machines, and video stroke analysis.', icon: 'Trophy', badge: 'Turf Wickets', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80', order: 4 },
      { name: 'Handball Coaching Arena', slug: 'handball', shortDesc: 'Fast-paced Olympic handball tactical drills, agility and team track.', icon: 'Trophy', badge: 'State League Track', imageUrl: '/images/categories/handball.jpg', order: 5 },
      { name: 'Basketball Academy', slug: 'basketball', shortDesc: 'FIBA standard indoor & outdoor wooden/synthetic courts.', icon: 'Trophy', badge: 'FIBA Standard', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', order: 6 },
      { name: 'Olympic Swimming', slug: 'swimming', shortDesc: 'Temperature regulated 50m Olympic pools with certified lifeguards.', icon: 'Trophy', badge: '50m Olympic Pool', imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80', order: 7 },
      { name: 'Speed & Roller Skating', slug: 'skating', shortDesc: 'Banked speed track skating and artistic roller training.', icon: 'Trophy', badge: 'Banked Track', imageUrl: 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?auto=format&fit=crop&w=800&q=80', order: 8 },
      { name: 'Gymnastics Centre', slug: 'gymnastics', shortDesc: 'Foam pits, balancing beams, floor acrobatic routines.', icon: 'Trophy', badge: 'Foam Pit & Rings', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', order: 9 },
      { name: 'Chess Master Academy', slug: 'chess', shortDesc: 'FIDE rated coaches, tournament endgame tactics, and opening mastery.', icon: 'Trophy', badge: 'FIDE Mentors', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80', order: 10 },
      { name: '10m Air Rifle Shooting Range', slug: 'shooting', shortDesc: '10m Olympic air rifle & pistol electronic targets with certified coaches.', icon: 'Trophy', badge: 'Electronic Targets', imageUrl: '/images/categories/shooting.jpg', order: 11 },
      { name: 'Yoga & Mindfulness Centre', slug: 'yoga', shortDesc: 'Hatha, Ashtanga, pranayama, and mindful meditation for posture.', icon: 'Trophy', badge: 'Mind & Body', imageUrl: '/images/categories/yoga.jpg', order: 12 },
      { name: 'Football & Turf Sports', slug: 'football', shortDesc: 'FIFA standard astroturf floodlit pitches and league training.', icon: 'Trophy', badge: 'FIFA Astroturf', imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80', order: 13 },
      { name: 'Taekwondo & Martial Arts Hub', slug: 'taekwondo', shortDesc: 'Black belt instructors, self defense, and state tournament track.', icon: 'Trophy', badge: 'Black Belt Mentors', imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80', order: 14 },
    ],
  },
  {
    name: 'Cultural & Fine Arts',
    slug: 'arts',
    icon: 'Palette',
    accentColor: '#EC4899',
    description: 'Creative expression, visual arts, stage performance, and classical music.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    order: 2,
    disciplines: [
      { name: 'Drawing & Painting Studio', slug: 'drawing-painting', shortDesc: 'Pencil shading, watercolor, acrylic canvas, and portfolio curation.', icon: 'Palette', badge: 'Canvas & Acrylics', imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', order: 1 },
      { name: 'Dance Academy', slug: 'dance', shortDesc: 'Kathak, Bharatnatyam, contemporary ballet, and Western hip hop.', icon: 'Palette', badge: 'Classical & Hip Hop', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80', order: 2 },
      { name: 'Electronic Keyboard & Synthesizer', slug: 'keyboard', shortDesc: 'Electronic synthesizer chords, scales, and staff notation music.', icon: 'Palette', badge: 'Staff Notation', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', order: 3 },
      { name: 'Classical Tabla & Percussion', slug: 'tabla', shortDesc: 'Authentic Hindustani classical tabla, taal beats, teentaal riyaaz.', icon: 'Palette', badge: 'Taal & Riyaaz', imageUrl: '/images/categories/tabla.jpg', order: 4 },
      { name: 'Acoustic & Grand Piano', slug: 'piano', shortDesc: 'Classical piano lessons, Trinity College grade preparation.', icon: 'Palette', badge: 'Trinity Prep', imageUrl: 'https://images.unsplash.com/photo-1520523839898-5071270509a2?auto=format&fit=crop&w=800&q=80', order: 5 },
      { name: 'Bansuri & Classical Flute', slug: 'flute', shortDesc: 'Hindustani bamboo bansuri, breath control, classical ragas.', icon: 'Palette', badge: 'Classical Ragas', imageUrl: '/images/categories/flute.jpg', order: 6 },
      { name: 'Bridal & Designer Mehendi Art', slug: 'mehandi', shortDesc: 'Arabic, Rajasthani, bridal henna, modern fine-line cones.', icon: 'Palette', badge: 'Intricate Henna', imageUrl: '/images/categories/mehandi.jpg', order: 7 },
      { name: 'Calligraphy & Hand Lettering', slug: 'calligraphy', shortDesc: 'Dip pen, copperplate script, modern brush lettering.', icon: 'Palette', badge: 'Copperplate & Brush', imageUrl: '/images/categories/calligraphy.jpg', order: 8 },
      { name: 'Creative Art & Craft', slug: 'art-craft', shortDesc: 'Origami, clay modeling, papercraft, recycling arts.', icon: 'Palette', badge: 'Clay & Origami', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', order: 9 },
      { name: 'Junior Baking & Patisserie', slug: 'baking', shortDesc: 'Hands-on cupcakes, artisan breads, cookie decoration.', icon: 'Palette', badge: 'Hands-on Kitchen', imageUrl: '/images/categories/baking.jpg', order: 10 },
    ],
  },
  {
    name: 'Brain Booster & STEM',
    slug: 'brain-booster',
    icon: 'Brain',
    accentColor: '#6366F1',
    description: 'Cognitive learning, robotics, mental arithmetic, and logical problem solving.',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    order: 3,
    disciplines: [
      { name: 'Brain Gym & Cognitive Memory', slug: 'brain-gym', shortDesc: 'Neuro-agility drills, spatial memory puzzles, speed-thinking.', icon: 'Brain', badge: 'Neuro Agility', imageUrl: '/images/categories/brain-gym.jpg', order: 1 },
      { name: 'Speed Handwriting & Cursive', slug: 'handwriting', shortDesc: 'Ergonomic pencil grip, cursive penmanship, neatness correction.', icon: 'Brain', badge: 'Neat & Fast', imageUrl: '/images/categories/handwriting.jpg', order: 2 },
      { name: 'Vedic Maths & Speed Abacus', slug: 'abacus', shortDesc: 'Lightning fast mental math, visualization, and cognitive memory.', icon: 'Brain', badge: 'Lightning Math', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80', order: 3 },
      { name: 'English Phonics & Reading', slug: 'phonics', shortDesc: 'Jolly Phonics, letter sounds, blending, vocabulary building.', icon: 'Brain', badge: 'Jolly Phonics', imageUrl: '/images/categories/phonics.jpg', order: 4 },
      { name: 'Hindi Matra Gyan & Vyakaran', slug: 'matra-gyan', shortDesc: 'Hindi varnamala, swar, vyanjan, matra pronunciation.', icon: 'Brain', badge: 'Varnamala & Swar', imageUrl: '/images/categories/matra-gyan.jpg', order: 5 },
      { name: 'STEM Robotics & Coding', slug: 'robotics', shortDesc: 'Lego EV3, Arduino, Python coding, and AI machine building.', icon: 'Brain', badge: 'Free Trial', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', order: 6 },
    ],
  },
  {
    name: 'Education',
    slug: 'education',
    icon: 'GraduationCap',
    accentColor: '#F59E0B',
    description: 'Curricular excellence, Olympiad mentoring, and high-impact academic coaching.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    order: 4,
    disciplines: [
      { name: 'Academic Coaching & Olympiads', slug: 'coaching-centres', shortDesc: 'Comprehensive foundational concept mastery for school & competitive exams.', icon: 'Sparkle', badge: 'Free Trial', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', order: 1 },
    ],
  },
];

/**
 * Independently seeds or refreshes all Major Activities, Disciplines, and System Categories.
 * Unaffected by academies, carousel slides, or users.
 */
export async function seedActivitiesAndCategories(client: PrismaClient = prisma) {
  console.log('🏷️ [SEED-ACTIVITIES-CATEGORIES] Starting taxonomy bootstrap...');

  // 1. Seed prisma.category
  let catCount = 0;
  for (let i = 0; i < SEED_CATEGORIES_DATA.length; i++) {
    const cat = SEED_CATEGORIES_DATA[i];
    const existingCat = await client.category.findFirst({
      where: {
        OR: [{ slug: cat.slug }, { name: cat.name }],
      },
    });

    if (existingCat) {
      await client.category.update({
        where: { id: existingCat.id },
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          order: i + 1,
          isActive: true,
        },
      });
    } else {
      await client.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          order: i + 1,
          isActive: true,
        },
      });
    }
    catCount++;
  }
  console.log(`  ✓ Seeded/Updated ${catCount} System Categories.`);

  // 2. Seed Major Activities & Disciplines
  let actCount = 0;
  let discCount = 0;

  for (const act of SEED_MAJOR_ACTIVITIES_DATA) {
    const existing = await client.majorActivity.findFirst({
      where: {
        OR: [{ slug: act.slug }, { name: act.name }],
      },
    });

    const activity = existing
      ? await client.majorActivity.update({
          where: { id: existing.id },
          data: {
            name: act.name,
            slug: act.slug,
            icon: act.icon,
            accentColor: act.accentColor,
            description: act.description,
            imageUrl: act.imageUrl,
            order: act.order,
            isActive: true,
          },
        })
      : await client.majorActivity.create({
          data: {
            name: act.name,
            slug: act.slug,
            icon: act.icon,
            accentColor: act.accentColor,
            description: act.description,
            imageUrl: act.imageUrl,
            order: act.order,
            isActive: true,
          },
        });
    actCount++;

    for (const d of act.disciplines) {
      const existingDisc = await client.discipline.findFirst({
        where: {
          OR: [{ slug: d.slug }, { name: d.name, activityId: activity.id }],
        },
      });

      if (existingDisc) {
        await client.discipline.update({
          where: { id: existingDisc.id },
          data: {
            activityId: activity.id,
            name: d.name,
            slug: d.slug,
            shortDesc: d.shortDesc,
            imageUrl: d.imageUrl,
            icon: d.icon,
            badge: d.badge,
            order: d.order,
            isActive: true,
          },
        });
      } else {
        await client.discipline.create({
          data: {
            activityId: activity.id,
            name: d.name,
            slug: d.slug,
            shortDesc: d.shortDesc,
            imageUrl: d.imageUrl,
            icon: d.icon,
            badge: d.badge,
            order: d.order,
            isActive: true,
          },
        });
      }
      discCount++;
    }
  }

  console.log(`✅ [SEED-ACTIVITIES-CATEGORIES] Finished: ${actCount} Major Activities and ${discCount} Disciplines active.`);
  return { catCount, actCount, discCount };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('seed-activities-categories')) {
  seedActivitiesAndCategories()
    .catch((err) => {
      console.error('❌ [SEED-ACTIVITIES-CATEGORIES] Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
