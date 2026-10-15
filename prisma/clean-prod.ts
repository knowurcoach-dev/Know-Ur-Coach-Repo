import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all mock data from KnowUrCoach database for production...');

  // 1. Delete all transactional, relational and entity records in reverse dependency order
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

  // 2. Delete all users cleanly
  const delUsers = await prisma.user.deleteMany();

  console.log(`Deleted:
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
    - ${delCompetition.count} competitions
    - ${delCoachingCentre.count} coaching centres
    - ${delChildProfile.count} child profiles
    - ${delParentProfile.count} parent profiles
    - ${delAuditLog.count} audit logs
    - ${delUsers.count} users`);

  // 3. Create official Platform Admin credentials in PostgreSQL
  const adminUser = await prisma.user.create({
    data: {
      id: 'usr-platform-admin',
      phone: '+91 97625 77714',
      email: 'admin@knowurcoach.in',
      role: Role.ADMIN,
      passwordHash: 'Admin@Agra2026!',
      isActive: true,
    },
  });

  console.log(`🛡️ Platform Admin created: ${adminUser.email} (Role: ${adminUser.role})`);

  // 4. Ensure PlatformConfig exists
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
  console.log(`⚙️ PlatformConfig verified: ${config.id}`);

  // 5. Ensure System Sport & Activity Categories exist
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
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        order: i + 1,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        order: i + 1,
        isActive: true,
      },
    });
  }
  console.log(`🏷️ ${categories.length} System Categories verified for coach onboarding.`);
  console.log('✨ Production database reset complete: 0 mock entries, Platform Admin active!');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
