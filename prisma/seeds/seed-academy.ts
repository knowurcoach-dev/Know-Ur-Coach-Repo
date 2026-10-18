import 'dotenv/config';
import { PrismaClient, Role, CoachType, SubscriptionPlan, SafetyGrade, KycStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const SEED_ACADEMIES_DATA = [
  {
    ownerEmail: 'coach.badminton@knowurcoach.agra',
    ownerPhone: '+919811100001',
    ownerName: 'Coach Rajesh Sharma',
    centre: {
      name: 'Taj City Badminton & Squash Arena',
      tagline: 'BWF Standard Wooden Courts & NIS Certified Coaching',
      category: 'badminton',
      locality: 'Kamla Nagar',
      address: 'Plot 14-B, Near Water Tank Road, Block C, Kamla Nagar, Agra, UP 282005',
      phone: '+919811100001',
      rating: 4.9,
      reviewsCount: 38,
      monthlyTuitionFee: 2200.00,
      trialFee: 0.00,
      eligibleAgeGroup: '5 - 17 Yrs',
      headCoachName: 'Rajesh Sharma',
      headCoachBio: 'NIS Gold Medalist and former UP State Badminton team captain with 15+ years junior development experience.',
      coachesCount: 4,
      studentCoachRatio: '1 : 6',
      latitude: 27.2152,
      longitude: 78.0163,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        '4 BWF-Approved Teak Wooden Courts',
        'Anti-Glare LED Stadium Lighting',
        'Air-Conditioned Parent Observation Lounge',
        'Biometric Check-In & 24x7 CCTV',
        'Certified Sports Physiotherapist On-Site',
      ],
      batches: [
        {
          name: 'Junior Foundation (Under 10)',
          schedule: 'Mon, Wed, Fri • 4:00 PM - 5:15 PM',
          ageGroup: '5 - 10 Yrs',
          totalSeats: 12,
          seatsFilled: 8,
          monthlyFee: 2200.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
        {
          name: 'State Development Squad (Under 16)',
          schedule: 'Tue, Thu, Sat • 5:30 PM - 7:00 PM',
          ageGroup: '11 - 16 Yrs',
          totalSeats: 10,
          seatsFilled: 7,
          monthlyFee: 2800.00,
          batchType: 'ADVANCED',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'sports',
          activityName: 'Sports & Athletics',
          categorySlug: 'badminton',
          categoryName: 'Badminton Academy',
          monthlyFee: 2200.00,
          admissionFee: 500.00,
          ageGroup: '5 - 17 Yrs',
          description: 'Footwork drills, stroke mechanics, shuttle placement, and competitive tournament prep.',
          coachName: 'Rajesh Sharma',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.tennis@knowurcoach.agra',
    ownerPhone: '+919811100002',
    ownerName: 'Coach Amit Saxena',
    centre: {
      name: 'Agra Lawn Tennis & Racquet Club',
      tagline: 'Synthetic Hard & Clay Courts with Video Stroke Analysis',
      category: 'tennis',
      locality: 'Sanjay Place',
      address: 'Complex Sector 8, Commercial Enclave, Sanjay Place, Agra, UP 282002',
      phone: '+919811100002',
      rating: 4.8,
      reviewsCount: 29,
      monthlyTuitionFee: 2500.00,
      trialFee: 0.00,
      eligibleAgeGroup: '6 - 18 Yrs',
      headCoachName: 'Amit Saxena',
      headCoachBio: 'AITA Level 2 Certified Professional with 12 years of coaching junior national qualifiers.',
      coachesCount: 3,
      studentCoachRatio: '1 : 5',
      latitude: 27.1982,
      longitude: 78.0061,
      safetyGrade: SafetyGrade.GRADE_A,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        '2 DecoTurf Hard Courts + 1 Clay Court',
        'Automatic Ball Machine & Radar Gun Drills',
        'Video Motion Stroke Capture System',
        'Emergency First Aid & Hydration Kiosk',
      ],
      batches: [
        {
          name: 'Mini Tennis Starters (Under 9)',
          schedule: 'Mon, Wed, Fri • 4:30 PM - 5:30 PM',
          ageGroup: '6 - 9 Yrs',
          totalSeats: 10,
          seatsFilled: 6,
          monthlyFee: 2500.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
        {
          name: 'AITA Tour Matchplay Squad',
          schedule: 'Tue, Thu, Sat • 5:00 PM - 6:45 PM',
          ageGroup: '10 - 18 Yrs',
          totalSeats: 8,
          seatsFilled: 5,
          monthlyFee: 3200.00,
          batchType: 'ADVANCED',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'sports',
          activityName: 'Sports & Athletics',
          categorySlug: 'tennis',
          categoryName: 'Lawn Tennis',
          monthlyFee: 2500.00,
          admissionFee: 750.00,
          ageGroup: '6 - 18 Yrs',
          description: 'Grip techniques, top-spin mastery, baseline strategy, and tournament matchplay.',
          coachName: 'Amit Saxena',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.cricket@knowurcoach.agra',
    ownerPhone: '+919811100003',
    ownerName: 'Coach Vikram Rathore',
    centre: {
      name: 'Royal Strikers Cricket Academy',
      tagline: 'Turf Pitches, Bowling Machines & BCCI Accredited Mentors',
      category: 'cricket',
      locality: 'Dayalbagh',
      address: 'Dayalbagh Sports Complex, Near Radhasoami Ashram, Dayalbagh, Agra, UP 282005',
      phone: '+919811100003',
      rating: 4.9,
      reviewsCount: 45,
      monthlyTuitionFee: 2000.00,
      trialFee: 0.00,
      eligibleAgeGroup: '7 - 18 Yrs',
      headCoachName: 'Vikram Rathore',
      headCoachBio: 'Former Ranji Trophy player and BCCI Level-B certified mentor.',
      coachesCount: 5,
      studentCoachRatio: '1 : 8',
      latitude: 27.2285,
      longitude: 78.0112,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        '4 Turf Pitches + 2 Cemented Practice Nets',
        'Lever Bowling Machine with Speed Adjust',
        'Full Ground for Weekend Match Simulations',
        'Dressing Rooms & First Aid Center',
      ],
      batches: [
        {
          name: 'Colts Morning Net Sessions',
          schedule: 'Tue, Thu, Sat • 6:30 AM - 8:00 AM',
          ageGroup: '7 - 13 Yrs',
          totalSeats: 15,
          seatsFilled: 11,
          monthlyFee: 2000.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
        {
          name: 'Senior District League Prep',
          schedule: 'Mon, Wed, Fri • 4:00 PM - 6:30 PM',
          ageGroup: '14 - 18 Yrs',
          totalSeats: 14,
          seatsFilled: 12,
          monthlyFee: 2600.00,
          batchType: 'ADVANCED',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'sports',
          activityName: 'Sports & Athletics',
          categorySlug: 'cricket',
          categoryName: 'Cricket Academy',
          monthlyFee: 2000.00,
          admissionFee: 600.00,
          ageGroup: '7 - 18 Yrs',
          description: 'Batting strokeplay, spin & pace bowling mechanics, wicketkeeping, and game tactics.',
          coachName: 'Vikram Rathore',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.swimming@knowurcoach.agra',
    ownerPhone: '+919811100004',
    ownerName: 'Coach Sunita Mehra',
    centre: {
      name: 'Agra Olympic Aquatics & Swimming Centre',
      tagline: '50m Temperature-Regulated Pool & Certified Lifeguards',
      category: 'swimming',
      locality: 'Fatehabad Road',
      address: 'Tourist Complex Area, Near Hotel Trident, Fatehabad Road, Agra, UP 282001',
      phone: '+919811100004',
      rating: 4.9,
      reviewsCount: 34,
      monthlyTuitionFee: 2800.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 17 Yrs',
      headCoachName: 'Sunita Mehra',
      headCoachBio: 'NIS Swimming Coach and certified Red Cross Senior Water Lifeguard Trainer.',
      coachesCount: 4,
      studentCoachRatio: '1 : 4',
      latitude: 27.1610,
      longitude: 78.0430,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        '50m Heated Olympic Swimming Pool',
        'Dedicated Toddler Splash Pool (2ft depth)',
        '3 Certified Red Cross Lifeguards on Deck',
        'Automated Ozone Water Filtration System',
      ],
      batches: [
        {
          name: 'Beginner Tadpole Water Comfort (Ages 4-7)',
          schedule: 'Mon, Wed, Fri • 4:15 PM - 5:00 PM',
          ageGroup: '4 - 7 Yrs',
          totalSeats: 8,
          seatsFilled: 6,
          monthlyFee: 2800.00,
          batchType: 'BEGINNER',
          isAdmissionsOpen: true,
        },
        {
          name: 'Competitive Four-Stroke Mastery',
          schedule: 'Tue, Thu, Sat • 5:15 PM - 6:30 PM',
          ageGroup: '8 - 17 Yrs',
          totalSeats: 10,
          seatsFilled: 7,
          monthlyFee: 3200.00,
          batchType: 'ADVANCED',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'sports',
          activityName: 'Sports & Athletics',
          categorySlug: 'swimming',
          categoryName: 'Olympic Swimming',
          monthlyFee: 2800.00,
          admissionFee: 800.00,
          ageGroup: '4 - 17 Yrs',
          description: 'Freestyle, backstroke, breaststroke, butterfly, breath control, and water survival.',
          coachName: 'Sunita Mehra',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.braingym@knowurcoach.agra',
    ownerPhone: '+919811100005',
    ownerName: 'Dr. Neha Agarwal',
    centre: {
      name: 'NeuroGym & Speed Abacus Cognitive Centre',
      tagline: 'Neuro-Agility Drills, Vedic Arithmetic & Memory Puzzles',
      category: 'brain-gym',
      locality: 'Kamla Nagar',
      address: '2nd Floor, Mahajan Plaza, Block F, Kamla Nagar, Agra, UP 282005',
      phone: '+919811100005',
      rating: 5.0,
      reviewsCount: 41,
      monthlyTuitionFee: 1600.00,
      trialFee: 0.00,
      eligibleAgeGroup: '4 - 14 Yrs',
      headCoachName: 'Dr. Neha Agarwal',
      headCoachBio: 'Child Cognitive Psychologist and Certified Master Abacus & Vedic Mathematics Trainer.',
      coachesCount: 3,
      studentCoachRatio: '1 : 6',
      latitude: 27.2180,
      longitude: 78.0195,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: false,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        'Interactive Brain Training Tablets & Software',
        'Physical Soroban Abacus Desks',
        'Ergonomic Lighting & Quiet Study Zones',
        'Weekly Cognitive Growth Progress Reports',
      ],
      batches: [
        {
          name: 'Junior Neuro Agility (Ages 4-7)',
          schedule: 'Mon, Wed, Fri • 4:00 PM - 5:00 PM',
          ageGroup: '4 - 7 Yrs',
          totalSeats: 12,
          seatsFilled: 9,
          monthlyFee: 1600.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
        {
          name: 'Vedic Maths & Speed Mental Math',
          schedule: 'Tue, Thu, Sat • 5:00 PM - 6:15 PM',
          ageGroup: '8 - 14 Yrs',
          totalSeats: 12,
          seatsFilled: 10,
          monthlyFee: 1800.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'brain-booster',
          activityName: 'Brain Booster & STEM',
          categorySlug: 'brain-gym',
          categoryName: 'Brain Gym & Cognitive Memory',
          monthlyFee: 1600.00,
          admissionFee: 400.00,
          ageGroup: '4 - 14 Yrs',
          description: 'Bilateral coordination, visual memory retention, rapid mental math, and focus building.',
          coachName: 'Dr. Neha Agarwal',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.dance@knowurcoach.agra',
    ownerPhone: '+919811100006',
    ownerName: 'Guru Kavita Mishra',
    centre: {
      name: 'Saraswati Sangeet & Classical Dance Academy',
      tagline: 'Kathak, Bharatnatyam & Classical Vocal Ragas',
      category: 'dance',
      locality: 'Sanjay Place',
      address: 'Near LIC Divisional Office, Civil Lines / Sanjay Place, Agra, UP 282002',
      phone: '+919811100006',
      rating: 4.9,
      reviewsCount: 27,
      monthlyTuitionFee: 1500.00,
      trialFee: 0.00,
      eligibleAgeGroup: '5 - 18 Yrs',
      headCoachName: 'Kavita Mishra',
      headCoachBio: 'Prayag Sangeet Samiti Visharad & Kathak exponent with 18 years teaching experience.',
      coachesCount: 3,
      studentCoachRatio: '1 : 7',
      latitude: 27.1995,
      longitude: 78.0040,
      safetyGrade: SafetyGrade.GRADE_A,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: false,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        'Spring Wooden Dance Floor with Wall Mirrors',
        'Sound-Treated Music & Vocal Rehearsal Studio',
        'Traditional Ghungroo & Instrument Closet',
        'Annual Stage Recital Sponsorship',
      ],
      batches: [
        {
          name: 'Kathak Prathama (Beginner Footwork & Taal)',
          schedule: 'Mon, Wed, Fri • 4:30 PM - 5:30 PM',
          ageGroup: '5 - 12 Yrs',
          totalSeats: 12,
          seatsFilled: 9,
          monthlyFee: 1500.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'arts',
          activityName: 'Cultural & Fine Arts',
          categorySlug: 'dance',
          categoryName: 'Dance Academy',
          monthlyFee: 1500.00,
          admissionFee: 350.00,
          ageGroup: '5 - 18 Yrs',
          description: 'Hindustani Kathak tatkar, chakkar, bhav, and certified board examinations.',
          coachName: 'Kavita Mishra',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.shooting@knowurcoach.agra',
    ownerPhone: '+919811100007',
    ownerName: 'Capt. Rakesh Verma',
    centre: {
      name: 'TargetPro 10m Air Rifle Shooting Range',
      tagline: 'Electronic SIUS Targets, ISSF Certified Mentors & Rifle Armory',
      category: 'shooting',
      locality: 'Sikandra',
      address: 'Sports Wing, Near Sikandra Tomb Gate 2, Sikandra, Agra, UP 282007',
      phone: '+919811100007',
      rating: 5.0,
      reviewsCount: 19,
      monthlyTuitionFee: 2600.00,
      trialFee: 0.00,
      eligibleAgeGroup: '9 - 18 Yrs',
      headCoachName: 'Capt. Rakesh Verma',
      headCoachBio: 'Former Armed Forces Marksmanship Trainer & ISSF Certified Level-1 Coach.',
      coachesCount: 2,
      studentCoachRatio: '1 : 4',
      latitude: 27.2210,
      longitude: 77.9510,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.PREMIUM,
      isTopInArea: true,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: true,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        '8-Lane 10m Electronic Scoring Target Range',
        'Walther & Feinwerkbau Match Rifles Provided',
        'Specialized Armory & Bio-Lock Security',
        'Certified Ballistics Safety Supervisor on Floor',
      ],
      batches: [
        {
          name: 'Air Rifle Marksmanship Cadet Program',
          schedule: 'Tue, Thu, Sat • 4:00 PM - 5:30 PM',
          ageGroup: '9 - 18 Yrs',
          totalSeats: 8,
          seatsFilled: 6,
          monthlyFee: 2600.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'sports',
          activityName: 'Sports & Athletics',
          categorySlug: 'shooting',
          categoryName: '10m Air Rifle Shooting',
          monthlyFee: 2600.00,
          admissionFee: 1000.00,
          ageGroup: '9 - 18 Yrs',
          description: 'Olympic air rifle stability, trigger control, sight alignment, and mental focus.',
          coachName: 'Capt. Rakesh Verma',
        },
      ],
    },
  },
  {
    ownerEmail: 'coach.baking@knowurcoach.agra',
    ownerPhone: '+919811100008',
    ownerName: 'Chef Ananya Kapoor',
    centre: {
      name: 'Little Chefs Junior Baking & Culinary Studio',
      tagline: 'Hands-on Cupcakes, Artisan Breads & Pastry Arts for Kids',
      category: 'baking',
      locality: 'Taj Nagari',
      address: 'Taj Nagari Phase 2, Near Shilpgram Road, Agra, UP 282001',
      phone: '+919811100008',
      rating: 4.9,
      reviewsCount: 22,
      monthlyTuitionFee: 1800.00,
      trialFee: 0.00,
      eligibleAgeGroup: '6 - 15 Yrs',
      headCoachName: 'Chef Ananya Kapoor',
      headCoachBio: 'Le Cordon Bleu trained pastry chef specialized in safe culinary education for children.',
      coachesCount: 2,
      studentCoachRatio: '1 : 5',
      latitude: 27.1580,
      longitude: 78.0550,
      safetyGrade: SafetyGrade.GRADE_A_PLUS,
      kycStatus: KycStatus.APPROVED,
      coachType: CoachType.INSTITUTE,
      planTier: SubscriptionPlan.STANDARD,
      isTopInArea: false,
      isVerifiedBatch: true,
      cctvMonitored: true,
      nisCertified: false,
      policeVerifiedStaff: true,
      firstAidAvailable: true,
      facilities: [
        'Child-Safe Induction Hobs & Electric Ovens',
        '100% Food-Grade Silicone Baking Workstations',
        'Chef Aprons, Hats & Individual Recipe Binders',
        'Strict Allergen Labeling & First Aid Protocol',
      ],
      batches: [
        {
          name: 'Junior Patisserie Weekend Workshop',
          schedule: 'Sat & Sun • 11:00 AM - 12:30 PM',
          ageGroup: '6 - 15 Yrs',
          totalSeats: 10,
          seatsFilled: 7,
          monthlyFee: 1800.00,
          batchType: 'REGULAR',
          isAdmissionsOpen: true,
        },
      ],
      offerings: [
        {
          activitySlug: 'arts',
          activityName: 'Cultural & Fine Arts',
          categorySlug: 'baking',
          categoryName: 'Junior Baking & Patisserie',
          monthlyFee: 1800.00,
          admissionFee: 500.00,
          ageGroup: '6 - 15 Yrs',
          description: 'Cupcake batter mixing, artisan bread kneading, cookie piping, and kitchen hygiene.',
          coachName: 'Chef Ananya Kapoor',
        },
      ],
    },
  },
];

/**
 * Independently seeds or updates sample verified coaching centres in Agra.
 * Unaffected by carousel, categories, or admin tables.
 */
export async function seedAcademies(client: PrismaClient = prisma) {
  console.log('🏛️ [SEED-ACADEMY] Starting coaching centres seeding...');

  const passwordHash = await bcrypt.hash('Coach@12345', 10);
  let seededCount = 0;

  for (const item of SEED_ACADEMIES_DATA) {
    // 1. Ensure Coach User exists
    const user = await client.user.upsert({
      where: { phone: item.ownerPhone },
      update: {
        email: item.ownerEmail,
        role: Role.COACH,
        isActive: true,
      },
      create: {
        phone: item.ownerPhone,
        email: item.ownerEmail,
        passwordHash,
        role: Role.COACH,
        isActive: true,
      },
    });

    // 2. Ensure Coaching Centre exists
    const existingCentre = await client.coachingCentre.findFirst({
      where: {
        OR: [
          { ownerUserId: user.id },
          { name: item.centre.name },
        ],
      },
    });

    const centreData = {
      name: item.centre.name,
      tagline: item.centre.tagline,
      category: item.centre.category,
      locality: item.centre.locality,
      address: item.centre.address,
      phone: item.centre.phone,
      rating: item.centre.rating,
      reviewsCount: item.centre.reviewsCount,
      monthlyTuitionFee: item.centre.monthlyTuitionFee,
      trialFee: item.centre.trialFee,
      eligibleAgeGroup: item.centre.eligibleAgeGroup,
      headCoachName: item.centre.headCoachName,
      headCoachBio: item.centre.headCoachBio,
      coachesCount: item.centre.coachesCount,
      studentCoachRatio: item.centre.studentCoachRatio,
      latitude: item.centre.latitude,
      longitude: item.centre.longitude,
      safetyGrade: item.centre.safetyGrade,
      kycStatus: item.centre.kycStatus,
      coachType: item.centre.coachType,
      planTier: item.centre.planTier,
      isTopInArea: item.centre.isTopInArea,
      isVerifiedBatch: item.centre.isVerifiedBatch,
      cctvMonitored: item.centre.cctvMonitored,
      nisCertified: item.centre.nisCertified,
      policeVerifiedStaff: item.centre.policeVerifiedStaff,
      firstAidAvailable: item.centre.firstAidAvailable,
      isActive: true,
    };

    let centre;
    if (existingCentre) {
      centre = await client.coachingCentre.update({
        where: { id: existingCentre.id },
        data: centreData,
      });
    } else {
      centre = await client.coachingCentre.create({
        data: {
          ownerUserId: user.id,
          ...centreData,
        },
      });
    }

    // 3. Sync facilities
    await client.facility.deleteMany({
      where: { coachingCentreId: centre.id },
    });
    for (const f of item.centre.facilities) {
      await client.facility.create({
        data: {
          coachingCentreId: centre.id,
          description: f,
        },
      });
    }

    // 4. Sync batches
    for (const b of item.centre.batches) {
      const existingBatch = await client.batch.findFirst({
        where: {
          coachingCentreId: centre.id,
          name: b.name,
        },
      });

      if (existingBatch) {
        await client.batch.update({
          where: { id: existingBatch.id },
          data: {
            schedule: b.schedule,
            ageGroup: b.ageGroup,
            totalSeats: b.totalSeats,
            seatsFilled: b.seatsFilled,
            monthlyFee: b.monthlyFee,
            batchType: b.batchType,
            isAdmissionsOpen: b.isAdmissionsOpen,
          },
        });
      } else {
        await client.batch.create({
          data: {
            coachingCentreId: centre.id,
            name: b.name,
            schedule: b.schedule,
            ageGroup: b.ageGroup,
            totalSeats: b.totalSeats,
            seatsFilled: b.seatsFilled,
            monthlyFee: b.monthlyFee,
            batchType: b.batchType,
            isAdmissionsOpen: b.isAdmissionsOpen,
          },
        });
      }
    }

    // 5. Sync offerings
    for (const o of item.centre.offerings) {
      const existingOffering = await client.academyOffering.findFirst({
        where: {
          coachingCentreId: centre.id,
          categorySlug: o.categorySlug,
        },
      });

      if (existingOffering) {
        await client.academyOffering.update({
          where: { id: existingOffering.id },
          data: {
            activitySlug: o.activitySlug,
            activityName: o.activityName,
            categoryName: o.categoryName,
            monthlyFee: o.monthlyFee,
            admissionFee: o.admissionFee,
            ageGroup: o.ageGroup,
            description: o.description,
            coachName: o.coachName,
            isActive: true,
          },
        });
      } else {
        await client.academyOffering.create({
          data: {
            coachingCentreId: centre.id,
            activitySlug: o.activitySlug,
            activityName: o.activityName,
            categorySlug: o.categorySlug,
            categoryName: o.categoryName,
            monthlyFee: o.monthlyFee,
            admissionFee: o.admissionFee,
            ageGroup: o.ageGroup,
            description: o.description,
            coachName: o.coachName,
            isActive: true,
          },
        });
      }
    }

    seededCount++;
    console.log(`  ✓ Seeded academy: "${centre.name}" (${centre.locality}) - ${centre.category}`);
  }

  const total = await client.coachingCentre.count();
  console.log(`✅ [SEED-ACADEMY] Finished: ${seededCount} coaching centres verified. Total centres in DB: ${total}`);
  return { seededCount, total };
}

// Standalone execution support
if (require.main === module || process.argv[1]?.includes('seed-academy')) {
  seedAcademies()
    .catch((err) => {
      console.error('❌ [SEED-ACADEMY] Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
