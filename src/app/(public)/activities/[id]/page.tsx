"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Academy } from '@/types';
import { getAcademyById, getDiscoveryData, toggleCentreBookmark, getSavedCentreIds, getParentDashboardData, getCoachDashboardData, createCoachLead } from '@/lib/actions';
import { getCategoryDisplayName, getCategoryEmoji, getCategoryPillar, extractCleanLocalityName, extractCleanLocalitySlug } from '@/lib/categories';
import { parseDocsPayload } from '@/lib/coach-docs';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { calculateDistance, formatDistanceText, resolveCentreCity } from '@/lib/location';
import { useAuth } from '@/hooks/useAuth';
import { ActivityDetailSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import { AcademyReviewsSection } from '@/components/reviews/AcademyReviewsSection';
import { useBookmarks } from '@/hooks/useBookmarks';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { resolveClassModeInfo, getClassModeBadgeStyles } from '@/lib/class-modes';
import { getClassModeIconComponent } from '@/lib/class-modes-icons';

function getAcademyInitials(name: string): string {
  if (!name) return 'KC';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 0 && /^[A-Z]{2,4}$/.test(words[0])) {
    return words[0];
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
}

const DISCIPLINE_HIGHLIGHTS: Record<string, { headline: string; points: string[]; features: string[] }> = {
  'coaching-centres': {
    headline: 'Structured Board & Exam Syllabus Preparation',
    points: [
      'Comprehensive syllabus coverage for CBSE, ICSE & State Boards',
      'Chapter-wise weekly mock tests & analytical performance review',
      'Dedicated doubt-clearing sessions & exam time-management drills',
    ],
    features: ['Batch Tuition', 'Test Series', 'Concept Clarity'],
  },
  'home-tutor': {
    headline: 'Personalized 1-on-1 Academic Tutoring at Your Home',
    points: [
      'Customized learning pace tailored to your child’s school curriculum',
      'Daily homework assistance, concept strengthening & regular revision',
      'Continuous parent communication with one-on-one progress tracking',
    ],
    features: ['1-on-1 In Person', 'Flexible Schedule', 'Verified Educator'],
  },
  'online-tutors-(one-to-one-sessions)': {
    headline: 'Interactive 1-to-1 Live Video Mentorship',
    points: [
      'Live interactive video classes with digital whiteboard problem solving',
      'Recorded lessons & digital revision worksheets after every session',
      'Flexible evening & weekend time slots tailored for student convenience',
    ],
    features: ['Live Interactive', 'Digital Notes', 'Zero Travel'],
  },
  'speed-handwriting': {
    headline: 'Scientific Letter Formation & Exam Writing Speed',
    points: [
      'Ergonomic pencil grip & posture correction to prevent writing fatigue',
      'Cursive & print handwriting alignment, spacing, and flow drills',
      'Speed enhancement exercises tailored for timed school examinations',
    ],
    features: ['Cursive & Print', 'Speed Drills', 'Neat Presentation'],
  },
  handwriting: {
    headline: 'Scientific Letter Formation & Exam Writing Speed',
    points: [
      'Ergonomic pencil grip & posture correction to prevent writing fatigue',
      'Cursive & print handwriting alignment, spacing, and flow drills',
      'Speed enhancement exercises tailored for timed school examinations',
    ],
    features: ['Cursive & Print', 'Speed Drills', 'Neat Presentation'],
  },
  'english-phonics': {
    headline: 'Phonemic Awareness & Fluent Independent Reading',
    points: [
      'Mastery of 44 phonetic sounds, consonant blends & vowel digraphs',
      'High-frequency sight words decoding & correct pronunciation mechanics',
      'Guided storybook reading to build vocabulary and speaking confidence',
    ],
    features: ['44 Sounds', 'Early Reading', 'Phonics Workbooks'],
  },
  phonics: {
    headline: 'Phonemic Awareness & Fluent Independent Reading',
    points: [
      'Mastery of 44 phonetic sounds, consonant blends & vowel digraphs',
      'High-frequency sight words decoding & correct pronunciation mechanics',
      'Guided storybook reading to build vocabulary and speaking confidence',
    ],
    features: ['44 Sounds', 'Early Reading', 'Phonics Workbooks'],
  },
  abacus: {
    headline: 'Mental Math, Calculation Speed & Working Memory',
    points: [
      'Soroban abacus bead manipulation for rapid visual arithmetic',
      'Mental calculation drills without paper or calculators',
      'Enhances concentration, spatial reasoning, and brain processing speed',
    ],
    features: ['Mental Math', 'Memory Drills', 'Level Certifications'],
  },
  robotics: {
    headline: 'Hands-on STEM Robotics, Sensors & Circuit Design',
    points: [
      'Hardware assembly with motors, microcontrollers, and sensory modules',
      'Block-based & text-based algorithmic coding for autonomous robots',
      'Real-world STEM project challenges and competition preparation',
    ],
    features: ['Hands-on Kits', 'STEM Coding', 'Project Challenges'],
  },
  stem: {
    headline: 'Applied Science, Technology & Engineering Experiments',
    points: [
      'Practical experiments explaining physics, chemistry, and mechanics',
      'Hands-on problem solving through maker kits and working prototypes',
      'Fosters curious questioning, analytical thinking, and scientific inquiry',
    ],
    features: ['Science Lab', 'Hands-on Kits', 'Critical Thinking'],
  },
  chess: {
    headline: 'Tactical Calculation, Strategy & Endgame Mastery',
    points: [
      'Opening repertoire, middle-game pawn structures & tactical motifs',
      'Endgame precision, visualization & clock management drills',
      'Tournament-style rated practice games with post-game analysis',
    ],
    features: ['FIDE Standard', 'Tactical Analysis', 'Tournament Play'],
  },
  cricket: {
    headline: 'Professional Batting, Bowling & Match Simulation',
    points: [
      'Batting stroke mechanics, footwork drills & net practice against pace/spin',
      'Bowling run-up consistency, seam positioning & speed measurement',
      'Match scenario simulations, fielding agility, and fitness conditioning',
    ],
    features: ['Turf Nets', 'Video Analysis', 'Match Practice'],
  },
  badminton: {
    headline: 'Court Footwork, Racquet Strokes & Tactical Rallies',
    points: [
      '6-corner footwork agility, recovery speed & court positioning drills',
      'Smash power, deception drop shots, and net control mechanics',
      'Singles and doubles match strategy with physical conditioning',
    ],
    features: ['Wooden/Synthetic Court', 'Shuttle Drills', 'Match Play'],
  },
  tennis: {
    headline: 'Stroke Mechanics, Topspin Rallies & Court Strategy',
    points: [
      'Forehand and backhand topspin mechanics with video stroke review',
      'Serve placement, first-step court movement & baseline rallies',
      'Match play tactics, tie-breaker strategy, and endurance training',
    ],
    features: ['Hard/Clay Courts', 'Rally Drills', 'Tournament Prep'],
  },
  swimming: {
    headline: 'Stroke Technique, Water Safety & Stamina Building',
    points: [
      'Freestyle, backstroke, breaststroke, and butterfly stroke mechanics',
      'Breathing rhythm, flip turns, and streamline dive technique',
      'Water safety certification, endurance laps, and competitive timing',
    ],
    features: ['Semi/Olympic Pool', 'Lifeguard On Duty', 'Water Safety'],
  },
  dance: {
    headline: 'Rhythm, Choreography & Expressive Stage Performance',
    points: [
      'Body posture, footwork rhythm, and expressive mudras / gestures',
      'Step-by-step choreography breakdown across classical and contemporary styles',
      'Stage presence training, performance confidence, and annual showcases',
    ],
    features: ['Mirrored Studio', 'Sound System', 'Annual Showcase'],
  },
  music: {
    headline: 'Instrumental Technique, Vocal Pitch & Ear Training',
    points: [
      'Note reading, rhythm timing, scales, and finger dexterity exercises',
      'Song repertoire across classical, contemporary, and popular genres',
      'Stage performance preparation and grade exam certifications',
    ],
    features: ['Acoustic Studio', 'Grade Exams', 'Live Jams'],
  },
  arts: {
    headline: 'Sketching, Color Theory & Creative Expression',
    points: [
      'Foundational pencil sketching, perspective drawing, and shading',
      'Color blending with watercolors, acrylics, and oil pastels',
      'Theme-based compositions, exhibition preparation, and creative portfolio',
    ],
    features: ['Easel Studio', 'Art Materials', 'Exhibition Displays'],
  },
};

function getDisciplineHighlights(slug: string, pillar: string) {
  const clean = slug?.toLowerCase().trim() || '';
  for (const key of Object.keys(DISCIPLINE_HIGHLIGHTS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return DISCIPLINE_HIGHLIGHTS[key];
    }
  }
  if (pillar === 'education') {
    return {
      headline: 'Structured Learning & Academic Skill Development',
      points: [
        'Curriculum-aligned syllabus coverage with strong conceptual foundations',
        'Interactive student discussions, practice worksheets & regular revisions',
        'Personalized faculty mentoring with continuous progress evaluations',
      ],
      features: ['Concept Clarity', 'Weekly Assessments', 'Small Batch Focus'],
    };
  }
  if (pillar === 'brain-booster') {
    return {
      headline: 'Cognitive Enhancement & Problem-Solving Drills',
      points: [
        'Brain stimulation exercises to enhance memory, focus, and logic',
        'Hands-on learning modules encouraging self-paced discovery',
        'Analytical skill building preparing students for future competitive exams',
      ],
      features: ['Logic Building', 'Focus Enhancement', 'Interactive Kits'],
    };
  }
  if (pillar === 'arts') {
    return {
      headline: 'Creative Expression, Technique & Confidence Building',
      points: [
        'Step-by-step foundational training with experienced instructors',
        'Creative freedom and personal expression nurtured in a positive environment',
        'Opportunities for stage showcases, exhibitions, and certifications',
      ],
      features: ['Studio Training', 'Stage Confidence', 'Master Mentors'],
    };
  }
  return {
    headline: 'Certified Coaching, Technique Drills & Athlete Development',
    points: [
      'Skill progression from foundational drills to competitive match play',
      'Physical stamina, agility, and injury prevention conditioning',
      'Individual performance tracking and tournament mentoring',
    ],
    features: ['Certified Coaching', 'Safety Protocol', 'Match Training'],
  };
}

const PILLAR_SHOWCASE_THEMES: Record<string, {
  gradient: string;
  border: string;
  ambientGlow: string;
  monogramBg: string;
  badgeText: string;
  themePillText: string;
}> = {
  education: {
    gradient: 'from-slate-950 via-[#0a1532] to-indigo-950',
    border: 'border-indigo-500/20',
    ambientGlow: 'bg-indigo-500/15',
    monogramBg: 'from-indigo-600 via-blue-600 to-indigo-800',
    badgeText: 'text-indigo-300',
    themePillText: 'Academic & Skill Development',
  },
  sports: {
    gradient: 'from-slate-950 via-[#071d18] to-emerald-950',
    border: 'border-emerald-500/20',
    ambientGlow: 'bg-emerald-500/15',
    monogramBg: 'from-emerald-600 via-teal-600 to-emerald-800',
    badgeText: 'text-emerald-300',
    themePillText: 'Sports & Athletics Academy',
  },
  'brain-booster': {
    gradient: 'from-slate-950 via-[#180a2b] to-purple-950',
    border: 'border-purple-500/20',
    ambientGlow: 'bg-purple-500/15',
    monogramBg: 'from-purple-600 via-violet-600 to-indigo-700',
    badgeText: 'text-purple-300',
    themePillText: 'Brain Booster & STEM Lab',
  },
  arts: {
    gradient: 'from-slate-950 via-[#260919] to-rose-950',
    border: 'border-rose-500/20',
    ambientGlow: 'bg-rose-500/15',
    monogramBg: 'from-rose-600 via-pink-600 to-amber-700',
    badgeText: 'text-rose-300',
    themePillText: 'Cultural & Fine Arts Studio',
  },
};
import {
  Star,
  SealCheck,
  MapPin,
  Heart,
  Ticket,
  CalendarPlus,
  ShieldCheck,
  CheckCircle,
  Clock,
  Users,
  Phone,
  WhatsappLogo,
  ShareNetwork,
  CaretRight,
  CaretDown,
  X,
  ArrowLeft,
  Sparkle,
  FirstAid,
  VideoCamera,
  Buildings,
  GraduationCap,
  Medal,
  Lock,
  User as UserIcon,
  ChatCircleDots,
  PaperPlaneTilt,
  Scales,
} from '@phosphor-icons/react';

export default function AcademyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { openModal } = useModalStore();
  const { showToast, activeCity, activeCoords } = usePersona();
  const { isGuest, session, user } = useAuth();
  const userEmail = session?.user?.email || (user as any)?.email;

  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [batchCategoryFilter, setBatchCategoryFilter] = useState<string>('all');
  const [selectedDisciplineIndex, setSelectedDisciplineIndex] = useState(0);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);
  const [previewReason, setPreviewReason] = useState<string>('');

  // Direct Academy Inquiry state
  const [inquiryParentName, setInquiryParentName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryChildName, setInquiryChildName] = useState('');
  const [inquiryChildAge, setInquiryChildAge] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  // Sync initial parent name & phone when auth loads
  useEffect(() => {
    if (user?.name && !inquiryParentName) setInquiryParentName(user.name);
    if ((user as any)?.phone && !inquiryPhone) setInquiryPhone((user as any).phone);
  }, [user]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;
    if (isOwnerPreview) {
      showToast('ℹ️ Listing Preview Mode: Direct inquiries will be enabled for parents once your academy is live.');
      return;
    }
    if (!inquiryParentName.trim() || !inquiryPhone.trim() || !inquiryMessage.trim()) {
      showToast('⚠️ Please enter your name, contact number, and question');
      return;
    }

    setInquirySending(true);
    try {
      const fullNotes = `[Parent Inquiry - Listing Details]: ${
        inquiryCategory ? `Interested in: ${inquiryCategory} | ` : ''
      }${inquiryMessage.trim()}`;

      const res = await createCoachLead({
        centreId: academy.id,
        parentName: inquiryParentName.trim(),
        parentPhone: inquiryPhone.trim(),
        childName: inquiryChildName.trim() || 'Student',
        childAge: parseInt(inquiryChildAge, 10) || 8,
        inquiryNotes: fullNotes,
        status: 'new',
      });

      if (res.success) {
        setInquirySent(true);
        showToast(`✅ Your inquiry was sent directly to ${academy.name}! Coach has been notified.`);
      } else {
        showToast(res.message || 'Could not send inquiry. Please try WhatsApp.');
      }
    } catch (err) {
      showToast('Error submitting inquiry. Please try WhatsApp.');
    } finally {
      setInquirySending(false);
    }
  };

  const loadAcademy = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setDbError(null);
    try {
      const res = await getAcademyById(id);
      let foundInDb: any = res.centre;
        if (!foundInDb) {
          const { centres } = await getDiscoveryData();
          foundInDb = centres.find(
            (c: any) => c.id === id || c.id?.toLowerCase() === id?.toLowerCase()
          );
        }
        if (foundInDb) {
          const subStatus = getCentreSubscriptionStatus(foundInDb);
          const isPublicLive = subStatus.isPublicLive;
          const isOwner = Boolean(
            userEmail &&
              (foundInDb.owner?.email === userEmail ||
                foundInDb.ownerUserId === session?.user?.id ||
                (user as any)?.centreId === foundInDb.id)
          );
          const isAdmin =
            (session?.user as any)?.role === 'ADMIN' || (user as any)?.role === 'ADMIN';

          // Guard: If not live and not owner/admin, prevent unauthorized public access
          if (!isPublicLive && !isOwner && !isAdmin) {
            setAcademy(null);
            setIsOwnerPreview(false);
            setLoading(false);
            return;
          }

          const isPreview = !isPublicLive && (isOwner || isAdmin);
          setIsOwnerPreview(isPreview);
          if (isPreview) {
            setPreviewReason(subStatus.publicListingMessage);
          } else {
            setPreviewReason('');
          }

          const categorySlugs = (foundInDb.category ? foundInDb.category.split(',') : ['tennis'])
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean);
          const activityNames = categorySlugs.map((slug: string) => getCategoryDisplayName(slug));

          const batchFees = (foundInDb.batches || [])
            .map((b: any) => Number(b.monthlyFee))
            .filter((f: number) => !isNaN(f) && f > 0);
          const startingFee = batchFees.length > 0 ? Math.min(...batchFees) : 0;

          // Extract venue photos from statusNotes if uploaded during KYC
          const docsPayload = parseDocsPayload(foundInDb);
          const venuePhotos = (docsPayload?.venuePhotos || [])
            .map((p: any) => p.url)
            .filter((u: string) => u && (u.startsWith('http') || u.startsWith('data:image/')));

          const rawCustomImage = (foundInDb as any).image;
          const hasCustomImage = Boolean(
            (rawCustomImage && typeof rawCustomImage === 'string' && !rawCustomImage.includes('photo-1534438327276-14e5300c3a48') && (rawCustomImage.startsWith('http') || rawCustomImage.startsWith('data:image/'))) ||
            venuePhotos.length > 0
          );
          const primaryImage = venuePhotos[0] || (hasCustomImage ? rawCustomImage : '');
          const primaryPillar = categorySlugs[0] ? getCategoryPillar(categorySlugs[0]) : 'education';

          const mapped: Academy = {
            id: foundInDb.id,
            name: foundInDb.name,
            tagline: foundInDb.tagline || `Verified ${primaryPillar === 'education' ? 'Academic Coaching Center' : 'Sports & Activities Academy'} in ${(foundInDb as any).city || activeCity || 'Agra'}`,
            category: (foundInDb.category as any) || 'tennis',
            categorySlugs,
            activities: activityNames.length > 0 ? activityNames : [getCategoryDisplayName(foundInDb.category)],
            activitiesText: activityNames.length > 0 ? activityNames.join(' • ') : getCategoryDisplayName(foundInDb.category),
            locality: extractCleanLocalitySlug(foundInDb.locality, foundInDb.address),
            localityName: extractCleanLocalityName(foundInDb.locality, foundInDb.address, (foundInDb as any).city || activeCity || 'Kamla Nagar'),
            city: (foundInDb as any).city || activeCity || 'Agra',
            address: foundInDb.address || `${(foundInDb as any).city || activeCity || 'Agra'}, Uttar Pradesh`,
            phone: foundInDb.phone || '+91 98970 12345',
            distance: (() => {
              const isAllIndia = !activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india');
              if (!isAllIndia && activeCoords && typeof foundInDb.latitude === 'number' && typeof foundInDb.longitude === 'number') {
                const d = calculateDistance(activeCoords.lat, activeCoords.lon, foundInDb.latitude, foundInDb.longitude);
                return d <= 100 ? d : undefined;
              }
              return undefined;
            })(),
            distanceText: (() => {
              const isAllIndia = !activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india');
              if (!isAllIndia && activeCoords && typeof foundInDb.latitude === 'number' && typeof foundInDb.longitude === 'number') {
                const d = calculateDistance(activeCoords.lat, activeCoords.lon, foundInDb.latitude, foundInDb.longitude);
                return d <= 100 ? formatDistanceText(d) : undefined;
              }
              return undefined;
            })(),
            age: ['u8', 'u12', 'u16'],
            ageText: foundInDb.eligibleAgeGroup || '4 - 17 Yrs',
            fee: startingFee,
            trialFee: Number(foundInDb.trialFee) || 0,
            rating: Number(foundInDb.rating) || 5.0,
            reviewsCount: typeof foundInDb.reviewsCount === 'number' ? foundInDb.reviewsCount : (Number(foundInDb.reviewsCount) || 0),
            verifiedTag: foundInDb.kycStatus === 'APPROVED' ? (foundInDb.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Audited') : 'Pending Verification',
            image: primaryImage,
            hasCustomImage,
            venuePhotos,
            primaryPillar,
            coachName: foundInDb.headCoachName || 'Certified Head Coach',
            coachTitle: foundInDb.nisCertified
              ? 'NIS Certified Head Coach'
              : (primaryPillar === 'education' ? 'Lead Academic Mentor & Faculty' : 'Certified Head Coach'),
            coachBio: foundInDb.headCoachBio,
            coachesCount: foundInDb.coachesCount ?? (primaryPillar === 'education' ? 1 : 2),
            ratio: foundInDb.studentCoachRatio || '1 : 8',
            nisCertified: Boolean(foundInDb.nisCertified),
            policeVerifiedStaff: Boolean(foundInDb.policeVerifiedStaff),
            cctvMonitored: Boolean(foundInDb.cctvMonitored),
            firstAidAvailable: Boolean(foundInDb.firstAidAvailable),
            facilities: (foundInDb.facilities || []).map((f: any) => f.description),
            safety: '24/7 CCTV • First Aid • Police Verified Staff',
            isTopInArea: foundInDb.isTopInArea,
            planTier: foundInDb.planTier,
            isVerifiedBatch: foundInDb.kycStatus === 'APPROVED' && Boolean(foundInDb.isVerifiedBatch),
            coachType: foundInDb.coachType,
            classMode: foundInDb.classMode || 'offline',
            batches: (foundInDb.batches || []).map((b: any) => ({
              id: b.id,
              name: b.name,
              category: b.category,
              categoryDisplayName: b.categoryDisplayName || (b.category ? getCategoryDisplayName(b.category) : undefined),
              categoryEmoji: b.categoryEmoji || (b.category ? getCategoryEmoji(b.category) : undefined),
              coachName: b.coachName,
              time: b.pureSchedule || b.schedule,
              schedule: b.pureSchedule || b.schedule,
              ageGroup: b.ageGroup || 'All Ages',
              monthlyFee: Number(b.monthlyFee) > 0 ? Number(b.monthlyFee) : startingFee,
              totalSeats: b.totalSeats || 15,
              seatsFilled: b.seatsFilled || 0,
              seats: `${b.seatsFilled || 0}/${b.totalSeats || 15} Enrolled`,
            })),
          };
          setAcademy(mapped);
          setLoading(false);
          return;
        }

        // If not in public discovery, check if the active user is the coach owner previewing their private profile
        if (userEmail) {
          try {
            const coachData = await getCoachDashboardData();
            const coachCentre = coachData?.centre;
            if (
              coachCentre &&
              (coachCentre.id === id || coachCentre.id?.toLowerCase() === id?.toLowerCase())
            ) {
              const subStatus = getCentreSubscriptionStatus(coachCentre);
              const coachCatSlugs = (coachCentre.category ? coachCentre.category.split(',') : ['tennis'])
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean);
              const coachActivityNames = coachCatSlugs.map((slug: string) => getCategoryDisplayName(slug));

              const coachBatchFees = (coachCentre.batches || [])
                .map((b: any) => Number(b.monthlyFee))
                .filter((f: number) => !isNaN(f) && f > 0);
              const coachStartingFee = coachBatchFees.length > 0 ? Math.min(...coachBatchFees) : 0;

              const coachDocsPayload = parseDocsPayload(coachCentre);
              const coachVenuePhotos = (coachDocsPayload?.venuePhotos || [])
                .map((p: any) => p.url)
                .filter((u: string) => u && (u.startsWith('http') || u.startsWith('data:image/')));

              const coachRawCustomImage = (coachCentre as any).image;
              const coachHasCustomImage = Boolean(
                (coachRawCustomImage && typeof coachRawCustomImage === 'string' && !coachRawCustomImage.includes('photo-1534438327276-14e5300c3a48') && (coachRawCustomImage.startsWith('http') || coachRawCustomImage.startsWith('data:image/'))) ||
                coachVenuePhotos.length > 0
              );
              const coachPrimaryImage = coachVenuePhotos[0] || (coachHasCustomImage ? coachRawCustomImage : '');
              const coachPrimaryPillar = coachCatSlugs[0] ? getCategoryPillar(coachCatSlugs[0]) : 'education';

              const mapped: Academy = {
                id: coachCentre.id,
                name: coachCentre.name,
                tagline: coachCentre.tagline || `Verified ${coachPrimaryPillar === 'education' ? 'Academic Coaching Center' : 'Sports & Activities Academy'} in ${(coachCentre as any).city || activeCity || 'Agra'}`,
                category: (coachCentre.category as any) || 'tennis',
                categorySlugs: coachCatSlugs,
                activities: coachActivityNames.length > 0 ? coachActivityNames : [getCategoryDisplayName(coachCentre.category)],
                activitiesText: coachActivityNames.length > 0 ? coachActivityNames.join(' • ') : getCategoryDisplayName(coachCentre.category),
                locality: extractCleanLocalitySlug(coachCentre.locality, coachCentre.address),
                localityName: extractCleanLocalityName(coachCentre.locality, coachCentre.address, (coachCentre as any).city || activeCity || 'Kamla Nagar'),
                city: (coachCentre as any).city || activeCity || 'Agra',
                address: coachCentre.address || `${(coachCentre as any).city || activeCity || 'Agra'}, Uttar Pradesh`,
                phone: coachCentre.phone || '+91 98970 12345',
                distance: (() => {
                  const isAllIndia = !activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india');
                  if (!isAllIndia && activeCoords && typeof coachCentre.latitude === 'number' && typeof coachCentre.longitude === 'number') {
                    const d = calculateDistance(activeCoords.lat, activeCoords.lon, coachCentre.latitude, coachCentre.longitude);
                    return d <= 100 ? d : undefined;
                  }
                  return undefined;
                })(),
                distanceText: (() => {
                  const isAllIndia = !activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india');
                  if (!isAllIndia && activeCoords && typeof coachCentre.latitude === 'number' && typeof coachCentre.longitude === 'number') {
                    const d = calculateDistance(activeCoords.lat, activeCoords.lon, coachCentre.latitude, coachCentre.longitude);
                    return d <= 100 ? formatDistanceText(d) : undefined;
                  }
                  return undefined;
                })(),
                age: ['u8', 'u12', 'u16'],
                ageText: coachCentre.eligibleAgeGroup || '4 - 17 Yrs',
                fee: coachStartingFee,
                trialFee: Number(coachCentre.trialFee) || 0,
                rating: Number(coachCentre.rating) || 5.0,
                reviewsCount: typeof coachCentre.reviewsCount === 'number' ? coachCentre.reviewsCount : (Number(coachCentre.reviewsCount) || 0),
                verifiedTag: coachCentre.kycStatus === 'APPROVED' ? (coachCentre.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Audited') : 'Pending Verification',
                image: coachPrimaryImage,
                hasCustomImage: coachHasCustomImage,
                venuePhotos: coachVenuePhotos,
                primaryPillar: coachPrimaryPillar,
                coachName: coachCentre.headCoachName || 'Certified Head Coach',
                coachTitle: coachCentre.nisCertified
                  ? 'NIS Certified Head Coach'
                  : (coachPrimaryPillar === 'education' ? 'Lead Academic Mentor & Faculty' : 'Certified Head Coach'),
                coachBio: coachCentre.headCoachBio,
                coachesCount: coachCentre.coachesCount ?? (coachPrimaryPillar === 'education' ? 1 : 2),
                ratio: coachCentre.studentCoachRatio || '1 : 8',
                nisCertified: Boolean(coachCentre.nisCertified),
                policeVerifiedStaff: Boolean(coachCentre.policeVerifiedStaff),
                cctvMonitored: Boolean(coachCentre.cctvMonitored),
                firstAidAvailable: Boolean(coachCentre.firstAidAvailable),
                facilities: (coachCentre.facilities || []).map((f: any) => f.description),
                safety: '24/7 CCTV • First Aid • Police Verified Staff',
                isTopInArea: coachCentre.isTopInArea,
                planTier: coachCentre.planTier,
                isVerifiedBatch: coachCentre.kycStatus === 'APPROVED' && Boolean(coachCentre.isVerifiedBatch),
                coachType: coachCentre.coachType,
                classMode: coachCentre.classMode || 'offline',
                batches: (coachCentre.batches || []).map((b: any) => ({
                  id: b.id,
                  name: b.name,
                  category: b.category,
                  categoryDisplayName: b.categoryDisplayName || (b.category ? getCategoryDisplayName(b.category) : undefined),
                  categoryEmoji: b.categoryEmoji || (b.category ? getCategoryEmoji(b.category) : undefined),
                  coachName: b.coachName,
                  time: b.pureSchedule || b.schedule,
                  schedule: b.pureSchedule || b.schedule,
                  ageGroup: b.ageGroup || 'All Ages',
                  monthlyFee: Number(b.monthlyFee) > 0 ? Number(b.monthlyFee) : coachStartingFee,
                  totalSeats: b.totalSeats || 15,
                  seatsFilled: b.seatsFilled || 0,
                })),
              };
              setAcademy(mapped);
              setIsOwnerPreview(true);
              setPreviewReason(subStatus.publicListingMessage);
              setLoading(false);
              return;
            }
          } catch (coachErr) {
            console.warn('Could not load private coach preview:', coachErr);
          }
        }

        setAcademy(null);
      } catch (err: any) {
        console.error('[DB_ERROR] Failed to load academy details in activities/[id] page:', err);
        setDbError(err?.message || 'Database connection error: Failed to load academy profile.');
        setAcademy(null);
      } finally {
        setLoading(false);
      }
  }, [id, activeCity, userEmail]);

  useEffect(() => {
    loadAcademy();
  }, [loadAcademy]);

  const { isSaved, toggleBookmark } = useBookmarks();
  const isBookmarked = isSaved(id);

  const handleBookmarkToggle = async () => {
    if (!academy?.id) return;
    await toggleBookmark(academy.id, academy.name);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: academy?.name || 'KnowUrCoach',
        text: `Check out ${academy?.name} on KnowUrCoach - 100% verified coaching!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Link copied to clipboard!');
    }
  };

  const handleBookTrial = (targetBatch?: any) => {
    if (!academy) return;
    if (isOwnerPreview) {
      showToast('ℹ️ Listing Preview Mode: Free trial bookings will be enabled for parents once your academy is verified and live.');
      return;
    }
    if (isGuest) {
      showToast('🎁 Please create a free parent account to claim your Free Trial pass!');
      router.push('/register-parent');
      return;
    }
    const isEvent = targetBatch && (targetBatch.nativeEvent || targetBatch._reactName || typeof targetBatch.preventDefault === 'function');
    const cleanBatch = isEvent ? null : targetBatch;
    const currentBatch = cleanBatch || academy.batches[selectedBatchIndex] || academy.batches[0];
    openModal('trial-booking', {
      acadId: academy.id,
      acadName: academy.name,
      locality: academy.localityName,
      category: academy.category,
      academy,
      batches: academy.batches,
      selectedBatchId: currentBatch?.id,
      selectedBatch: currentBatch,
    });
  };

  const handleEnrollBatch = (targetBatch?: any) => {
    if (!academy) return;
    if (isOwnerPreview) {
      showToast('ℹ️ Listing Preview Mode: Monthly batch enrollments will be enabled for parents once your academy is verified and live.');
      return;
    }
    if (isGuest) {
      showToast('Please sign in to enroll in monthly batches');
      router.push(`/login?callbackUrl=/activities/${id}`);
      return;
    }
    const isEvent = targetBatch && (targetBatch.nativeEvent || targetBatch._reactName || typeof targetBatch.preventDefault === 'function');
    const cleanBatch = isEvent ? null : targetBatch;
    const currentBatch = cleanBatch || academy.batches[selectedBatchIndex] || academy.batches[0];
    openModal('batch-booking', {
      acadId: academy.id,
      acadName: academy.name,
      locality: academy.localityName,
      category: academy.category,
      academy,
      batches: academy.batches,
      selectedBatchId: currentBatch?.id,
      selectedBatch: currentBatch,
    });
  };


  if (loading) {
    return <ActivityDetailSkeleton />;
  }

  if (dbError) {
    return (
      <div className="w-full bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center">
        <DatabaseErrorView
          title="Unable to Load Academy"
          message="We are having trouble loading this academy's details right now. Please try again."
          error={dbError}
          onRetry={loadAcademy}
        />
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
          🔒
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile Currently Unavailable</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          This academy listing is either undergoing verification or currently not published in the public directory. Only verified academies with approved safety credentials and active plans are available for parent bookings.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/activities"
            className="inline-flex items-center justify-center gap-2 bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-2xl transition-all shadow-md shadow-blue-500/20 text-xs"
          >
            <ArrowLeft size={16} weight="bold" />
            Explore Verified Academies
          </Link>
        </div>
      </div>
    );
  }

  const batchFees = (academy?.batches || [])
    .map((b) => Number(b.monthlyFee))
    .filter((fee) => !isNaN(fee) && fee > 0);
  const minBatchFee = batchFees.length > 0 ? Math.min(...batchFees) : 0;

  return (
    <div className="w-full bg-slate-50 pb-24 md:pb-16 text-slate-900">
      {/* 1. Breadcrumb & Top Bar */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 truncate">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
            <CaretRight size={12} weight="bold" className="text-slate-400 shrink-0" />
            <Link href="/activities" className="hover:text-emerald-600 transition-colors">{activeCity || 'Explore'} Academies</Link>
            <CaretRight size={12} weight="bold" className="text-slate-400 shrink-0" />
            <span className="text-slate-900 font-bold truncate">{academy.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Share Academy"
            >
              <ShareNetwork size={18} weight="bold" />
            </button>
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isBookmarked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Saved to shortlist' : 'Save Academy'}
            >
              <Heart size={18} weight={isBookmarked ? 'fill' : 'bold'} />
            </button>
          </div>
        </div>
      </div>

      {/* Private Owner Preview Alert Banner */}
      {isOwnerPreview && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                Owner Preview Mode
              </span>
              <span>
                🔒 <strong>Private Preview:</strong> {previewReason || 'This academy profile is not yet live to parents. Complete onboarding and verification to publish.'}
              </span>
            </div>
            <Link
              href="/coach/dashboard"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-1.5 rounded-xl transition-all shrink-0 shadow-xs"
            >
              Go to Coach Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 lg:pb-12">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start md:items-center justify-between">
          <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0 w-full">
            {(() => {
              const allActivities =
                academy.activities && academy.activities.length > 0
                  ? academy.activities
                  : [getCategoryDisplayName(academy.category)];

              const allCategorySlugs =
                academy.categorySlugs && academy.categorySlugs.length > 0
                  ? academy.categorySlugs
                  : (academy.category
                      ? academy.category.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
                      : ['education']);

              const primaryActivity = allActivities[0];
              const primarySlug = allCategorySlugs[0] || primaryActivity.toLowerCase().replace(/\s+/g, '-');
              const primaryEmoji = getCategoryEmoji(primarySlug || primaryActivity);
              const remainingCount = allActivities.length - 1;

              return (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider">
                    {academy.isTopInArea && (
                      <span className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                        <Star size={12} weight="fill" /> TOP IN AREA
                      </span>
                    )}
                    {academy.isVerifiedBatch ? (
                      <>
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <SealCheck size={12} weight="fill" /> VERIFIED BATCH
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <ShieldCheck size={12} weight="fill" /> Physical Safety Verified
                        </span>
                      </>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                        {isOwnerPreview ? 'Pending Physical Verification' : 'Self-Listed Profile'}
                      </span>
                    )}

                    {/* Primary Activity Pill */}
                    <span className="bg-purple-50 text-purple-800 border border-purple-200/90 px-2.5 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-2xs">
                      <span className="text-xs">{primaryEmoji}</span>
                      <span>{primaryActivity}</span>
                    </span>

                    {/* Delivery Format Badge (Online, Offline, Hybrid) */}
                    {(() => {
                      const modeInfo = resolveClassModeInfo(academy.classMode);
                      const ModeIcon = getClassModeIconComponent(modeInfo.icon);
                      const styles = getClassModeBadgeStyles(modeInfo.badgeColor);
                      return (
                        <span
                          className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-2xs ${styles.bg} ${styles.text} ${styles.border}`}
                          title={`Delivery Mode: ${modeInfo.label}`}
                        >
                          <ModeIcon size={12} weight="bold" />
                          <span>{modeInfo.label}</span>
                        </span>
                      );
                    })()}

                    {/* Interactive '+X more' Badge Button */}
                    {remainingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        aria-expanded={showAllActivities}
                        className="bg-purple-100/80 hover:bg-purple-200/90 text-purple-900 border border-purple-300/90 px-2 sm:px-2.5 py-1 rounded-md flex items-center gap-1 font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 text-[9px] sm:text-[10px]"
                        title={showAllActivities ? 'Collapse extra offerings' : `View all ${allActivities.length} programs offered`}
                      >
                        <span>+{remainingCount} more</span>
                        <CaretDown
                          size={11}
                          weight="bold"
                          className={`transition-transform duration-200 ${showAllActivities ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Expanded Offerings & Curriculum Drawer */}
                  {showAllActivities && remainingCount > 0 && (
                    <div className="w-full bg-gradient-to-br from-purple-50/95 via-indigo-50/80 to-slate-50 border border-purple-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-1.5">
                            <span>🎓</span>
                            <span>All {allActivities.length} Programs &amp; Disciplines Offered</span>
                          </span>
                          <span className="hidden sm:inline-block text-[10px] text-purple-700 font-semibold bg-purple-100/90 px-2 py-0.5 rounded-full">
                            Interactive Explorer
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAllActivities(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-white/80 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Close</span>
                          <X size={12} weight="bold" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {allActivities.map((act, idx) => {
                          const slug = allCategorySlugs[idx] || act.toLowerCase().replace(/\s+/g, '-');
                          const emoji = getCategoryEmoji(slug || act);
                          const isPrimary = idx === 0;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedDisciplineIndex(idx);
                                const currEl = document.getElementById('curriculum-explorer');
                                if (currEl) {
                                  currEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                  const batchEl = document.getElementById('batches-section');
                                  if (batchEl) {
                                    batchEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }
                              }}
                              className={`group text-left px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 ${
                                isPrimary
                                  ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                                  : 'bg-white hover:bg-purple-50/90 text-slate-800 border-slate-200/90 hover:border-purple-300'
                              }`}
                            >
                              <span className="text-sm">{emoji}</span>
                              <span className="leading-tight">{act}</span>
                              <CaretRight
                                size={12}
                                weight="bold"
                                className={`transition-transform group-hover:translate-x-0.5 ${
                                  isPrimary ? 'text-white/80' : 'text-slate-400 group-hover:text-purple-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-purple-700 font-medium">
                          <span>💡</span> Tap any program to view syllabus, age eligibility &amp; batch schedules below
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('curriculum-explorer') || document.getElementById('batches-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="text-purple-700 hover:text-purple-900 font-extrabold underline decoration-purple-300 cursor-pointer hidden sm:inline"
                        >
                          View Curriculum Explorer ↓
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#0a1128] tracking-tight">
              {academy.name}
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {academy.tagline ? academy.tagline.replace(/kamla nagarkamla nagar/gi, 'Kamla Nagar') : ''}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-slate-600 pt-0.5 sm:pt-1">
              {academy.reviewsCount > 0 ? (
                <a
                  href="#reviews-section"
                  className="flex items-center gap-1.5 font-bold text-slate-900 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="View Verified Parent Reviews"
                >
                  <Star size={14} weight="fill" className="text-yellow-500" />
                  {academy.rating.toFixed(1)}
                  <span className="text-slate-500 font-semibold underline decoration-slate-300">
                    ({academy.reviewsCount} {academy.reviewsCount === 1 ? 'Verified Review' : 'Verified Reviews'})
                  </span>
                </a>
              ) : (
                <a
                  href="#reviews-section"
                  className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs"
                  title="Be the first enrolled parent to rate!"
                >
                  <Sparkle size={13} weight="fill" className="text-emerald-600" />
                  <span>New on Platform</span>
                  <span className="text-emerald-600/80 font-medium">(Be the 1st to rate)</span>
                </a>
              )}

              <span className="flex items-center gap-1.5 font-semibold">
                <MapPin size={15} weight="bold" className="text-red-500" />
                {academy.localityName}, {academy.city || activeCity || 'India'}
                {academy.distanceText && academy.distanceText.trim() ? (
                  <> • <strong className="text-slate-900">{academy.distanceText}</strong></>
                ) : null}
              </span>

              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Users size={15} weight="bold" className="text-blue-500" />
                {academy.ageText}
              </span>
            </div>

            {/* Mobile Quick Booking Card (Compact & Proportional for Mobile) */}
            <div className="lg:hidden w-full pt-2.5 mt-2 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">Monthly Tuition:</span>
                  {minBatchFee > 0 ? (
                    <span className="text-sm font-black text-[#0a1128]">
                      ₹{minBatchFee.toLocaleString('en-IN')}
                      <span className="text-[10px] font-normal text-slate-500"> /mo</span>
                    </span>
                  ) : (
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Fee on Inquiry
                    </span>
                  )}
                </div>
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shadow-2xs">
                  <CheckCircle size={11} weight="fill" className="text-emerald-600" />
                  Zero Platform Fee
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBookTrial()}
                  className="bg-[#0066ff] hover:bg-blue-700 text-white font-bold py-2 px-2.5 rounded-xl text-[11px] shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ticket size={14} weight="bold" />
                  <span>Book Free Trial</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEnrollBatch()}
                  className="bg-slate-900 hover:bg-black text-white font-bold py-2 px-2.5 rounded-xl text-[11px] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus size={14} weight="bold" />
                  <span>Enroll Batch</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <button
                  type="button"
                  onClick={() => openModal('compare-academies', { centreIds: [academy.id] })}
                  className="flex items-center gap-1 text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  <Scales size={12} weight="bold" />
                  <span>Compare Academy</span>
                </button>
                <a
                  href="#inquire-section"
                  className="text-slate-600 font-bold hover:underline text-[10px]"
                >
                  Ask Coach Question →
                </a>
              </div>
            </div>
          </div>

          {/* Quick CTA on Desktop Header */}
          <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">Monthly Coaching Tuition</div>
              {minBatchFee > 0 ? (
                <div className="text-2xl font-black text-[#0a1128]">
                  Starts from ₹{minBatchFee.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
              ) : (
                <div className="text-xl font-black text-blue-700">
                  Fee on Inquiry
                  <span className="text-xs font-normal text-slate-400 block font-sans">Contact coach for batch fees</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openModal('compare-academies', { centreIds: [academy.id] })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-slate-200"
                title="Compare this academy with others"
              >
                <Scales size={16} weight="bold" />
                <span>Compare</span>
              </button>
              <button
                onClick={() => handleBookTrial()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Ticket size={16} weight="bold" />
                Book Free Trial Session
              </button>
            </div>
          </div>
        </div>

        {/* 3. Image / Branded Graphic Showcase */}
        {(() => {
          const primarySlug =
            (academy.categorySlugs && academy.categorySlugs[0]) ||
            (academy.category ? academy.category.split(',')[0].trim().toLowerCase() : 'education');
          const activePillar =
            (academy.primaryPillar || (primarySlug ? getCategoryPillar(primarySlug) : 'education')) as string;
          const pillarStyles = PILLAR_SHOWCASE_THEMES[activePillar] || PILLAR_SHOWCASE_THEMES.education;

          if (academy.hasCustomImage && academy.image) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 h-[260px] sm:h-[340px] rounded-3xl overflow-hidden relative border border-slate-200/80 shadow-xs group">
                  <img
                    src={academy.image}
                    alt={academy.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <SealCheck size={14} weight="fill" className="text-blue-400" />
                    Verified Center Photos
                  </div>
                </div>

                <div className="hidden md:flex flex-col gap-4 h-[340px]">
                  <div className="flex-1 rounded-3xl overflow-hidden relative border border-slate-200/80">
                    <img
                      src={academy.venuePhotos?.[1] || academy.image}
                      alt="Academy Infrastructure"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      Academy Facilities
                    </span>
                  </div>
                  <div className="flex-1 rounded-3xl overflow-hidden relative border border-slate-200/80">
                    <img
                      src={academy.venuePhotos?.[2] || academy.image}
                      alt="Training Batches"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      Training Batches
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          /* OPTION 4: INTERACTIVE MULTI-DISCIPLINE ACADEMY SHOWCASE & CURRICULUM EXPLORER */
          const categoryList =
            academy.categorySlugs && academy.categorySlugs.length > 0
              ? academy.categorySlugs
              : (academy.category ? academy.category.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : ['education']);

          const safeSelectedIdx = selectedDisciplineIndex < categoryList.length ? selectedDisciplineIndex : 0;
          const activeDisciplineSlug = categoryList[safeSelectedIdx] || 'education';
          const activeDisciplineName = getCategoryDisplayName(activeDisciplineSlug);
          const activeDisciplineEmoji = getCategoryEmoji(activeDisciplineSlug);
          const activeDisciplinePillar = getCategoryPillar(activeDisciplineSlug);
          const disciplineData = getDisciplineHighlights(activeDisciplineSlug, activeDisciplinePillar);

          return (
            <div id="curriculum-explorer" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch scroll-mt-24">
              {/* Left Side (2 cols on lg): Interactive Curriculum Deck */}
              <div
                className={`lg:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-gradient-to-br ${pillarStyles.gradient} text-white border ${pillarStyles.border} shadow-lg relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Ambient dynamic glow */}
                <div
                  className={`absolute -top-24 -right-24 w-80 h-80 rounded-full ${pillarStyles.ambientGlow} blur-3xl pointer-events-none`}
                />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

                {/* Header row: Interactive title & category switcher */}
                <div className="space-y-2.5 sm:space-y-3 z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/10 backdrop-blur-md text-white border border-white/15 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <Sparkle size={13} weight="fill" className="text-amber-400" />
                        INTERACTIVE CURRICULUM EXPLORER
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <span>{categoryList.length} Disciplines Offered</span>
                    </span>
                  </div>

                  {/* Category switcher tabs */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                      Tap an activity to explore outcomes:
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-1 pt-0.5 -mx-1 px-1">
                      {categoryList.map((slug, idx) => {
                        const isActive = idx === safeSelectedIdx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDisciplineIndex(idx)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                              isActive
                                ? 'bg-white text-slate-950 shadow-md scale-[1.02] sm:scale-105 ring-2 ring-white/50'
                                : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                            }`}
                          >
                            <span>{getCategoryEmoji(slug)}</span>
                            <span>{getCategoryDisplayName(slug)}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Active Discipline Preview Body */}
                <div className="my-3 sm:my-5 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-2.5 sm:space-y-4 z-10 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg sm:text-xl shrink-0">
                        {activeDisciplineEmoji}
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                          Active Focus
                        </span>
                        <h3 className="text-sm sm:text-lg font-black text-white leading-tight">
                          {activeDisciplineName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      {disciplineData.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="bg-white/10 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/10"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-blue-200">
                    {disciplineData.headline}
                  </p>

                  <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-200">
                    {disciplineData.points.slice(0, 3).map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle size={14} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Interactive Action Bar inside Active Discipline */}
                  <div className="pt-2.5 sm:pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setInquiryCategory(activeDisciplineName);
                        setInquiryMessage(
                          `Hi Coach ${academy.coachName}, I would like to inquire about admission, batch timings, and fee details for ${activeDisciplineName} at ${academy.name}.`
                        );
                        const el = document.getElementById('inquire-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <ChatCircleDots size={14} weight="fill" className="text-blue-600" />
                      <span>Inquire for {activeDisciplineName} →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookTrial()}
                      className="hidden sm:inline-flex bg-white/15 hover:bg-white/25 text-white border border-white/20 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer items-center gap-1.5"
                    >
                      <Ticket size={15} weight="bold" />
                      <span>Book Free 1-Day Trial</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Trust Ribbon (Hidden on mobile to save vertical space) */}
                <div className="hidden sm:flex pt-3 border-t border-white/10 flex-wrap items-center justify-around gap-2 text-[10px] sm:text-[11px] text-slate-300 font-semibold z-10">
                  <span className="flex items-center gap-1 text-emerald-300 font-extrabold">
                    <CheckCircle size={13} weight="fill" /> 100% Free Trial Pass Available
                  </span>
                  <span className="flex items-center gap-1 text-blue-300 font-extrabold">
                    <ShieldCheck size={13} weight="fill" /> Direct Coach Contact
                  </span>
                  <span className="flex items-center gap-1 text-amber-300 font-extrabold">
                    <Sparkle size={13} weight="fill" /> Zero Platform Fee Guarantee
                  </span>
                </div>
              </div>

              {/* Right Side: 2 Verified Quality & Admission Spec Cards (Hidden on mobile to eliminate duplicate stacked cards) */}
              <div className="hidden lg:flex flex-col gap-4">
                {/* Spec Card 1: Verified Physical Safety Audit */}
                <div className="flex-1 rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                      <ShieldCheck size={16} weight="fill" className="text-emerald-600" />
                      <span>Safety &amp; Facility Audit</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Audit Passed ✓
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <VideoCamera size={16} weight="fill" className="text-blue-600 shrink-0" />
                      <span className="truncate">
                        {academy.cctvMonitored ? '24/7 CCTV Monitored Facility' : 'Supervised Activity Area'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <FirstAid size={16} weight="fill" className="text-rose-600 shrink-0" />
                      <span className="truncate">
                        {academy.firstAidAvailable ? 'Emergency First Aid Kit Ready' : 'Safety Protocols in Place'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <Buildings size={16} weight="fill" className="text-purple-600 shrink-0" />
                      <span className="truncate">Physical Premises Inspected</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <GraduationCap size={16} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {academy.policeVerifiedStaff ? 'Police Verified Staff' : 'Faculty ID &amp; KYC Cleared'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium text-center pt-1 border-t border-slate-100">
                    Certificate #KUC-AUD-{academy.id.slice(-6).toUpperCase()} • Verified by Field Team
                  </div>
                </div>

                {/* Spec Card 2: Transparent Batch & Admission Policy */}
                <div className="flex-1 rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                      <Clock size={16} weight="fill" className="text-blue-600" />
                      <span>Admissions &amp; Batches</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {academy.batches && academy.batches.length > 0
                        ? `${academy.batches.length} Listed ${academy.batches.length === 1 ? 'Batch' : 'Batches'}`
                        : 'Admissions Open'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold text-[11px]">Batch Schedules</span>
                      <span className="font-extrabold text-slate-800 text-[11px]">
                        {academy.batches && academy.batches.length > 0
                          ? 'Morning & Evening Slots'
                          : 'Flexible Slots on Request'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold text-[11px]">Coaching Attention</span>
                      <span className="font-extrabold text-emerald-700 text-[11px]">
                        {academy.ratio || '1 : 8'} Student-Faculty
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold text-[11px]">Direct Support</span>
                      <span className="font-extrabold text-blue-700 text-[11px]">
                        Direct Reception &amp; Coach
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium text-center pt-1 border-t border-slate-100">
                    Transparent pricing • Zero broker or commission markups
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            STICKY SUB-NAVIGATION PILLS BAR
            Allows 1-tap jumping to any section without infinite scrolling
           ======================================================== */}
        <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-200/80 p-1 sm:p-1.5 shadow-xs overflow-x-auto hide-scrollbar flex items-center gap-1 sm:gap-1.5">
          <a
            href="#batches-section"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Clock size={14} weight="fill" className="text-blue-600" />
            <span>Batches</span>
          </a>
          <a
            href="#coach-safety-section"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <GraduationCap size={14} weight="fill" className="text-emerald-600" />
            <span>Coach &amp; Safety</span>
          </a>
          <a
            href="#facilities-location-section"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Buildings size={14} weight="fill" className="text-purple-600" />
            <span>Amenities &amp; Map</span>
          </a>
          <a
            href="#reviews-section"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <Star size={14} weight="fill" className="text-amber-500" />
            <span>Reviews {academy.reviewsCount > 0 ? `(${academy.reviewsCount})` : ''}</span>
          </a>
          <a
            href="#inquire-section"
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <ChatCircleDots size={14} weight="fill" className="text-blue-500" />
            <span>Ask Coach</span>
          </a>
        </div>

        {/* 4. 2-COLUMN DESKTOP EDITORIAL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8 items-start">
          {/* ========================================================
              LEFT COLUMN (65% width): Streamlined Editorial Specs
             ======================================================== */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* ----------------------------------------------------
                SECTION 1: AVAILABLE BATCHES & TIMINGS
               ---------------------------------------------------- */}
            <div id="batches-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-100 pb-2.5 sm:pb-3.5">
                <div className="flex items-center gap-2">
                  <Clock size={20} weight="fill" className="text-blue-600" />
                  <h2 className="text-base sm:text-xl font-extrabold text-[#0a1128]">
                    Available Batches &amp; Timings
                  </h2>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                  Select a slot for trial or enrollment
                </span>
              </div>

              {/* Category Filter Pills (if multiple categories present) */}
              {(() => {
                const uniqueBatchCats = Array.from(
                  new Set(
                    (academy.batches || [])
                      .map((b) => b.category?.toLowerCase())
                      .filter(Boolean) as string[]
                  )
                );

                if (uniqueBatchCats.length <= 1) return null;

                return (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBatchCategoryFilter('all')}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        batchCategoryFilter === 'all'
                          ? 'bg-[#0066ff] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Activities ({academy.batches.length})
                    </button>
                    {uniqueBatchCats.map((cat) => {
                      const count = academy.batches.filter((b) => b.category?.toLowerCase() === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBatchCategoryFilter(cat)}
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            batchCategoryFilter === cat
                              ? 'bg-[#0066ff] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{getCategoryEmoji(cat)}</span>
                          <span>{getCategoryDisplayName(cat)}</span>
                          <span className="opacity-80">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="space-y-3">
                {(() => {
                  const filteredBatches = (academy.batches || []).filter((b) => {
                    if (batchCategoryFilter === 'all') return true;
                    return b.category?.toLowerCase() === batchCategoryFilter.toLowerCase();
                  });

                  if (filteredBatches.length === 0) {
                    return (
                      <div className="p-6 bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-2xl border border-dashed border-blue-200/80 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                          <CalendarPlus size={20} weight="fill" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Flexible Batch Slots Available on Request</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5 leading-relaxed">
                            {academy.name} accommodates students with flexible weekday &amp; weekend schedules. You can request customized timings or schedule an introductory trial.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <a
                            href="#inquire-section"
                            onClick={() => {
                              setInquiryMessage(`Hi Coach ${academy.coachName}, I would like to inquire about available batch timings for ${academy.name}.`);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <ChatCircleDots size={14} weight="bold" />
                            <span>Request Batch Timing</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleBookTrial()}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Book 1-Day Trial
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return filteredBatches.map((batch, index) => {
                    const isSelected = selectedBatchIndex === index;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedBatchIndex(index)}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-2.5 sm:gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">{batch.name}</h4>
                            {batch.category && (
                              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                                <span>{getCategoryEmoji(batch.category)}</span>
                                <span>{getCategoryDisplayName(batch.category)}</span>
                              </span>
                            )}
                            {isSelected && (
                              <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                Selected Slot
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} weight="bold" className="text-blue-600" />
                              <strong className="text-slate-800">{batch.time}</strong>
                            </span>
                            {batch.ageGroup && (
                              <span className="flex items-center gap-1 text-slate-500">
                                • Age: <strong className="text-slate-700">{batch.ageGroup}</strong>
                              </span>
                            )}
                            {batch.coachName && (
                              <span className="flex items-center gap-1 text-slate-500">
                                • Coach: <strong className="text-slate-700">{batch.coachName}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                          {batch.monthlyFee !== undefined && (
                            <div className="text-left md:text-right">
                              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block uppercase">Tuition Fee</span>
                              <span className="font-mono font-extrabold text-xs sm:text-sm text-emerald-700">
                                {Number(batch.monthlyFee) > 0 ? `₹${batch.monthlyFee}/mo` : 'Fee on Inquiry'}
                              </span>
                            </div>
                          )}
                          <span className="text-[11px] sm:text-xs font-bold text-amber-700 bg-amber-100/80 px-2 sm:px-2.5 py-1 rounded-lg">
                            {batch.seats}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookTrial(batch);
                            }}
                            className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            Book Free Trial
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 2: HEAD COACH & PHYSICAL SAFETY AUDIT (Unified)
               ---------------------------------------------------- */}
            <div id="coach-safety-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-6 scroll-mt-28">
              {/* Part A: Head Coach Profile */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 sm:pb-3 mb-3 sm:mb-4">
                  <GraduationCap size={20} weight="fill" className="text-emerald-600" />
                  <h2 className="text-base sm:text-xl font-extrabold text-[#0a1128]">
                    Head Coach &amp; Training Faculty
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
                    {academy.coachName.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm sm:text-lg font-black text-slate-900">{academy.coachName}</h3>
                      {academy.nisCertified ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          NIS Certified ✓
                        </span>
                      ) : academy.primaryPillar === 'education' ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Academic Faculty ✓
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                          KYC Verified Mentor ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-blue-600">{academy.coachTitle}</p>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      {academy.coachBio ||
                        (academy.primaryPillar === 'education'
                          ? `Dedicated academic mentor focused on conceptual clarity, student engagement, and structured learning for children in ${academy.localityName}, ${academy.city || 'Agra'}.`
                          : `Professional athletic mentor specializing in youth agility, technique discipline, and tournament coaching in ${academy.city || 'Agra'}.`)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-2.5 sm:pt-3 text-center">
                  <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Ratio</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{academy.ratio || '1 : 8'}</div>
                  </div>
                  <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Faculty</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                      {academy.coachesCount || 1} {academy.primaryPillar === 'education' ? (academy.coachesCount === 1 ? 'Faculty' : 'Faculty') : (academy.coachesCount === 1 ? 'Coach' : 'Coaches')}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Staff KYC</div>
                    <div className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5">
                      {academy.policeVerifiedStaff ? '100% Cleared' : 'ID Verified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Part B: Physical Safety Audit Report */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-emerald-200/80 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} weight="fill" className="text-emerald-600" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                        Physical Safety Audit Checklist
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold">
                        Inspection Certificate #KUC-AUD-{academy.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Safe
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-xs">
                  <div className="bg-white/80 p-2 sm:p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                    <VideoCamera size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[10px] sm:text-[11px] font-semibold">
                      {academy.cctvMonitored
                        ? (academy.primaryPillar === 'sports' ? '24/7 CCTV Surveillance Courts & Gate' : '24/7 CCTV Monitored Classrooms & Entrance')
                        : 'Supervised Activity Area & Monitored Access'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 sm:p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                    <FirstAid size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[10px] sm:text-[11px] font-semibold">
                      {academy.firstAidAvailable ? 'First Aid Medical Kit & Emergency Protocols Ready' : 'Emergency Contact & First Responder Support'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 sm:p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[10px] sm:text-[11px] font-semibold">
                      {academy.policeVerifiedStaff ? 'Police Verified Background for All Staff' : 'Identity Verified Staff & Background Screened'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 sm:p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                    <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[10px] sm:text-[11px] font-semibold">Clean, Child-Safe &amp; Hygienic Washrooms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 3: AMENITIES & CAMPUS LOCATION (Unified)
               ---------------------------------------------------- */}
            <div id="facilities-location-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
                <Buildings size={20} weight="fill" className="text-purple-600" />
                <h2 className="text-base sm:text-xl font-extrabold text-[#0a1128]">
                  Campus Facilities &amp; Location
                </h2>
              </div>

              {/* Amenities Grid */}
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                  Infrastructure &amp; Amenities
                </span>
                {academy.facilities && academy.facilities.length > 0 ? (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                    {academy.facilities.map((facility, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                        <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                        <span className="truncate">{facility}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">Supervised Learning Area</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">Clean Drinking Water</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">{academy.cctvMonitored ? '24/7 CCTV Monitored' : 'Child-Safe Environment'}</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">{academy.firstAidAvailable ? 'First Aid On Site' : 'Safety First Response'}</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">Hygienic Restrooms</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">Dedicated Activity Space</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Location Card */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1.5 sm:space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <MapPin size={15} weight="fill" className="text-red-500" />
                    <span>{academy.name}</span>
                  </div>
                  {academy.distanceText && academy.distanceText.trim() ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[9px] sm:text-[10px]">
                      📍 {academy.distanceText.includes('away') ? academy.distanceText : `${academy.distanceText} away`}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[9px] sm:text-[10px]">
                      📍 {academy.city || activeCity || 'India'}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{academy.address}</p>
                <div className="pt-0.5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(academy.name + ' ' + academy.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline text-[11px] sm:text-xs"
                  >
                    Open in Google Maps Navigation ↗
                  </a>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 4: DIRECT ACADEMY INQUIRY & QUESTIONS
               ---------------------------------------------------- */}
            <div id="inquire-section" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4 scroll-mt-28">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2">
                  <ChatCircleDots size={20} weight="fill" className="text-blue-600" />
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0a1128]">
                      Have Questions? Ask Coach {academy.coachName}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Inquiries go directly to the academy reception &amp; head coach.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/${academy.phone ? academy.phone.replace(/[^0-9]/g, '') : '919897012345'}?text=${encodeURIComponent(
                      `Hi Coach, I am inquiring about ${academy.name} on KnowUrCoach. Can you please provide more details?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    <WhatsappLogo size={15} weight="fill" className="text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${academy.phone || '+919897012345'}`}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    <Phone size={14} weight="bold" />
                    <span>Call Center</span>
                  </a>
                </div>
              </div>

              {inquirySent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2 animate-in fade-in">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle size={24} weight="fill" />
                  </div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Inquiry Delivered to Coach {academy.coachName}!
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    The academy reception has logged your query and will contact you shortly at <strong>{inquiryPhone}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInquirySent(false);
                      setInquiryMessage('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 underline pt-1 cursor-pointer"
                  >
                    Ask Another Question
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
                  {/* Quick question prompts chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(academy.primaryPillar === 'education' || academy.primaryPillar === 'brain-booster'
                      ? [
                          'Do you offer 1-on-1 personal tutoring or small batches?',
                          'Are study material and practice worksheets provided?',
                          'Can we schedule an initial assessment / trial class?',
                          'Do you cover CBSE / ICSE / State Board curriculum?',
                        ]
                      : academy.primaryPillar === 'arts'
                      ? [
                          'Do beginners need their own instruments or art supplies?',
                          'What is the batch schedule for school-going kids?',
                          'Can we try a 1-day demo session first?',
                          'Are certificates provided after completing the level?',
                        ]
                      : [
                          'Do you offer weekend batches?',
                          'What safety gear or sports equipment is required?',
                          'Can I meet the coach before enrolling?',
                          'Are transport or van services available?',
                        ]
                    ).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInquiryMessage(prompt)}
                        className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 transition-all text-left cursor-pointer"
                      >
                        + {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <input
                      type="text"
                      required
                      placeholder="Your Name *"
                      value={inquiryParentName}
                      onChange={(e) => setInquiryParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp Mobile Number *"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <textarea
                      required
                      rows={2}
                      placeholder="Type your question for the coach or reception..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      🔒 Delivered securely to academy coach roster
                    </span>
                    <button
                      type="submit"
                      disabled={inquirySending}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <PaperPlaneTilt size={14} weight="bold" />
                      <span>{inquirySending ? 'Sending...' : 'Send Inquiry'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ----------------------------------------------------
                SECTION 5: VERIFIED PARENT REVIEWS & RATINGS
               ---------------------------------------------------- */}
            <div id="reviews-section" className="scroll-mt-28">
              <AcademyReviewsSection
                academyId={academy.id}
                academyName={academy.name}
                initialRating={academy.rating}
                initialReviewsCount={academy.reviewsCount}
              />
            </div>

          </div>

          {/* ========================================================
              RIGHT STICKY SIDEBAR (35% width): High-Converting Booking Console
             ======================================================== */}
          <div className="hidden lg:block lg:sticky lg:top-20 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-500/20 shadow-lg space-y-5">
              
              {/* Dynamic Tuition Header */}
              {(() => {
                const selectedBatch = academy.batches?.[selectedBatchIndex] || academy.batches?.[0];
                const batchFees = (academy.batches || [])
                  .map((b) => Number(b.monthlyFee))
                  .filter((fee) => !isNaN(fee) && fee > 0);
                const minBatchFee = batchFees.length > 0 ? Math.min(...batchFees) : 0;
                const displayFee = Number(selectedBatch?.monthlyFee) > 0 ? Number(selectedBatch.monthlyFee) : minBatchFee;

                return (
                  <div className="border-b border-slate-100 pb-4 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Monthly Coaching Tuition
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                        Direct Coach Rate
                      </span>
                    </div>
                    {displayFee > 0 ? (
                      <div className="text-3xl font-black text-[#0a1128]">
                        ₹{displayFee.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-slate-400">/ month</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-blue-700">
                        Fee on Inquiry
                        <span className="text-xs font-normal text-slate-400 block font-sans">Contact academy directly for tuition fee</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500">
                      {academy.batches && academy.batches.length > 0 ? (
                        <>Selected slot: <strong>{selectedBatch?.name || 'Standard Batch'}</strong> ({selectedBatch?.time || 'Regular Schedule'})</>
                      ) : (
                        <>Batch timings &amp; slots flexible • Inquire with coach</>
                      )}
                    </p>
                  </div>
                );
              })()}

              {/* Slot / Batch Picker right inside sidebar */}
              {academy.batches && academy.batches.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Select Batch / Timing
                  </label>
                  <select
                    value={selectedBatchIndex}
                    onChange={(e) => setSelectedBatchIndex(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {academy.batches.map((b, idx) => (
                      <option key={idx} value={idx}>
                        {b.name} • {b.time} {Number(b.monthlyFee || minBatchFee) > 0 ? `(₹${b.monthlyFee || minBatchFee}/mo)` : '(Fee on Inquiry)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Free Trial Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-2xl border border-blue-200/80 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                  <Sparkle size={15} weight="fill" className="text-blue-600" />
                  Free 1-Day Trial Session Available
                </div>
                <p className="text-[10px] text-blue-800">
                  Evaluate training &amp; coach interaction on-court before paying any tuition fees.
                </p>
              </div>

              {/* Zero Parent Fee Guarantee */}
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  <CheckCircle size={16} weight="fill" />
                </div>
                <div>
                  <strong className="block font-black text-[10px] text-emerald-900">Zero Parent Platform Fee Guarantee</strong>
                  <span className="text-[9px] text-emerald-700">Parents never pay booking charges on KnowUrCoach.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => handleBookTrial()}
                  className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket size={18} weight="bold" />
                  <span>Book Free Trial Pass</span>
                </button>

                <button
                  onClick={() => handleEnrollBatch()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <CalendarPlus size={16} weight="bold" />
                  <span>Enroll in Monthly Batch</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${academy.phone || '+919897012345'}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone size={14} weight="bold" />
                    Call Center
                  </a>

                  <a
                    href={`https://wa.me/${academy.phone ? academy.phone.replace(/[^0-9]/g, '') : '919897012345'}?text=${encodeURIComponent(
                      `Hi, I found ${academy.name} on KnowUrCoach. I want details for my child.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                  >
                    <WhatsappLogo size={15} weight="fill" className="text-emerald-600" />
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Direct Academy Settlement Policy */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                  <ShieldCheck size={14} weight="fill" className="text-emerald-600" />
                  <span>100% Verified Facility &amp; Direct Fee Policy</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Tuition settled directly with academy. KnowUrCoach guarantees physically audited facilities and background verified mentors.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 5. Mobile Sticky Bottom Booking Bar (Fixed, high converting, clean) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2.5 flex items-center justify-between gap-3 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">Monthly Tuition</span>
          {minBatchFee > 0 ? (
            <div className="text-base font-black text-[#0a1128] leading-tight">
              ₹{minBatchFee.toLocaleString('en-IN')}{' '}
              <span className="text-[10px] font-normal text-slate-400">/mo</span>
            </div>
          ) : (
            <div className="text-xs font-black text-blue-700 leading-tight">
              Fee on Inquiry
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://wa.me/${academy.phone ? academy.phone.replace(/[^0-9]/g, '') : '919897012345'}?text=${encodeURIComponent(
              `Hi Coach, I am inquiring about admissions at ${academy.name}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors shadow-2xs"
            title="Chat on WhatsApp"
          >
            <WhatsappLogo size={20} weight="fill" />
          </a>

          <a
            href="#inquire-section"
            className="hidden xs:inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-xl transition-colors"
          >
            Ask Coach
          </a>

          <button
            onClick={() => handleBookTrial()}
            className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Ticket size={16} weight="bold" />
            <span>Free Trial</span>
          </button>
        </div>
      </div>
    </div>
  );
}
