import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_HERO_SLIDES } from '../src/lib/hero-slides';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all mock data from KnowUrCoach database for production...');

  // 1. Delete all relational entities in reverse dependency order
  const delAttendance = await prisma.attendance.deleteMany();
  const delBooking = await prisma.booking.deleteMany();
  const delSavedCentre = await prisma.savedCentre.deleteMany();
  const delReview = await prisma.review.deleteMany();
  const delLead = await prisma.lead.deleteMany();
  const delKycInspection = await prisma.kycInspection.deleteMany();
  const delSupportTicket = await prisma.supportTicket.deleteMany();
  const delNotification = await prisma.notification.deleteMany();
  const delFacility = await prisma.facility.deleteMany();
  const delBatch = await prisma.batch.deleteMany();
  const delCompetition = await prisma.competition.deleteMany();
  const delCoachingCentre = await prisma.coachingCentre.deleteMany();
  const delChildProfile = await prisma.childProfile.deleteMany();
  const delParentProfile = await prisma.parentProfile.deleteMany();
  const delAuditLog = await prisma.auditLog.deleteMany();
  const delUsers = await prisma.user.deleteMany();

  console.log(`Deleted mock records:
    - ${delAttendance.count} attendances
    - ${delBooking.count} bookings
    - ${delSavedCentre.count} saved centres
    - ${delReview.count} reviews
    - ${delLead.count} leads
    - ${delKycInspection.count} KYC inspections
    - ${delSupportTicket.count} support tickets
    - ${delNotification.count} notifications
    - ${delFacility.count} facilities
    - ${delBatch.count} batches
    - ${delCompetition.count} competitions (tournaments)
    - ${delCoachingCentre.count} coaching centres (academies)
    - ${delChildProfile.count} child profiles
    - ${delParentProfile.count} parent profiles
    - ${delAuditLog.count} audit logs
    - ${delUsers.count} users`);

  // 2. Provision Platform Administrator from .env
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPass = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  const adminPhone = process.env.ADMIN_PHONE?.trim();

  if (!adminEmail || !adminPass || !adminPhone) {
    throw new Error(
      '❌ FATAL: Missing administrator environment variables.\n' +
      'Please ensure ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, and ADMIN_PHONE are properly defined in your .env file before running clean-prod.'
    );
  }

  const passwordHash = await bcrypt.hash(adminPass, 12);

  const adminUser = await prisma.user.create({
    data: {
      id: `usr_${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: adminEmail,
      phone: adminPhone,
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
  });
  console.log(`🛡️ Platform Administrator created from environment: ${adminUser.email} (Role: ${adminUser.role})`);

  // 3. Ensure PlatformConfig exists
  const config = await prisma.platformConfig.upsert({
    where: { id: 'default' },
    update: {
      siteName: 'KnowUrCoach',
      tagline: 'Hyperlocal Sports & Academy Discovery in Agra',
      themeColor: 'emerald',
      bgColor: 'slate',
      fontSize: 'normal',
      borderRadius: 'rounded-xl',
      allowTrialBookings: true,
      allowFreeTierPublicListing: true,
      enableFreePlan: true,
      enableStandardPlan: true,
      enablePremiumPlan: true,
      standardPlanPrice: 1499.00,
      premiumPlanPrice: 3999.00,
    },
    create: {
      id: 'default',
      siteName: 'KnowUrCoach',
      tagline: 'Hyperlocal Sports & Academy Discovery in Agra',
      themeColor: 'emerald',
      bgColor: 'slate',
      fontSize: 'normal',
      borderRadius: 'rounded-xl',
      allowTrialBookings: true,
      allowFreeTierPublicListing: true,
      enableFreePlan: true,
      enableStandardPlan: true,
      enablePremiumPlan: true,
      standardPlanPrice: 1499.00,
      premiumPlanPrice: 3999.00,
    },
  });
  console.log(`⚙️ PlatformConfig verified: ${config.siteName}`);

  // 4. Ensure System Categories exist
  const categories = [
    { name: 'Tennis & Racquet Sports', slug: 'tennis', icon: 'TennisBall', description: 'Synthetic and clay tennis courts, NIS certified coaching.' },
    { name: 'Badminton Academy', slug: 'badminton', icon: 'TennisBall', description: 'Wooden BWF-standard indoor courts with pro training.' },
    { name: 'Cricket Academy', slug: 'cricket', icon: 'Baseball', description: 'Turf wickets, bowling machines, BCCI accredited coaches.' },
    { name: 'Football & Turf Sports', slug: 'football', icon: 'SoccerBall', description: 'FIFA standard 7v7 and 5v5 astroturf floodlit arenas.' },
    { name: 'Olympic Swimming', slug: 'swimming', icon: 'Waves', description: 'Heated & 50m Olympic pools with certified lifeguards.' },
    { name: 'Martial Arts & Taekwondo', slug: 'martial-arts', icon: 'ShieldCheck', description: 'Self-defense, belt gradings, WKF championship mats.' },
    { name: 'Speed Skating Hub', slug: 'skating', icon: 'Lightning', description: 'Banked roller skating rinks with national level mentors.' },
    { name: 'STEM & Robotics Lab', slug: 'stem', icon: 'Cpu', description: 'Arduino, Lego Mindstorms, Python coding and Olympiad prep.' },
    { name: 'Vedic Maths & Abacus', slug: 'abacus', icon: 'Calculator', description: 'Mental arithmetic speed math and cognitive brain gyms.' },
    { name: 'Dance & Performing Arts', slug: 'dance', icon: 'Palette', description: 'Kathak, Bharatnatyam, Contemporary, and Hip Hop studios.' },
    { name: 'Classical Music & Sangeet', slug: 'music', icon: 'MusicNote', description: 'Vocal classical, harmonium, tabla, guitar & piano.' },
    { name: 'Fine Arts & Painting', slug: 'arts', icon: 'Palette', description: 'Sketching, watercolor, oil canvas & creative craft.' },
  ];

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const existingCat = await prisma.category.findFirst({
      where: {
        OR: [{ slug: cat.slug }, { name: cat.name }],
      },
    });

    if (existingCat) {
      await prisma.category.update({
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
      await prisma.category.create({
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
  }
  console.log(`🏷️ ${categories.length} System Categories verified.`);

  // 5. Ensure Major Activities and Disciplines exist
  const majorActivities = [
    {
      name: 'Sports & Athletics',
      slug: 'sports',
      icon: 'Trophy',
      accentColor: '#10B981',
      description: 'Physical outdoor & indoor athletic programs with verified NIS instructors.',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
      order: 1,
      disciplines: [
        { name: 'Badminton Academy', slug: 'badminton', shortDesc: 'Wooden BWF-standard indoor courts with certified mentors.', icon: 'Trophy', badge: 'Free Trial', order: 1 },
        { name: 'Tennis Academy', slug: 'tennis', shortDesc: 'Clay and synthetic hard courts for all age divisions.', icon: 'Trophy', badge: 'Free Trial', order: 2 },
        { name: 'Cricket Academy', slug: 'cricket', shortDesc: 'Turf wickets, bowling machines, and video stroke analysis.', icon: 'Trophy', badge: 'Free Trial', order: 3 },
        { name: 'Football & Turf Sports', slug: 'football', shortDesc: 'FIFA standard astroturf floodlit pitches and league training.', icon: 'Trophy', badge: 'Free Trial', order: 4 },
        { name: 'Olympic Swimming', slug: 'swimming', shortDesc: 'Temperature regulated 50m Olympic pools with certified lifeguards.', icon: 'Trophy', badge: 'Free Trial', order: 5 },
        { name: 'Martial Arts & Taekwondo', slug: 'martial-arts', icon: 'Trophy', shortDesc: 'Black belt instructors, self defense, and state tournament track.', badge: 'Free Trial', order: 6 },
        { name: 'Roller Skating', slug: 'skating', shortDesc: 'Banked speed track skating and artistic roller training.', icon: 'Trophy', badge: 'Free Trial', order: 7 },
        { name: 'Table Tennis Studio', slug: 'table-tennis', shortDesc: 'Stiga tournament tables, multi-ball drills and pro footwork.', icon: 'Trophy', badge: 'Free Trial', order: 8 },
      ],
    },
    {
      name: 'Brain Booster & STEM',
      slug: 'brain-booster',
      icon: 'Brain',
      accentColor: '#6366F1',
      description: 'Cognitive learning, robotics, mental arithmetic, and logical problem solving.',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
      order: 2,
      disciplines: [
        { name: 'STEM Robotics & Coding', slug: 'robotics', shortDesc: 'Lego EV3, Arduino, Python coding, and AI machine building.', icon: 'Brain', badge: 'Free Trial', order: 1 },
        { name: 'Vedic Maths & Abacus', slug: 'abacus', shortDesc: 'Lightning fast mental math, visualization, and cognitive memory.', icon: 'Brain', badge: 'Free Trial', order: 2 },
        { name: 'Chess Master Academy', slug: 'chess', shortDesc: 'FIDE rated coaches, tournament endgame tactics, and opening mastery.', icon: 'Brain', badge: 'Free Trial', order: 3 },
        { name: 'AI & Electronics Lab', slug: 'ai-electronics', shortDesc: 'Hands-on breadboard circuits, microcontrollers, and modern sensors.', icon: 'Brain', badge: 'Free Trial', order: 4 },
        { name: 'Rubik\'s Cube & Mental Gym', slug: 'mental-gym', shortDesc: 'Speedcubing algorithms, 3D spatial intelligence, and concentration.', icon: 'Brain', badge: 'Free Trial', order: 5 },
      ],
    },
    {
      name: 'Cultural & Fine Arts',
      slug: 'arts',
      icon: 'Palette',
      accentColor: '#EC4899',
      description: 'Creative expression, visual arts, stage performance, and classical music.',
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
      order: 3,
      disciplines: [
        { name: 'Dance Academy', slug: 'dance', shortDesc: 'Kathak, Bharatnatyam, contemporary ballet, and Western hip hop.', icon: 'Palette', badge: 'Free Trial', order: 1 },
        { name: 'Classical Music & Sangeet', slug: 'music', shortDesc: 'Hindustani classical riyaaz, harmonium, and vocal modulation.', icon: 'Palette', badge: 'Free Trial', order: 2 },
        { name: 'Instrumental Music Studio', slug: 'instruments', shortDesc: 'Acoustic guitar, keyboard synthesizers, violin, and pro staff notation.', icon: 'Palette', badge: 'Free Trial', order: 3 },
        { name: 'Fine Arts & Sketching', slug: 'fine-arts', shortDesc: 'Acrylic on canvas, watercolor, charcoal shading, and portfolio curation.', icon: 'Palette', badge: 'Free Trial', order: 4 },
        { name: 'Theatre & Public Speaking', slug: 'theatre', shortDesc: 'Voice projection, stage confidence, dramatic performance, and debate.', icon: 'Palette', badge: 'Free Trial', order: 5 },
      ],
    },
    {
      name: 'Education',
      slug: 'education',
      icon: 'GraduationCap',
      accentColor: '#F59E0B',
      description: 'Curricular excellence, Olympiad mentoring, and high-impact academic coaching.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
      order: 4,
      disciplines: [
        { name: 'Academic Coaching & Olympiads', slug: 'coaching-centres', shortDesc: 'Comprehensive foundational concept mastery for school & competitive exams.', icon: 'Sparkle', badge: 'Free Trial', order: 1 },
      ],
    },
  ];

  for (const act of majorActivities) {
    const existing = await prisma.majorActivity.findFirst({
      where: {
        OR: [{ slug: act.slug }, { name: act.name }],
      },
    });
    const activity = existing
      ? await prisma.majorActivity.update({
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
      : await prisma.majorActivity.create({
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

    for (const d of act.disciplines) {
      const existingDisc = await prisma.discipline.findFirst({
        where: {
          OR: [{ slug: d.slug }, { name: d.name, activityId: activity.id }],
        },
      });
      if (existingDisc) {
        await prisma.discipline.update({
          where: { id: existingDisc.id },
          data: {
            activityId: activity.id,
            name: d.name,
            slug: d.slug,
            shortDesc: d.shortDesc,
            imageUrl: (d as any).imageUrl || act.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
            icon: d.icon,
            badge: d.badge,
            order: d.order,
            isActive: true,
          },
        });
      } else {
        await prisma.discipline.create({
          data: {
            activityId: activity.id,
            name: d.name,
            slug: d.slug,
            shortDesc: d.shortDesc,
            imageUrl: (d as any).imageUrl || act.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
            icon: d.icon,
            badge: d.badge,
            order: d.order,
            isActive: true,
          },
        });
      }
    }
  }
  console.log(`📚 4 Major Activities and 19 Disciplines verified.`);

  // 6. Ensure Hero Carousel Slides exist
  const slideCount = await prisma.heroSlide.count();
  if (slideCount === 0) {
    for (const s of DEFAULT_HERO_SLIDES) {
      await prisma.heroSlide.create({
        data: {
          title: s.title,
          subtitle: s.subtitle,
          badge: s.badge,
          imageUrl: s.imageUrl,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
          secondaryCtaText: s.secondaryCtaText,
          secondaryCtaLink: s.secondaryCtaLink,
          accentGradient: s.accentGradient,
          order: s.order,
          isActive: s.isActive,
          showBadge: s.showBadge ?? true,
          showTitle: s.showTitle ?? true,
          showSubtitle: s.showSubtitle ?? true,
          showPrimaryCta: s.showPrimaryCta ?? true,
          showSecondaryCta: s.showSecondaryCta ?? true,
        },
      });
    }
    console.log(`🖼️ Seeded ${DEFAULT_HERO_SLIDES.length} initial hero carousel slides.`);
  }

  console.log('\n✨ Database purge & clean production seed complete!');
  console.log('✅ 0 mock academies | 0 mock tournaments | 0 mock parents');
  console.log(`✅ Platform Admin (${adminEmail}) active in PostgreSQL.\n`);
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
