import { PrismaClient, Role, SafetyGrade, KycStatus, PassType, EscrowStatus, TicketCategory, CoachType, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KnowUrCoach Agra production database seed...');

  // ==========================================
  // CLEAN EXISTING DATA IN REVERSE DEPENDENCY ORDER
  // ==========================================
  await prisma.attendance.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.savedCentre.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.kycInspection.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.coachingCentre.deleteMany();
  await prisma.childProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.platformConfig.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentSettings.deleteMany();

  console.log('🧹 Cleaned all existing tables.');

  // ==========================================
  // 0. SEED PLATFORM CONFIG & SYSTEM CATEGORIES
  // ==========================================
  await prisma.platformConfig.create({
    data: {
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
      freePlanFeatures: JSON.stringify([
        'Public academy profile with address & verified badge',
        'Up to 2 active sport batches with seat tracking',
        'Direct parent inquiries and chat leads',
        'Digital free trial booking management',
      ]),
      standardPlanFeatures: JSON.stringify([
        'Everything in Free Tier',
        'Featured ranking in search & category exploration',
        'Up to 8 active batches with schedule management',
        'Live parent attendance QR verification scanner',
        'Automated WhatsApp & SMS parent notifications',
        'Priority KYC on-ground safety audit verification',
      ]),
      premiumPlanFeatures: JSON.stringify([
        'Everything in Standard Tier',
        'Guaranteed Top 3 "Top in Area" verified banner',
        'Unlimited batches & specialized tournament hosting',
        'Automated tuition fee escrow payouts to bank',
        'Dedicated relationship manager & seasonal campaign blasts',
        'Multi-coach staff access & safety compliance dossier',
      ]),
    },
  });

  await prisma.paymentSettings.create({
    data: {
      id: 'default',
      razorpayTestKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TllUCnsrU8NX1s',
      razorpayTestKeySecret: process.env.RAZORPAY_KEY_SECRET || '8O1t77GVUE7WntTbfv3k4jkF',
      razorpayLiveKeyId: null,
      razorpayLiveKeySecret: null,
      isTestMode: true,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_agra',
    },
  });

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
  console.log('✅ Seeded PlatformConfig and 12 Categories.');

  // ==========================================
  // 1. SEED USERS & PERSONAS (PROD-LIKE)
  // ==========================================

  // Super Admin (Platform Inspector Er. S. Rawat)
  const adminUser = await prisma.user.create({
    data: {
      id: 'usr-platform-admin',
      phone: '+91 97625 77714',
      email: 'admin@knowurcoach.in',
      role: Role.ADMIN,
      passwordHash: 'Admin@Agra2026!',
      isActive: true,
      notifications: {
        create: [
          {
            title: '3 Academies Awaiting Physical Audit',
            message: 'Er. S. Rawat assigned for on-ground safety inspections in Kamla Nagar and Sadar Cantt.',
            type: 'kyc',
          },
          {
            title: 'Safety Compliance 100%',
            message: 'All 8 active verified centers audited for 24/7 CCTV surveillance, female attendant, and certified mentors.',
            type: 'audit',
            isRead: true,
          },
          {
            title: 'Coach Subscriptions Active',
            message: '₹22,990 collected via Razorpay for Standard & Premium coach SaaS tier renewals this cycle.',
            type: 'payment',
            isRead: true,
          },
        ],
      },
    },
  });

  // Secondary Admin alias for testing
  await prisma.user.create({
    data: {
      id: 'usr-admin-rawat',
      phone: '+91 97625 77715',
      email: 'admin.rawat@knowurcoach.com',
      role: Role.ADMIN,
      passwordHash: 'Admin@Agra2026!',
      isActive: true,
    },
  });

  // Parent 1: Pooja Sharma (Kamla Nagar, Agra) - Mother of Aarav & Ananya
  const parentPooja = await prisma.user.create({
    data: {
      id: 'usr-parent-pooja',
      phone: '+91 98370 45678',
      email: 'pooja.sharma@gmail.com',
      role: Role.PARENT,
      isActive: true,
      parentProfile: {
        create: {
          fullName: 'Pooja Sharma',
          locality: 'Kamla Nagar',
          city: 'Agra',
          emergencyContactName: 'Dr. Rajesh Sharma',
          emergencyContactPhone: '+91 98370 12345',
          children: {
            create: [
              {
                id: 'child-aarav',
                fullName: 'Aarav Sharma',
                age: 10,
                grade: 'Grade 5',
                interests: ['tennis', 'badminton', 'chess'],
              },
              {
                id: 'child-ananya',
                fullName: 'Ananya Sharma',
                age: 8,
                grade: 'Grade 3',
                interests: ['abacus', 'art', 'dance'],
              },
            ],
          },
        },
      },
      notifications: {
        create: [
          {
            title: "Aarav's Tennis Trial Tomorrow",
            message: 'Ace Sports Academy Court 2 at 4:00 PM. Tap to view your verified QR Entry Pass.',
            type: 'session',
          },
          {
            title: 'Zero Platform Fee Guarantee Active',
            message: '100% Free Trial booking confirmed with zero platform or convenience fees.',
            type: 'session',
            isRead: true,
          },
          {
            title: 'Agra District Youth Badminton Open 2026',
            message: 'Under-11 preliminary draw brackets released for Eklavya Stadium.',
            type: 'competition',
            isRead: true,
          },
        ],
      },
    },
    include: {
      parentProfile: {
        include: {
          children: true,
        },
      },
    },
  });

  // Parent 2: Dr. Arvind Saxena (Sanjay Place, Agra) - Father of Kabir
  const parentSaxena = await prisma.user.create({
    data: {
      id: 'usr-parent-saxena',
      phone: '+91 94122 88412',
      email: 'arvind.saxena@gmail.com',
      role: Role.PARENT,
      isActive: true,
      parentProfile: {
        create: {
          fullName: 'Dr. Arvind Saxena',
          locality: 'Sanjay Place',
          city: 'Agra',
          emergencyContactName: 'Sunita Saxena',
          emergencyContactPhone: '+91 94122 88413',
          children: {
            create: [
              {
                id: 'child-kabir',
                fullName: 'Kabir Saxena',
                age: 11,
                grade: 'Grade 6',
                interests: ['badminton', 'swimming'],
              },
            ],
          },
        },
      },
    },
    include: {
      parentProfile: {
        include: {
          children: true,
        },
      },
    },
  });

  // Parent 3: Meenakshi Agarwal (Dayalbagh, Agra) - Mother of Vivaan
  const parentMeenakshi = await prisma.user.create({
    data: {
      id: 'usr-parent-meenakshi',
      phone: '+91 98972 33445',
      email: 'meenakshi.agarwal@gmail.com',
      role: Role.PARENT,
      isActive: true,
      parentProfile: {
        create: {
          fullName: 'Meenakshi Agarwal',
          locality: 'Dayalbagh',
          city: 'Agra',
          emergencyContactName: 'Gaurav Agarwal',
          emergencyContactPhone: '+91 98972 33446',
          children: {
            create: [
              {
                id: 'child-vivaan',
                fullName: 'Vivaan Agarwal',
                age: 9,
                grade: 'Grade 4',
                interests: ['football', 'robotics'],
              },
            ],
          },
        },
      },
    },
    include: {
      parentProfile: {
        include: {
          children: true,
        },
      },
    },
  });

  // Coach 1: Rajesh Mehra (Ace Sports Academy - Tennis)
  const coachAce = await prisma.user.create({
    data: {
      id: 'usr-coach-ace',
      phone: '+91 98370 23456',
      email: 'coach.rajesh@acesports.com',
      role: Role.COACH,
      isActive: true,
      notifications: {
        create: [
          {
            title: 'New Parent Inquiry Received',
            message: 'Pooja Sharma requested a free trial for Aarav (10 Yrs) in Junior Beginners Tennis.',
            type: 'lead',
          },
          {
            title: 'Court 2 Live Check-Ins',
            message: '10 students scanned their digital session passes for today 4:00 PM batch.',
            type: 'attendance',
          },
          {
            title: 'Razorpay Premium Subscription Active',
            message: 'Your annual Premium SaaS plan has been renewed (ID: sub_RzpAce998124).',
            type: 'payment',
            isRead: true,
          },
        ],
      },
    },
  });

  // Coach 2: Rashmi Bansal (MasterMind Abacus)
  const coachMastermind = await prisma.user.create({
    data: {
      id: 'usr-coach-mastermind',
      phone: '+91 94122 34567',
      email: 'rashmi@mastermind.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 3: Arvind Yadav (Agra Aquatics)
  const coachAquatics = await prisma.user.create({
    data: {
      id: 'usr-coach-aquatics',
      phone: '+91 98971 67890',
      email: 'arvind@agraaquatics.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 4: Sharda Dixit (Tansen Sangeet)
  const coachTansen = await prisma.user.create({
    data: {
      id: 'usr-coach-tansen',
      phone: '+91 94560 11223',
      email: 'sharda@tansensangeet.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 5: Rohan Agarwal (RoboChamps STEM)
  const coachRobochamps = await prisma.user.create({
    data: {
      id: 'usr-coach-robochamps',
      phone: '+91 97600 88990',
      email: 'rohan@robochamps.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 6: Sandeep Minhas (Taj Tigers Football)
  const coachTajTigers = await prisma.user.create({
    data: {
      id: 'usr-coach-tajtigers',
      phone: '+91 98371 55667',
      email: 'sandeep@tajtigers.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 7: Deepak Rawat (Samurai Dojo Karate)
  const coachSamurai = await prisma.user.create({
    data: {
      id: 'usr-coach-samurai',
      phone: '+91 98372 44332',
      email: 'deepak@samuraidojo.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 8: Neha Kapoor (Rhythm & Beats)
  const coachRhythm = await prisma.user.create({
    data: {
      id: 'usr-coach-rhythm',
      phone: '+91 98973 22114',
      email: 'neha@rhythmandbeats.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 9: Rohit Sharma (Taj Champions Cricket - Bodla)
  const coachCricket = await prisma.user.create({
    data: {
      id: 'usr-coach-cricket',
      phone: '+91 98379 11001',
      email: 'rohit.cricket@tajchampions.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 10: Vikas Verma (Speed Wings Skating - Sanjay Place)
  const coachSkating = await prisma.user.create({
    data: {
      id: 'usr-coach-skating',
      phone: '+91 98379 22002',
      email: 'vikas.skating@speedwings.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 11: Shakti Singh (Apex Combat - Shastri Puram)
  const coachMma = await prisma.user.create({
    data: {
      id: 'usr-coach-mma',
      phone: '+91 98379 33003',
      email: 'shakti.mma@apexcombat.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  // Coach 12: Amit Gupta (Agra Shuttle Zone - Kamla Nagar)
  const coachShuttle = await prisma.user.create({
    data: {
      id: 'usr-coach-shuttle',
      phone: '+91 98379 44004',
      email: 'amit.shuttle@agrashuttle.com',
      role: Role.COACH,
      isActive: true,
    },
  });

  console.log('✅ Seeded users and authentic personas (Admin, Parents, Coaches).');

  // ==========================================
  // 2. SEED 12 AGRA COACHING CENTRES (REALISTIC SAAS AUDIT DATA)
  // ==========================================

  // 1. Ace Sports Academy (Premium, Approved, Flagship)
  const acadAce = await prisma.coachingCentre.create({
    data: {
      id: 'acad-ace',
      ownerUserId: coachAce.id,
      name: 'Ace Sports Academy',
      tagline: 'Premier Tennis, Badminton & Squash Facility in Agra',
      category: 'tennis',
      locality: 'kamla-nagar',
      address: 'Sector 4, Central Avenue, Kamla Nagar, Agra (Opp. St. Conrads)',
      phone: '+91 98370 23456',
      rating: 4.9,
      reviewsCount: 128,
      monthlyTuitionFee: 1800.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 17 Yrs (Batches grouped by skill & age)',
      headCoachName: 'Rajesh Mehra',
      headCoachBio: 'NIS Certified, Ex-National Tennis Player, 14 Yrs Coaching Experience',
      coachesCount: 4,
      studentCoachRatio: '1 : 6',
      latitude: 27.2144,
      longitude: 78.0123,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      planPaymentId: 'pay_RzpAce998124',
      planPurchasedAt: new Date('2026-01-15T10:00:00Z'),
      planExpiresAt: new Date('2027-01-15T10:00:00Z'),
      planBillingCycle: 'annual',
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: '4 International-Standard Synthetic Tennis Courts with LED floodlighting' },
          { description: '3 Wooden BWF-standard indoor Badminton Courts' },
          { description: 'Dedicated physical fitness & agility training zone' },
          { description: 'Clean changing rooms, lockers & RO filtered water stations' },
          { description: '24/7 CCTV surveillance throughout premises with parent monitor' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-ace-junior',
            name: 'Junior Beginners Tennis (Ages 5-8)',
            schedule: 'Mon, Wed, Fri • 4:00 PM - 5:15 PM',
            ageGroup: '5-8 Yrs',
            totalSeats: 12,
            seatsFilled: 10,
            monthlyFee: 1800.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-ace-cadet',
            name: 'Cadet Tennis (Ages 9-13)',
            schedule: 'Mon, Wed, Fri • 5:30 PM - 6:45 PM',
            ageGroup: '9-13 Yrs',
            totalSeats: 12,
            seatsFilled: 9,
            monthlyFee: 1800.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-ace-weekend',
            name: 'Weekend Intensive Squad',
            schedule: 'Sat & Sun • 7:00 AM - 9:00 AM',
            ageGroup: '10-16 Yrs',
            totalSeats: 8,
            seatsFilled: 8,
            monthlyFee: 2200.00,
            isAdmissionsOpen: false,
          },
        ],
      },
    },
  });

  // 2. MasterMind Brain Gym & Abacus (Standard, Approved)
  const acadMastermind = await prisma.coachingCentre.create({
    data: {
      id: 'acad-mastermind',
      ownerUserId: coachMastermind.id,
      name: 'MasterMind Brain Gym & Abacus',
      tagline: 'Cognitive Development, Mental Arithmetic & Vedic Maths',
      category: 'abacus',
      locality: 'sanjay-place',
      address: 'Block B, 2nd Floor, Commercial Complex, Sanjay Place, Agra',
      phone: '+91 94122 34567',
      rating: 4.9,
      reviewsCount: 86,
      monthlyTuitionFee: 1200.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 14 Yrs (Soroban Abacus & Vedic Mathematics)',
      headCoachName: 'Smt. Rashmi Bansal',
      headCoachBio: 'International Abacus Trainer, Brain Gym Gold Medalist',
      coachesCount: 3,
      studentCoachRatio: '1 : 8',
      latitude: 27.1995,
      longitude: 78.0062,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpMst441290',
      planPurchasedAt: new Date('2026-09-01T10:00:00Z'),
      planExpiresAt: new Date('2026-10-31T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'Full Air-Conditioned interactive smart classrooms' },
          { description: 'Individual Japanese Soroban Abacus toolkits provided' },
          { description: 'Speed arithmetic software testing workstations' },
          { description: 'Parent waiting lounge with live CCTV viewing screens' },
          { description: 'Periodic regional Olympiad competition prep' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-mastermind-little',
            name: 'Little Champs Abacus (Ages 4-7)',
            schedule: 'Tue & Thu • 4:30 PM - 6:00 PM',
            ageGroup: '4-7 Yrs',
            totalSeats: 10,
            seatsFilled: 6,
            monthlyFee: 1200.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-mastermind-speed',
            name: 'Speed Vedic Maths (Ages 8-14)',
            schedule: 'Sat & Sun • 10:00 AM - 11:30 AM',
            ageGroup: '8-14 Yrs',
            totalSeats: 12,
            seatsFilled: 11,
            monthlyFee: 1200.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 3. Agra Aquatics & Swimming Academy (Premium, Approved)
  const acadAquatics = await prisma.coachingCentre.create({
    data: {
      id: 'acad-aquatics',
      ownerUserId: coachAquatics.id,
      name: 'Agra Aquatics & Swimming Academy',
      tagline: 'Temperature Controlled Olympic Pool & Youth Water Polo',
      category: 'swimming',
      locality: 'sadar',
      address: 'Cantt Sports Enclave, Near Sadar Bazar Post Office, Agra',
      phone: '+91 98971 67890',
      rating: 4.8,
      reviewsCount: 94,
      monthlyTuitionFee: 2200.00,
      trialFee: 0.00,
      eligibleAgeGroup: '5 - 18 Yrs (Beginner to State Level)',
      headCoachName: 'Coach Arvind Yadav',
      headCoachBio: 'UP State Aquatic Certified Coach, FINA Level 2',
      coachesCount: 3,
      studentCoachRatio: '1 : 7',
      latitude: 27.1592,
      longitude: 78.0069,
      safetyGrade: SafetyGrade.GRADE_A,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      planPaymentId: 'pay_RzpAqua88721',
      planPurchasedAt: new Date('2026-02-10T10:00:00Z'),
      planExpiresAt: new Date('2027-02-10T10:00:00Z'),
      planBillingCycle: 'annual',
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: '50m 8-Lane Olympic Swimming Pool with UV filtration' },
          { description: 'Certified lifeguards and life-saving AED equipment on deck' },
          { description: 'Dedicated toddler splash pool (2ft depth)' },
          { description: 'Heated pool during winter training months' },
          { description: 'Individual private changing stalls with warm showers' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-aqua-grassroots',
            name: 'Grassroots Fundamentals (Ages 5-9)',
            schedule: 'Mon, Wed, Fri • 4:00 PM - 5:15 PM',
            ageGroup: '5-9 Yrs',
            totalSeats: 15,
            seatsFilled: 10,
            monthlyFee: 2200.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-aqua-competitive',
            name: 'Intermediate Competitive (Ages 10-16)',
            schedule: 'Mon, Wed, Fri • 5:30 PM - 7:00 PM',
            ageGroup: '10-16 Yrs',
            totalSeats: 12,
            seatsFilled: 10,
            monthlyFee: 2200.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 4. Tansen Sangeet Mahavidyalaya (Standard, Approved)
  const acadTansen = await prisma.coachingCentre.create({
    data: {
      id: 'acad-tansen',
      ownerUserId: coachTansen.id,
      name: 'Tansen Sangeet Mahavidyalaya',
      tagline: 'Classical Kathak, Bharatnatyam, Vocal & Traditional Arts',
      category: 'music',
      locality: 'sanjay-place',
      address: 'Civil Lines Road, Near District Court, Sanjay Place, Agra',
      phone: '+91 94560 11223',
      rating: 4.8,
      reviewsCount: 72,
      monthlyTuitionFee: 1500.00,
      trialFee: 0.00,
      eligibleAgeGroup: '5 - 18 Yrs (Certified Examination Syllabus)',
      headCoachName: 'Vidushi Sharda Dixit',
      headCoachBio: 'Kathak Kendra Alumna, Disciple of Pt. Birju Maharaj',
      coachesCount: 4,
      studentCoachRatio: '1 : 8',
      latitude: 27.1988,
      longitude: 78.0055,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpTan55219',
      planPurchasedAt: new Date('2026-09-15T10:00:00Z'),
      planExpiresAt: new Date('2026-10-15T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'Teakwood sprung dance floor for joint safety and sound resonance' },
          { description: 'Full-length wall mirrors for posture calibration' },
          { description: 'Live accompaniment with Tabla & Harmonium masters' },
          { description: 'Affiliated examination center for Prayag Sangeet Samiti' },
          { description: 'Annual youth cultural stage recital at Agra Auditorium' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-tansen-kathak',
            name: 'Prarambhik Kathak & Rhythm (Ages 5-9)',
            schedule: 'Mon, Wed, Fri • 4:00 PM - 5:00 PM',
            ageGroup: '5-9 Yrs',
            totalSeats: 12,
            seatsFilled: 8,
            monthlyFee: 1500.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-tansen-art',
            name: 'Fine Arts & Water Color Painting',
            schedule: 'Tue & Thu • 4:30 PM - 6:00 PM',
            ageGroup: '6-14 Yrs',
            totalSeats: 10,
            seatsFilled: 7,
            monthlyFee: 1300.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 5. RoboChamps STEM & Robotics Lab (Premium, Approved)
  const acadRobochamps = await prisma.coachingCentre.create({
    data: {
      id: 'acad-robochamps',
      ownerUserId: coachRobochamps.id,
      name: 'RoboChamps STEM & Robotics Lab',
      tagline: 'Hands-on Robotics, Scratch Coding & AI for Young Creators',
      category: 'stem',
      locality: 'kamla-nagar',
      address: 'MG Road Extension, Near Water Works, Kamla Nagar, Agra',
      phone: '+91 97600 88990',
      rating: 4.9,
      reviewsCount: 52,
      monthlyTuitionFee: 2400.00,
      trialFee: 0.00,
      eligibleAgeGroup: '7 - 16 Yrs (Grade 2 to Grade 10)',
      headCoachName: 'Er. Rohan Agarwal',
      headCoachBio: 'M.Tech IIT Delhi, Robotics & IoT Mentor',
      coachesCount: 3,
      studentCoachRatio: '1 : 6',
      latitude: 27.2185,
      longitude: 78.0162,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      planPaymentId: 'pay_RzpRobo11223',
      planPurchasedAt: new Date('2026-03-01T10:00:00Z'),
      planExpiresAt: new Date('2027-03-01T10:00:00Z'),
      planBillingCycle: 'annual',
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'Individual Arduino, ESP32 & Raspberry Pi hardware stations' },
          { description: 'Lego Mindstorms & robotic obstacle arena' },
          { description: 'High-spec dual-monitor programming workstations' },
          { description: '3D printing & basic laser prototyping corner' },
          { description: 'National Robotics Olympiad (NRO) mentorship cell' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-robo-junior',
            name: 'Junior Robotics & Block Coding (Ages 7-10)',
            schedule: 'Wed & Fri • 4:30 PM - 6:00 PM',
            ageGroup: '7-10 Yrs',
            totalSeats: 8,
            seatsFilled: 5,
            monthlyFee: 2400.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-robo-python',
            name: 'Python & Autonomous Bots (Ages 11-16)',
            schedule: 'Saturday • 3:00 PM - 6:00 PM',
            ageGroup: '11-16 Yrs',
            totalSeats: 8,
            seatsFilled: 6,
            monthlyFee: 2800.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 6. Taj Tigers Youth Football Academy (Standard, Approved)
  const acadTajTigers = await prisma.coachingCentre.create({
    data: {
      id: 'acad-taj-tigers',
      ownerUserId: coachTajTigers.id,
      name: 'Taj Tigers Youth Football Academy',
      tagline: 'Youth Football Training, Ball Mastery & Team Tactics',
      category: 'football',
      locality: 'dayalbagh',
      address: 'DEI Ground Road, Dayalbagh, Agra',
      phone: '+91 98371 55667',
      rating: 4.8,
      reviewsCount: 91,
      monthlyTuitionFee: 1600.00,
      trialFee: 0.00,
      eligibleAgeGroup: '6 - 17 Yrs (Age Categorized Batches)',
      headCoachName: 'Coach Sandeep Minhas',
      headCoachBio: "AIFF / AFC 'B' License, Former National Player",
      coachesCount: 4,
      studentCoachRatio: '1 : 10',
      latitude: 27.2289,
      longitude: 78.0094,
      safetyGrade: SafetyGrade.GRADE_A,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpTig33441',
      planPurchasedAt: new Date('2026-09-20T10:00:00Z'),
      planExpiresAt: new Date('2026-10-20T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'FIFA-Standard 7v7 and 5v5 astroturf floodlit football ground' },
          { description: 'Professional agility cones, speed ladders, resistance bands' },
          { description: 'Quarterly inter-district friendly matches and exposure tournaments' },
          { description: 'On-field first-aider and certified youth sports trainer' },
          { description: 'Pure chilled mineral water station and player dressing rooms' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-tigers-cubs',
            name: 'Under-10 Cubs Grassroots',
            schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM',
            ageGroup: '6-10 Yrs',
            totalSeats: 16,
            seatsFilled: 13,
            monthlyFee: 1600.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-tigers-cadet',
            name: 'Under-14 Youth Academy League',
            schedule: 'Tue, Thu, Sat • 5:30 PM - 7:00 PM',
            ageGroup: '11-14 Yrs',
            totalSeats: 16,
            seatsFilled: 14,
            monthlyFee: 1600.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 7. Samurai Shotokan Karate Dojo (Standard, Approved)
  const acadSamurai = await prisma.coachingCentre.create({
    data: {
      id: 'acad-samurai',
      ownerUserId: coachSamurai.id,
      name: 'Samurai Shotokan Karate Dojo',
      tagline: 'Self Defense, Discipline, Kata & Kumite Championship Training',
      category: 'martial-arts',
      locality: 'sadar',
      address: 'Sadar Cantt Complex, Near Agra Cantt Railway Station, Agra',
      phone: '+91 98372 44332',
      rating: 4.9,
      reviewsCount: 105,
      monthlyTuitionFee: 1400.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 16 Yrs (White to Black Belt Progression)',
      headCoachName: 'Sensei Deepak Rawat',
      headCoachBio: '5th Dan Black Belt, WKF Certified Judge',
      coachesCount: 3,
      studentCoachRatio: '1 : 8',
      latitude: 27.1578,
      longitude: 78.0051,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpSam77889',
      planPurchasedAt: new Date('2026-08-01T10:00:00Z'),
      planExpiresAt: new Date('2026-11-01T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: '1,500 sq ft padded competition Tatami foam floor mats' },
          { description: 'Heavy punching bags, kicking shields & focus pads' },
          { description: 'Complete safety gear provided during trial classes' },
          { description: 'Official belt gradation recognized by UP Sports Authority' },
          { description: 'Special female safety & anti-bullying workshop included' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-samurai-little',
            name: 'Little Ninjas (Ages 4-7)',
            schedule: 'Mon, Wed, Fri • 4:30 PM - 5:30 PM',
            ageGroup: '4-7 Yrs',
            totalSeats: 12,
            seatsFilled: 8,
            monthlyFee: 1400.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-samurai-fighters',
            name: 'Junior Belt Fighters (Ages 8-15)',
            schedule: 'Mon, Wed, Fri • 5:45 PM - 7:00 PM',
            ageGroup: '8-15 Yrs',
            totalSeats: 12,
            seatsFilled: 10,
            monthlyFee: 1400.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 8. Rhythm & Beats Dance Studio (Standard, Approved)
  const acadRhythm = await prisma.coachingCentre.create({
    data: {
      id: 'acad-rhythm',
      ownerUserId: coachRhythm.id,
      name: 'Rhythm & Beats Dance Studio',
      tagline: 'Hip Hop, Contemporary, Bollywood & Freestyle Dance Studio',
      category: 'dance',
      locality: 'fatehabad-road',
      address: 'Tourism Hub Plaza, Fatehabad Road, Agra (Near TDI Mall)',
      phone: '+91 98973 22114',
      rating: 4.7,
      reviewsCount: 64,
      monthlyTuitionFee: 1700.00,
      trialFee: 0.00,
      eligibleAgeGroup: '5 - 16 Yrs (Beginners to Advanced Dancers)',
      headCoachName: 'Neha Kapoor',
      headCoachBio: 'Shiamak Davar Certified Instructor, TV Reality Finalist',
      coachesCount: 3,
      studentCoachRatio: '1 : 8',
      latitude: 27.1611,
      longitude: 78.0465,
      safetyGrade: SafetyGrade.GRADE_A,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpRhy66554',
      planPurchasedAt: new Date('2026-09-10T10:00:00Z'),
      planExpiresAt: new Date('2026-10-10T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'Shock-absorbent maple hardwood sprung dance floors' },
          { description: 'Full-length 30-foot acoustic mirror walls' },
          { description: 'JBL surround acoustic sound system with child-friendly playlist' },
          { description: 'Changing rooms and separate parental lounge' },
          { description: 'Annual showcase choreography video recorded in 4K' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-rhythm-junior',
            name: 'Junior Hip Hop & Grooves (Ages 5-9)',
            schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM',
            ageGroup: '5-9 Yrs',
            totalSeats: 12,
            seatsFilled: 9,
            monthlyFee: 1700.00,
            isAdmissionsOpen: true,
          },
          {
            id: 'batch-rhythm-contemporary',
            name: 'Contemporary & Freestyle (Ages 10-16)',
            schedule: 'Tue, Thu, Sat • 5:30 PM - 6:45 PM',
            ageGroup: '10-16 Yrs',
            totalSeats: 12,
            seatsFilled: 10,
            monthlyFee: 1700.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 9. Taj Champions Cricket Academy (Standard, PENDING Audit)
  const acadCricket = await prisma.coachingCentre.create({
    data: {
      id: 'acad-cricket-agra',
      ownerUserId: coachCricket.id,
      name: 'Taj Champions Cricket Academy',
      tagline: 'Professional Turf Nets, Bowling Machines & BCCI Level-2 Coaching',
      category: 'cricket',
      locality: 'bodla',
      address: 'Near Maruti Estate, Bodla Crossing, Agra',
      phone: '+91 98379 11001',
      rating: 4.6,
      reviewsCount: 38,
      monthlyTuitionFee: 2000.00,
      trialFee: 0.00,
      eligibleAgeGroup: '6 - 19 Yrs',
      headCoachName: 'Rohit Sharma (NIS)',
      headCoachBio: 'Former Ranji Trophy Player, BCCI Level 2 Accredited Coach',
      coachesCount: 3,
      studentCoachRatio: '1 : 8',
      latitude: 27.1852,
      longitude: 77.9621,
      safetyGrade: SafetyGrade.PENDING_AUDIT,
      kycStatus: KycStatus.PENDING,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      planPaymentId: 'pay_RzpCrk99001',
      planPurchasedAt: new Date('2026-09-28T10:00:00Z'),
      planExpiresAt: new Date('2026-10-28T10:00:00Z'),
      planBillingCycle: 'monthly',
      isTopInArea: false,
      isVerifiedBatch: false,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: false,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: '4 Natural Turf practice pitches and 2 AstroTurf bounce tracks' },
          { description: 'Automated programmable bowling machines with video analysis' },
          { description: 'Floodlit evening net sessions with white and pink balls' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-cricket-colts',
            name: 'Grassroots Colts Cricket (Ages 7-12)',
            schedule: 'Mon, Wed, Fri • 4:00 PM - 6:00 PM',
            ageGroup: '7-12 Yrs',
            totalSeats: 15,
            seatsFilled: 8,
            monthlyFee: 2000.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 10. Speed Wings Roller Skating Club (Free Tier, REFERRED_BACK)
  await prisma.coachingCentre.create({
    data: {
      id: 'acad-verma-skating',
      ownerUserId: coachSkating.id,
      name: 'Speed Wings Roller Skating Club',
      tagline: 'Speed, Inline & Artistic Roller Skating Academy',
      category: 'skating',
      locality: 'sanjay-place',
      address: 'Opp. LIC Building, Commercial Arena, Sanjay Place, Agra',
      phone: '+91 98379 22002',
      rating: 4.5,
      reviewsCount: 22,
      monthlyTuitionFee: 1500.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 14 Yrs',
      headCoachName: 'Vikas Verma',
      headCoachBio: 'State Skating Gold Medalist, 8 Yrs Training Young Champions',
      coachesCount: 2,
      studentCoachRatio: '1 : 6',
      latitude: 27.2012,
      longitude: 78.0089,
      safetyGrade: SafetyGrade.GRADE_B,
      kycStatus: KycStatus.REFERRED_BACK,
      referredBackRemarks: 'Please submit 30-day CCTV DVR backup proof and updated first-aid kit photos before final approval.',
      coachType: CoachType.INDIVIDUAL,
      planTier: SubscriptionPlan.FREE,
      isTopInArea: false,
      isVerifiedBatch: false,
      cctvMonitored: false,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: {
        create: [
          { description: 'Smooth polyurethane coated 200m banked skating track' },
          { description: 'Protective knee/elbow pads and helmets provided for beginners' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-skating-tots',
            name: 'Tiny Tots Roller Starters (Ages 4-8)',
            schedule: 'Tue, Thu, Sat • 5:00 PM - 6:15 PM',
            ageGroup: '4-8 Yrs',
            totalSeats: 10,
            seatsFilled: 5,
            monthlyFee: 1500.00,
            isAdmissionsOpen: true,
          },
        ],
      },
    },
  });

  // 11. Apex Combat & Fitness Gym (Free Tier, REJECTED)
  await prisma.coachingCentre.create({
    data: {
      id: 'acad-shakti-mma',
      ownerUserId: coachMma.id,
      name: 'Apex Combat & Fitness Gym',
      tagline: 'MMA, Kickboxing & High-Intensity Conditioning',
      category: 'martial-arts',
      locality: 'shastri-puram',
      address: 'Main Market Sector C, Shastri Puram, Agra',
      phone: '+91 98379 33003',
      rating: 4.2,
      reviewsCount: 14,
      monthlyTuitionFee: 2200.00,
      trialFee: 0.00,
      eligibleAgeGroup: '12 - 20 Yrs',
      headCoachName: 'Shakti Singh',
      headCoachBio: 'District Kickboxing Medalist',
      coachesCount: 1,
      studentCoachRatio: '1 : 12',
      latitude: 27.2088,
      longitude: 77.9455,
      safetyGrade: SafetyGrade.GRADE_B,
      kycStatus: KycStatus.REJECTED,
      rejectionReason: 'Failed physical audit: Absence of dedicated female changing facility and missing certified medical first responder on site.',
      coachType: CoachType.INDIVIDUAL,
      planTier: SubscriptionPlan.FREE,
      isTopInArea: false,
      isVerifiedBatch: false,
      cctvMonitored: false,
      nisCertified: false,
      policeVerifiedStaff: false,
      firstAidAvailable: false,
      facilities: {
        create: [
          { description: 'Octagon practice cage and heavy sandbags' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-mma-teens',
            name: 'Teen Kickboxing (Ages 12-18)',
            schedule: 'Mon & Thu • 6:00 PM - 7:30 PM',
            ageGroup: '12-18 Yrs',
            totalSeats: 8,
            seatsFilled: 4,
            monthlyFee: 2200.00,
            isAdmissionsOpen: false,
          },
        ],
      },
    },
  });

  // 12. Agra Shuttle Zone Club (Free Tier, SUSPENDED)
  await prisma.coachingCentre.create({
    data: {
      id: 'acad-taj-badminton',
      ownerUserId: coachShuttle.id,
      name: 'Agra Shuttle Zone Club',
      tagline: 'Indoor Badminton & Youth Racquet Sports',
      category: 'badminton',
      locality: 'kamla-nagar',
      address: 'Near Water Tank, Block B, Kamla Nagar, Agra',
      phone: '+91 98379 44004',
      rating: 4.0,
      reviewsCount: 19,
      monthlyTuitionFee: 1600.00,
      trialFee: 0.00,
      eligibleAgeGroup: '6 - 16 Yrs',
      headCoachName: 'Amit Gupta',
      headCoachBio: 'Former State Player',
      coachesCount: 2,
      studentCoachRatio: '1 : 8',
      latitude: 27.2165,
      longitude: 78.0142,
      safetyGrade: SafetyGrade.GRADE_B,
      kycStatus: KycStatus.SUSPENDED,
      isSuspended: true,
      statusNotes: 'Temporarily suspended due to court floor repair and lighting safety violation pending re-inspection.',
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.FREE,
      isTopInArea: false,
      isVerifiedBatch: false,
      cctvMonitored: true,
      nisCertified: false,
      policeVerifiedStaff: true,
      firstAidAvailable: false,
      facilities: {
        create: [
          { description: '2 Wooden indoor badminton courts' },
        ],
      },
      batches: {
        create: [
          {
            id: 'batch-shuttle-squad',
            name: 'Beginner Shuttle Squad (Ages 6-12)',
            schedule: 'Mon, Wed, Fri • 4:00 PM - 5:00 PM',
            ageGroup: '6-12 Yrs',
            totalSeats: 10,
            seatsFilled: 6,
            monthlyFee: 1600.00,
            isAdmissionsOpen: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 12 Agra coaching centers with realistic subscription tiers & Razorpay IDs.');

  // ==========================================
  // 3. SEED 6 OFFICIAL AGRA COMPETITIONS
  // ==========================================

  const compBadminton = await prisma.competition.create({
    data: {
      id: 'comp-badminton',
      title: 'Agra District Youth Badminton Open 2026',
      sport: 'Badminton (Singles & Doubles)',
      category: 'badminton',
      organizer: 'Agra District Badminton Association',
      dates: 'Oct 18 - 20, 2026 (Friday - Sunday)',
      timing: 'Morning 9:00 AM to 5:30 PM',
      venue: 'Eklavya Indoor Sports Stadium, Sadar Bazar, Agra',
      locality: 'eklavya',
      registrationFee: 450.00,
      ageDivisions: 'Under-11 (Born 2015+) & Under-15 (Born 2011+)',
      prizePool: '₹25,000 Cash Pool + District Ranking Certificates + Trophies for Top 4',
      equipmentRules: 'Non-marking badminton court shoes mandatory. Yonex AS-30 feather shuttles provided for all tournament matches.',
      reportingRules: 'Reporting time 8:30 AM sharp with printed/digital KnowUrCoach entry pass and original student Aadhaar/School ID card.',
      matchFormat: 'Knockout format for qualifying rounds; League round-robin for quarter-finals and onwards. 3 sets of 21 points.',
      umpiringRules: 'Officiated by UP State Badminton Association certified national panel umpires.',
      rulebookPdfUrl: 'Agra_District_Youth_Badminton_Open_2026_Official_Rulebook.pdf',
    },
  });

  await prisma.competition.create({
    data: {
      id: 'comp-chess',
      title: 'All-Agra Interschool Rapid Chess Championship',
      sport: 'Chess (Rapid Rated Format)',
      category: 'stem',
      organizer: 'Agra Chess Club & FIDE Certified Arbiters Panel',
      dates: 'Nov 05, 2026 (Sunday)',
      timing: '10:00 AM to 4:30 PM',
      venue: 'Sanjay Place Youth Community Hall, Commercial Complex, Agra',
      locality: 'sanjay-place',
      registrationFee: 300.00,
      ageDivisions: 'U-9, U-12, and U-15 Divisions',
      prizePool: '₹15,000 Academic Scholarship Pool + Custom Wooden Trophies + Free Masterclass with International Master',
      equipmentRules: 'Tournament chess sets, DGT digital clocks, and standardized notation sheets provided to all participants.',
      reportingRules: 'Arrival at 9:15 AM for pairing verification and player briefing.',
      matchFormat: '6-Round Swiss System using Swiss-Manager software. Time control: 15 minutes + 5 seconds increment per move.',
      umpiringRules: 'Governed by Chief Arbiter FIDE IA Arvind Saxena with 4 assistant arbiters.',
      rulebookPdfUrl: 'All_Agra_Interschool_Rapid_Chess_Championship_Rules.pdf',
    },
  });

  await prisma.competition.create({
    data: {
      id: 'comp-football',
      title: 'Taj Junior Football Championship (5v5 Knockout)',
      sport: 'Football / Futsal (5-a-Side)',
      category: 'football',
      organizer: 'United Agra Football Academy & District Sports Promotion Board',
      dates: 'Nov 14 - 16, 2026 (Children’s Day Special Weekend)',
      timing: '3:30 PM to 8:30 PM (Evening Matches Under Floodlights)',
      venue: 'Kamla Nagar Football Arena & Astroturf, Sector 4, Agra',
      locality: 'kamla-nagar',
      registrationFee: 1200.00,
      ageDivisions: 'Under-12 (Primary) & Under-16 (Cadet)',
      prizePool: '₹35,000 Cash Pool + Rolling Taj Champions Trophy + Golden Boot, Golden Glove & Best Defender Trophies',
      equipmentRules: 'Shin guards mandatory for all outfield players. Turf boots / rubber studs permitted (no metal studs allowed).',
      reportingRules: 'Team managers must report with team roster 45 minutes prior to match schedule.',
      matchFormat: '5 outfield players + 1 goalkeeper + up to 3 rolling substitutions. 15 minutes per half with 5 minutes halftime.',
      umpiringRules: 'AIFF Cat-3 certified referees. On-field certified sports physiotherapist and ambulance on standby.',
      rulebookPdfUrl: 'Taj_Junior_Football_Championship_Regulations_2026.pdf',
    },
  });

  await prisma.competition.create({
    data: {
      id: 'comp-karate',
      title: 'UP State Junior Karate & Taekwondo Open 2026',
      sport: 'Martial Arts (Shotokan Karate & WTF Taekwondo)',
      category: 'martial-arts',
      organizer: 'Shotokan Karate Federation UP (Sports Authority Recognized)',
      dates: 'Nov 28 - 29, 2026 (Saturday & Sunday)',
      timing: '8:30 AM to 6:00 PM',
      venue: 'Dayalbagh Sports Pavilion & Indoor Stadium, Dayalbagh, Agra',
      locality: 'dayalbagh',
      registrationFee: 550.00,
      ageDivisions: 'Under-9, Under-12 & Under-15 (White, Yellow, Green, Blue, Brown/Black Belts)',
      prizePool: 'Official State Gold, Silver & Bronze Medals + State Certificate recognized for National Sports Quota Admissions',
      equipmentRules: 'Chest guard, gum shield, groin guard, and approved mitts. Full protective equipment inspection at registration desk.',
      reportingRules: 'Official weigh-in and belt verification from 7:30 AM to 8:30 AM on Day 1.',
      matchFormat: 'Individual Kata (Form) and Kumite (Sparring) categories. Direct knockout with repechage for bronze medals.',
      umpiringRules: 'WKF/KAI qualified national judges and referees with electronic score display.',
      rulebookPdfUrl: 'UP_State_Junior_Karate_Taekwondo_Open_2026_Rulebook.pdf',
    },
  });

  await prisma.competition.create({
    data: {
      id: 'comp-art',
      title: 'Braj Kala Utsav - All India Youth Art & Painting Contest',
      sport: 'Fine Arts, Sketching & Watercolor Painting',
      category: 'arts',
      organizer: 'Agra Heritage & Arts Society',
      dates: 'Dec 05, 2026 (Saturday)',
      timing: '10:00 AM to 2:00 PM',
      venue: 'Shilpgram Cultural Complex, Taj East Gate Road, Agra',
      locality: 'shilpgram',
      registrationFee: 250.00,
      ageDivisions: 'Group A (5-8 yrs), Group B (9-12 yrs), Group C (13-16 yrs)',
      prizePool: '₹20,000 Cash Prizes + Winning Artworks Featured in Annual Shilpgram Gallery Exhibition + Deluxe Hampers',
      equipmentRules: 'Standardized drawing sheets and drawing boards provided. Participants may bring water colors, pastels, or acrylics.',
      reportingRules: 'Desk opens at 9:30 AM. Topic/theme announced on the spot at 10:00 AM.',
      matchFormat: 'Live 2.5 hour creative painting session on theme: "Taj & Cultural Heritage of Braj / Nature Conservation".',
      umpiringRules: 'Distinguished jury comprising professors from Dayalbagh Educational Institute and Lalit Kala Akademi.',
      rulebookPdfUrl: 'Braj_Kala_Utsav_2026_Brochure_and_Rules.pdf',
    },
  });

  await prisma.competition.create({
    data: {
      id: 'comp-robotics',
      title: 'National Junior STEM & Robotics Olympiad (Agra Zone)',
      sport: 'Robotics, Coding & Innovation Challenge',
      category: 'stem',
      organizer: 'STEM Minds Foundation & KnowUrCoach Innovation Cell',
      dates: 'Dec 19 - 20, 2026 (Saturday & Sunday)',
      timing: '9:30 AM to 4:30 PM',
      venue: 'St. Peter’s Auditorium & Innovation Lab, Sanjay Place, Agra',
      locality: 'sanjay-place',
      registrationFee: 500.00,
      ageDivisions: 'Junior Innovators (10-13 yrs) & Senior Coders (14-17 yrs)',
      prizePool: 'Fully Sponsored Educational Trip to ISRO Space Centre for Zone Winners + Arduino Robotics Kits + Merit Certificates',
      equipmentRules: 'Hardware microcontrollers, sensor kits, and laptop testing stations provided. Teams may bring pre-configured laptops.',
      reportingRules: 'Team briefing & kit allocation starts promptly at 9:00 AM on Day 1.',
      matchFormat: 'Day 1: Algorithmic Logic & Sensor Calibration Workshop. Day 2: Autonomous Obstacle Avoider Arena Challenge & Code Defense.',
      umpiringRules: 'Evaluated by engineering mentors and IIT/NIT alumni panel.',
      rulebookPdfUrl: 'National_Junior_STEM_Robotics_Olympiad_Agra_Problem_Statement.pdf',
    },
  });

  console.log('✅ Seeded 6 official Agra tournaments and competitions.');

  // ==========================================
  // 4. SEED REALISTIC BOOKINGS, PASSES & ATTENDANCE
  // ==========================================

  const poojaProfile = parentPooja.parentProfile!;
  const childAarav = poojaProfile.children.find((c) => c.fullName === 'Aarav Sharma')!;
  const childAnanya = poojaProfile.children.find((c) => c.fullName === 'Ananya Sharma')!;

  // 1. Active Free Trial Pass for Aarav at Ace Sports Academy (100% Free Guarantee - ₹0)
  const trialBooking = await prisma.booking.create({
    data: {
      id: 'book-trial-aarav',
      passId: 'TRL-AGRA-2026-9912',
      passType: PassType.FREE_TRIAL,
      parentId: poojaProfile.id,
      childId: childAarav.id,
      coachingCentreId: acadAce.id,
      batchId: 'batch-ace-junior',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow 4:00 PM
      grossAmount: 0.00,
      creditApplied: 0.00,
      netAmountPaid: 0.00,
      escrowStatus: EscrowStatus.RELEASED_TO_COACH,
      isCheckedIn: true,
      checkedInAt: new Date(),
    },
  });

  await prisma.attendance.create({
    data: {
      bookingId: trialBooking.id,
      batchId: 'batch-ace-junior',
      childId: childAarav.id,
      isPresent: true,
    },
  });

  // 2. Monthly Enrolled Batch for Ananya at MasterMind Abacus (₹1,200 Tuition in Escrow)
  const batchBookingAnanya = await prisma.booking.create({
    data: {
      id: 'book-batch-ananya',
      passId: 'SES-AGRA-2026-8821',
      passType: PassType.MONTHLY_BATCH,
      parentId: poojaProfile.id,
      childId: childAnanya.id,
      coachingCentreId: acadMastermind.id,
      batchId: 'batch-mastermind-speed',
      scheduledAt: new Date(),
      grossAmount: 1200.00,
      creditApplied: 0.00,
      netAmountPaid: 1200.00,
      escrowStatus: EscrowStatus.HELD,
      isCheckedIn: true,
      checkedInAt: new Date(),
    },
  });

  // Attendance history for Ananya: 8 completed classes
  for (let i = 1; i <= 8; i++) {
    await prisma.attendance.create({
      data: {
        bookingId: batchBookingAnanya.id,
        batchId: 'batch-mastermind-speed',
        childId: childAnanya.id,
        date: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
        isPresent: true,
      },
    });
  }

  // 3. Tournament Entry Pass for Aarav at Agra District Badminton Open
  await prisma.booking.create({
    data: {
      id: 'book-comp-aarav',
      passId: 'TNT-AGRA-2026-8819',
      passType: PassType.TOURNAMENT_ENTRY,
      parentId: poojaProfile.id,
      childId: childAarav.id,
      competitionId: compBadminton.id,
      scheduledAt: new Date('2026-10-18T09:00:00Z'),
      grossAmount: 450.00,
      creditApplied: 0.00,
      netAmountPaid: 450.00,
      escrowStatus: EscrowStatus.HELD,
    },
  });

  // 4. Monthly Enrolled Batch for Kabir Saxena at Agra Aquatics (₹2,200)
  const kabirChild = parentSaxena.parentProfile!.children[0];
  const batchBookingKabir = await prisma.booking.create({
    data: {
      id: 'book-batch-kabir',
      passId: 'SES-AGRA-2026-7734',
      passType: PassType.MONTHLY_BATCH,
      parentId: parentSaxena.parentProfile!.id,
      childId: kabirChild.id,
      coachingCentreId: acadAquatics.id,
      batchId: 'batch-aqua-competitive',
      scheduledAt: new Date(),
      grossAmount: 2200.00,
      creditApplied: 0.00,
      netAmountPaid: 2200.00,
      escrowStatus: EscrowStatus.HELD,
      isCheckedIn: true,
      checkedInAt: new Date(),
    },
  });

  for (let i = 1; i <= 6; i++) {
    await prisma.attendance.create({
      data: {
        bookingId: batchBookingKabir.id,
        batchId: 'batch-aqua-competitive',
        childId: kabirChild.id,
        date: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
        isPresent: true,
      },
    });
  }

  // 5. Free Trial Pass for Vivaan Agarwal at Taj Tigers Football
  const vivaanChild = parentMeenakshi.parentProfile!.children[0];
  await prisma.booking.create({
    data: {
      id: 'book-trial-vivaan',
      passId: 'TRL-AGRA-2026-5510',
      passType: PassType.FREE_TRIAL,
      parentId: parentMeenakshi.parentProfile!.id,
      childId: vivaanChild.id,
      coachingCentreId: acadTajTigers.id,
      batchId: 'batch-tigers-cubs',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      grossAmount: 0.00,
      creditApplied: 0.00,
      netAmountPaid: 0.00,
      escrowStatus: EscrowStatus.RELEASED_TO_COACH,
    },
  });

  console.log('✅ Seeded production bookings (₹0 trial passes, monthly batches, tournaments) and attendances.');

  // ==========================================
  // 5. SEED REVIEWS & LEADS (AUTHENTIC AGRA COMMUNITY)
  // ==========================================

  // Verified Reviews
  await prisma.review.create({
    data: {
      coachingCentreId: acadAce.id,
      userId: parentPooja.id,
      rating: 5,
      comment: 'Coach Rajesh is phenomenal with kids! Court 2 is super clean and the CCTV live viewing gives us complete peace of mind. Aarav loves his weekly sessions.',
      coachReply: 'Thank you Pooja ji! Aarav has natural agility and great backhand technique.',
      repliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      coachingCentreId: acadAce.id,
      userId: parentSaxena.id,
      rating: 5,
      comment: 'Best racquet facility in Agra. Yonex feather shuttles and strict NIS coaching regimen. Highly recommended for tournament aspirants.',
      coachReply: 'Appreciate your trust Dr. Saxena! Kabir has made rapid strides in court positioning.',
      repliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      coachingCentreId: acadMastermind.id,
      userId: parentPooja.id,
      rating: 5,
      comment: 'Ananya’s mental arithmetic speed has visibly skyrocketed within 6 weeks. Smt. Rashmi Bansal creates such an engaging environment.',
      coachReply: 'So proud of Ananya! Her concentration in the Soroban speed tests is outstanding.',
      repliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      coachingCentreId: acadAquatics.id,
      userId: parentSaxena.id,
      rating: 5,
      comment: 'Excellent pool hygiene and strict lifeguard supervision. Kabir improved his freestyle timing significantly.',
    },
  });

  await prisma.review.create({
    data: {
      coachingCentreId: acadTajTigers.id,
      userId: parentMeenakshi.id,
      rating: 5,
      comment: 'Coach Sandeep is brilliant. The floodlit astroturf is top notch and the kids get real match exposure.',
    },
  });

  // Authentic CRM Leads for Coaches
  await prisma.lead.create({
    data: {
      coachingCentreId: acadAce.id,
      parentName: 'Pooja Sharma',
      parentPhone: '+91 98370 45678',
      childName: 'Aarav Sharma',
      childAge: 10,
      inquiryNotes: 'Pass ID: TRL-AGRA-2026-9912 • Assigned Court 2 (Trial Confirmed)',
      status: 'trial',
    },
  });

  await prisma.lead.create({
    data: {
      coachingCentreId: acadAce.id,
      parentName: 'Deepak Singhal',
      parentPhone: '+91 94120 77112',
      childName: 'Aryan Singhal',
      childAge: 11,
      inquiryNotes: 'Interested in competitive tennis weekend batch. Needs gear recommendation.',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      coachingCentreId: acadMastermind.id,
      parentName: 'Pooja Sharma',
      parentPhone: '+91 98370 45678',
      childName: 'Ananya Sharma',
      childAge: 8,
      inquiryNotes: 'Enrolled in Speed Vedic Maths weekend batch. Regular attendance active.',
      status: 'enrolled',
    },
  });

  await prisma.lead.create({
    data: {
      coachingCentreId: acadTajTigers.id,
      parentName: 'Meenakshi Agarwal',
      parentPhone: '+91 98972 33445',
      childName: 'Vivaan Agarwal',
      childAge: 9,
      inquiryNotes: 'Free trial pass booked for Cubs batch. Requested confirmation on shoe type.',
      status: 'trial',
    },
  });

  // Parent Wishlist / Saved Centres
  await prisma.savedCentre.create({
    data: {
      parentId: poojaProfile.id,
      coachingCentreId: acadAce.id,
    },
  });

  await prisma.savedCentre.create({
    data: {
      parentId: poojaProfile.id,
      coachingCentreId: acadRobochamps.id,
    },
  });

  await prisma.savedCentre.create({
    data: {
      parentId: parentMeenakshi.parentProfile!.id,
      coachingCentreId: acadTajTigers.id,
    },
  });

  // Realistic Support Ticket
  await prisma.supportTicket.create({
    data: {
      ticketId: 'TKT-AGRA-8831',
      userId: parentPooja.id,
      category: TicketCategory.TRIAL_PASS,
      fullName: 'Pooja Sharma',
      phone: '+91 98370 45678',
      bookingRef: 'TRL-AGRA-2026-9912',
      description: 'Confirmed court availability for Aarav’s trial session tomorrow at Ace Sports Academy.',
      status: 'RESOLVED',
    },
  });

  // Completed KYC On-Ground Physical Audit for Ace Sports Academy by Er. S. Rawat
  await prisma.kycInspection.create({
    data: {
      coachingCentreId: acadAce.id,
      inspectorId: adminUser.id,
      scheduledDate: new Date('2026-09-14T10:00:00Z'),
      cctvChecked: true,
      nisChecked: true,
      policeChecked: true,
      firstAidChecked: true,
      awardedGrade: SafetyGrade.GRADE_A_PLUS,
      inspectorNotes: 'Physical Audit completed by Er. S. Rawat. 100% Safety Compliance verified: 8 CCTV cams operational, NIS certificate verified, female attendant on site.',
      completedAt: new Date('2026-09-14T12:00:00Z'),
    },
  });

  await prisma.kycInspection.create({
    data: {
      coachingCentreId: acadMastermind.id,
      inspectorId: adminUser.id,
      scheduledDate: new Date('2026-09-18T11:00:00Z'),
      cctvChecked: true,
      nisChecked: true,
      policeChecked: true,
      firstAidChecked: true,
      awardedGrade: SafetyGrade.GRADE_A_PLUS,
      inspectorNotes: 'Full air conditioning, Soroban toolkits, and dual exit emergency pathways verified.',
      completedAt: new Date('2026-09-18T13:00:00Z'),
    },
  });

  // ==========================================
  // 6. SEED AUDIT LOGS (PRODUCTION AUDIT TRAIL)
  // ==========================================
  await prisma.auditLog.create({
    data: {
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'COACH_APPROVED',
      targetModel: 'CoachingCentre',
      targetId: 'acad-ace',
      details: {
        centreName: 'Ace Sports Academy',
        grade: 'GRADE_A_PLUS',
        inspector: 'Er. S. Rawat',
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'PLAN_CONFIG_UPDATED',
      targetModel: 'PlatformConfig',
      targetId: 'default',
      details: {
        standardPlanPrice: 1499.00,
        premiumPlanPrice: 3999.00,
        allowTrialBookings: true,
        allowFreeTierPublicListing: true,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: 'admin@knowurcoach.in',
      actorRole: 'ADMIN',
      action: 'COACH_SUBSCRIPTION_ACTIVE',
      targetModel: 'CoachingCentre',
      targetId: 'acad-ace',
      details: {
        tier: 'PREMIUM',
        paymentId: 'pay_RzpAce998124',
        billingCycle: 'annual',
      },
    },
  });

  // ==========================================
  // SEED 3 MAJOR ACTIVITIES & CATEGORIES (DISCIPLINES)
  // ==========================================
  const standardActivities = [
    {
      slug: 'sports',
      name: 'Sports & Athletics',
      icon: 'Trophy',
      accentColor: '#10B981',
      description: 'Elite sports academies, professional coaching & turf facilities across Agra.',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
      order: 1,
      categories: [
        { name: 'Badminton', slug: 'badminton', badge: 'Free Trial', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', shortDesc: 'Indoor wooden & synthetic court coaching for beginners & tournament pros.', order: 1 },
        { name: 'Lawn Tennis', slug: 'tennis', badge: 'Trending', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', shortDesc: 'Clay and hard court tennis lessons by AITA certified coaches.', order: 2 },
        { name: 'Cricket Academy', slug: 'cricket', badge: 'Popular', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80', shortDesc: 'Net practice with bowling machines, turf wickets & match simulation.', order: 3 },
        { name: 'Football & Turf Soccer', slug: 'football', badge: 'Free Trial', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', shortDesc: 'Grass & FIFA-approved turf soccer training with tactical drills.', order: 4 },
        { name: 'Swimming & Aquatics', slug: 'swimming', badge: 'Heated Pool', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80', shortDesc: 'Certified lifeguards, all-weather temperature controlled training.', order: 5 },
        { name: 'Martial Arts & Taekwondo', slug: 'martial-arts', badge: 'Black Belt Coach', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=600&q=80', shortDesc: 'Self defense, belt grading & tournament sparring for kids & teens.', order: 6 },
        { name: 'Roller Skating', slug: 'skating', badge: 'Beginner Friendly', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80', shortDesc: 'Speed skating and artistic rink sessions with safety gear focus.', order: 7 },
        { name: 'Athletics & Gymnastics', slug: 'athletics', badge: 'Fitness Focus', icon: 'Trophy', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80', shortDesc: 'Agility, track sprint technique and flexibility conditioning.', order: 8 },
      ],
    },
    {
      slug: 'brain-booster',
      name: 'Brain Booster & STEM',
      icon: 'Brain',
      accentColor: '#6366F1',
      description: 'Robotics, Vedic Maths, Chess, and junior coding classes to accelerate intellectual growth.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      order: 2,
      categories: [
        { name: 'Robotics & Automation Lab', slug: 'robotics', badge: 'Free Trial', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80', shortDesc: 'Hands-on Arduino, Lego robotics & mechanical hardware assemblies.', order: 1 },
        { name: 'Vedic Maths & Abacus', slug: 'abacus', badge: 'Top Rated', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', shortDesc: 'Speed arithmetic, mental calculation, and Olympiad competition prep.', order: 2 },
        { name: 'Chess Masterclass', slug: 'chess', badge: 'FIDE Certified', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80', shortDesc: 'Opening strategies, positional mastery & rated tournament preparation.', order: 3 },
        { name: 'Coding & AI for Juniors', slug: 'coding', badge: 'High Demand', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80', shortDesc: 'Block coding, Python foundations, and generative AI basics for kids.', order: 4 },
        { name: 'Science & Experiential Labs', slug: 'science-labs', badge: 'Hands-On', icon: 'Brain', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', shortDesc: 'Physics and chemistry experiments with safe interactive kits.', order: 5 },
      ],
    },
    {
      slug: 'arts',
      name: 'Cultural & Fine Arts',
      icon: 'Palette',
      accentColor: '#EC4899',
      description: 'Classical dance, instrumental studio, and fine arts masterclasses guided by gurus.',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      order: 3,
      categories: [
        { name: 'Kathak & Classical Dance', slug: 'dance', badge: 'Certified Guru', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', shortDesc: 'Traditional Lucknow/Jaipur gharana footwork and mudras.', order: 1 },
        { name: 'Western Dance & Hip Hop', slug: 'western-dance', badge: 'Free Trial', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80', shortDesc: 'Freestyle, contemporary, Bollywood and urban choreographies.', order: 2 },
        { name: 'Classical Vocal & Sangeet', slug: 'music', badge: 'Classical', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', shortDesc: 'Hindustani classical riyaaz, harmonium and vocal range exercises.', order: 3 },
        { name: 'Guitar & Keyboard Studio', slug: 'instruments', badge: 'Trinity Grade', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80', shortDesc: 'Acoustic, electric guitar, synth keyboard chords and staff notation.', order: 4 },
        { name: 'Fine Arts & Sketching', slug: 'fine-arts', badge: 'Exhibition Track', icon: 'Palette', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', shortDesc: 'Acrylics, water color, charcoal shading and portfolio curation.', order: 5 },
      ],
    },
  ];

  for (const act of standardActivities) {
    const savedAct = await prisma.majorActivity.upsert({
      where: { slug: act.slug },
      update: {
        name: act.name,
        icon: act.icon,
        accentColor: act.accentColor,
        description: act.description,
        imageUrl: act.imageUrl,
        order: act.order,
        isActive: true,
      },
      create: {
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

    for (const cat of act.categories) {
      await prisma.discipline.upsert({
        where: { slug: cat.slug },
        update: {
          activityId: savedAct.id,
          name: cat.name,
          icon: cat.icon,
          badge: cat.badge,
          imageUrl: cat.imageUrl,
          shortDesc: cat.shortDesc,
          order: cat.order,
          isActive: true,
        },
        create: {
          activityId: savedAct.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          badge: cat.badge,
          imageUrl: cat.imageUrl,
          shortDesc: cat.shortDesc,
          order: cat.order,
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Seeded reviews, leads, wishlist, tickets, KYC audits, activities, and platform audit logs.');
  console.log('🎉 KnowUrCoach Agra production database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
