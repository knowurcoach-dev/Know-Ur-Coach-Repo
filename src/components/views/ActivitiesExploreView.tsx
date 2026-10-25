"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Academy } from '@/types';
import { AcademyCard } from '@/components/cards/AcademyCard';
import { ActivityCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getDiscoveryData } from '@/lib/actions';
import { resolveCentreCity, calculateDistance, formatDistanceText } from '@/lib/location';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import {
  getCategoryPillar,
  getCategoryDisplayName,
  getCategoryEmoji,
  resolveCategoryCoverImage,
  resolveCategoryFromSearch,
  CATEGORY_SHORT_NAMES,
  registerDynamicTaxonomy,
} from '@/lib/categories';
import {
  ArrowLeft,
  MagnifyingGlass,
  Star,
  SealCheck,
  CaretDown,
  SquaresFour,
  ArrowCounterClockwise,
  Trophy,
  Brain,
  Palette,
  GraduationCap,
  MapPin,
} from '@phosphor-icons/react';

const KNOWN_LOCALITIES: Array<{ pattern: RegExp; slug: string; name: string }> = [
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

function extractCleanLocality(
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

function parseAgeRange(ageText?: string): { min: number; max: number } | null {
  if (!ageText) return null;
  const clean = ageText.toLowerCase().trim();
  const rangeMatch = clean.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }
  const plusMatch = clean.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: 25 };
  }
  const underMatch = clean.match(/(?:under|u)\s*(\d+)/);
  if (underMatch) {
    return { min: 3, max: parseInt(underMatch[1], 10) };
  }
  const singleMatch = clean.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { min: val, max: val };
  }
  return null;
}

function matchesAgeGroup(ageText: string | undefined, selectedAge: string): boolean {
  if (selectedAge === 'all') return true;
  const range = parseAgeRange(ageText);
  if (!range) return true;

  let bMin = 3;
  let bMax = 18;
  switch (selectedAge) {
    case 'u5':
      bMin = 3;
      bMax = 5;
      break;
    case 'u8':
      bMin = 6;
      bMax = 8;
      break;
    case 'u12':
      bMin = 9;
      bMax = 12;
      break;
    case 'u16':
      bMin = 13;
      bMax = 25;
      break;
  }

  return range.min <= bMax && range.max >= bMin;
}

function matchesCategory(acad: Academy, catSlug: string): boolean {
  if (!catSlug || catSlug === 'all') return true;

  const rawSlugs: string[] = (
    acad.categorySlugs ||
    (acad.category ? acad.category.split(',') : [])
  )
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

  // Pillar-wide "All in Pillar" dynamic matching: works for any pillar from DB (sports, education, or newly added activities)
  if (catSlug.startsWith('all-')) {
    const targetPillar = catSlug.replace(/^all-/, '');
    return (
      rawSlugs.some((s: string) => getCategoryPillar(s) === targetPillar) ||
      getCategoryPillar(acad.category) === targetPillar
    );
  }

  const cleanSlug = catSlug.toLowerCase().trim();
  const cleanHyphen = cleanSlug.replace(/\s+/g, '-');
  const cleanSpace = cleanSlug.replace(/-/g, ' ');

  const name = (acad.name || '').toLowerCase();
  const tagline = (acad.tagline || '').toLowerCase();
  const cat = (acad.category || '').toLowerCase().trim();
  const activities = (acad.activities || []).map((a) => a.toLowerCase());
  const actText = (acad.activitiesText || '').toLowerCase();

  // 1. Direct slug or category list match
  if (
    rawSlugs.includes(cleanSlug) ||
    rawSlugs.includes(cleanHyphen) ||
    rawSlugs.includes(cleanSpace) ||
    cat === cleanSlug ||
    cat === cleanHyphen ||
    cat === cleanSpace
  ) {
    return true;
  }

  switch (cleanHyphen) {
    case 'education':
    case 'coaching-centres':
    case 'coaching-center':
    case 'coaching-centers':
    case 'academic-coaching':
    case 'tuition':
    case 'tuitions':
    case 'olympiad':
    case 'olympiads':
      return (
        rawSlugs.some((s) => s.includes('coaching') || s.includes('tuition') || s.includes('academic') || s.includes('olympiad') || s.includes('education')) ||
        cat.includes('coaching') ||
        cat.includes('tuition') ||
        cat.includes('academic') ||
        cat.includes('olympiad') ||
        cat.includes('education') ||
        name.includes('classes') ||
        name.includes('coaching') ||
        (name.includes('academy') && (name.includes('mb') || name.includes('study') || name.includes('science') || name.includes('math'))) ||
        tagline.includes('coaching') ||
        tagline.includes('tuition') ||
        tagline.includes('cbse') ||
        tagline.includes('icse') ||
        actText.includes('coaching') ||
        actText.includes('tuition') ||
        activities.some((a) => a.includes('coaching') || a.includes('tuition') || a.includes('olympiad'))
      );
    case 'home-tutor':
    case 'home-tutors':
      return (
        rawSlugs.includes('home-tutor') ||
        cat.includes('home-tutor') ||
        name.includes('home tutor') ||
        tagline.includes('home tutor') ||
        actText.includes('home tutor') ||
        activities.some((a) => a.includes('home tutor'))
      );
    case 'online-tutors':
    case 'online-tutors-(one-to-one-sessions)':
      return (
        rawSlugs.some((s) => s.includes('online-tutor')) ||
        cat.includes('online') ||
        name.includes('online') ||
        tagline.includes('online') ||
        actText.includes('online') ||
        activities.some((a) => a.includes('online'))
      );
    case 'table-tennis':
      return (
        rawSlugs.includes('table-tennis') ||
        rawSlugs.includes('table tennis') ||
        cat.includes('table-tennis') ||
        cat.includes('table tennis') ||
        name.includes('table tennis') ||
        name.includes('ping pong') ||
        name.includes('pingpong') ||
        tagline.includes('table tennis') ||
        actText.includes('table tennis') ||
        activities.some((a) => a.includes('table tennis') || a.includes('table-tennis') || a.includes('ping pong') || a.includes('pingpong'))
      );
    case 'tennis':
      return (
        rawSlugs.includes('tennis') ||
        rawSlugs.includes('lawn-tennis') ||
        cat === 'tennis' ||
        cat === 'lawn-tennis' ||
        (name.includes('tennis') && !name.includes('table tennis')) ||
        (tagline.includes('tennis') && !tagline.includes('table tennis')) ||
        (actText.includes('tennis') && !actText.includes('table tennis')) ||
        activities.some((a) => a.includes('tennis') && !a.includes('table tennis') && !a.includes('badminton'))
      );
    case 'badminton':
      return (
        rawSlugs.includes('badminton') ||
        cat === 'badminton' ||
        name.includes('badminton') ||
        name.includes('shuttle') ||
        tagline.includes('badminton') ||
        actText.includes('badminton') ||
        activities.some((a) => a.includes('badminton') || a.includes('shuttle'))
      );
    case 'cricket':
      return (
        rawSlugs.includes('cricket') ||
        cat === 'cricket' ||
        name.includes('cricket') ||
        tagline.includes('cricket') ||
        actText.includes('cricket') ||
        activities.some((a) => a.includes('cricket'))
      );
    case 'football':
      return (
        rawSlugs.includes('football') ||
        rawSlugs.includes('soccer') ||
        rawSlugs.includes('futsal') ||
        cat === 'football' ||
        cat === 'soccer' ||
        cat === 'futsal' ||
        name.includes('football') ||
        name.includes('turf') ||
        name.includes('soccer') ||
        tagline.includes('football') ||
        actText.includes('football') ||
        activities.some((a) => a.includes('football') || a.includes('soccer'))
      );
    case 'swimming':
      return (
        rawSlugs.includes('swimming') ||
        rawSlugs.includes('aquatics') ||
        cat === 'swimming' ||
        cat === 'aquatics' ||
        name.includes('swim') ||
        name.includes('aquatic') ||
        tagline.includes('swim') ||
        actText.includes('swim') ||
        activities.some((a) => a.includes('swim') || a.includes('aquatic'))
      );
    case 'martial-arts':
      return (
        rawSlugs.includes('martial-arts') ||
        rawSlugs.includes('karate') ||
        rawSlugs.includes('taekwondo') ||
        cat === 'martial-arts' ||
        cat === 'karate' ||
        cat === 'taekwondo' ||
        cat === 'judo' ||
        cat === 'mma' ||
        cat === 'boxing' ||
        name.includes('martial') ||
        name.includes('taekwondo') ||
        name.includes('karate') ||
        name.includes('combat') ||
        tagline.includes('martial') ||
        activities.some((a) => a.includes('karate') || a.includes('taekwondo') || a.includes('martial')) ||
        actText.includes('karate')
      );
    case 'skating':
      return (
        rawSlugs.includes('skating') ||
        rawSlugs.includes('roller-skating') ||
        cat === 'skating' ||
        cat === 'roller-skating' ||
        name.includes('skating') ||
        name.includes('skate') ||
        tagline.includes('skating') ||
        activities.some((a) => a.includes('skat')) ||
        actText.includes('skat')
      );
    case 'athletics':
      return (
        rawSlugs.includes('athletics') ||
        rawSlugs.includes('gymnastics') ||
        cat === 'athletics' ||
        cat === 'gymnastics' ||
        name.includes('athletic') ||
        name.includes('gymnast') ||
        tagline.includes('athletic') ||
        activities.some((a) => a.includes('athletic') || a.includes('gymnast'))
      );
    case 'stem':
    case 'robotics':
      return (
        rawSlugs.includes('stem') ||
        rawSlugs.includes('robotics') ||
        rawSlugs.includes('coding') ||
        cat === 'stem' ||
        cat === 'robotics' ||
        cat === 'coding' ||
        name.includes('robot') ||
        name.includes('stem') ||
        tagline.includes('robot') ||
        activities.some((a) => a.includes('robot') || a.includes('stem')) ||
        actText.includes('robot')
      );
    case 'chess':
      return (
        rawSlugs.includes('chess') ||
        cat === 'chess' ||
        name.includes('chess') ||
        tagline.includes('chess') ||
        activities.some((a) => a.includes('chess')) ||
        actText.includes('chess')
      );
    case 'coding':
      return (
        rawSlugs.includes('coding') ||
        rawSlugs.includes('python') ||
        cat === 'coding' ||
        name.includes('coding') ||
        name.includes('python') ||
        name.includes('developer') ||
        activities.some((a) => a.includes('cod') || a.includes('python')) ||
        actText.includes('coding')
      );
    case 'science-labs':
      return (
        rawSlugs.includes('science-labs') ||
        rawSlugs.includes('science') ||
        cat === 'science-labs' ||
        cat === 'science' ||
        name.includes('science') ||
        name.includes('experiment') ||
        activities.some((a) => a.includes('science') || a.includes('lab'))
      );
    case 'abacus':
      return (
        rawSlugs.includes('abacus') ||
        rawSlugs.includes('vedic-maths') ||
        cat === 'abacus' ||
        cat === 'vedic-maths' ||
        name.includes('abacus') ||
        name.includes('vedic') ||
        tagline.includes('abacus') ||
        activities.some((a) => a.includes('abacus') || a.includes('vedic'))
      );
    case "rubik's-cube":
    case 'rubiks-cube':
      return (
        rawSlugs.includes("rubik's-cube") ||
        rawSlugs.includes('rubiks-cube') ||
        cat.includes('rubik') ||
        name.includes('rubik') ||
        tagline.includes('rubik') ||
        actText.includes('rubik') ||
        activities.some((a) => a.includes('rubik') || a.includes('cube'))
      );
    case 'phonics':
      return (
        rawSlugs.includes('phonics') ||
        cat.includes('phonics') ||
        name.includes('phonic') ||
        tagline.includes('phonic') ||
        actText.includes('phonic') ||
        activities.some((a) => a.includes('phonic') || a.includes('reading'))
      );
    case 'handwriting':
      return (
        rawSlugs.includes('handwriting') ||
        cat.includes('handwriting') ||
        name.includes('handwriting') ||
        tagline.includes('handwriting') ||
        actText.includes('handwriting') ||
        activities.some((a) => a.includes('handwriting') || a.includes('cursive'))
      );
    case 'dance':
      return (
        rawSlugs.includes('dance') ||
        rawSlugs.includes('kathak') ||
        cat === 'dance' ||
        name.includes('dance') ||
        name.includes('kathak') ||
        tagline.includes('dance') ||
        activities.some((a) => a.includes('dance') || a.includes('kathak'))
      );
    case 'western-dance':
      return (
        rawSlugs.includes('western-dance') ||
        rawSlugs.includes('hip-hop') ||
        cat === 'western-dance' ||
        name.includes('hip hop') ||
        name.includes('western dance') ||
        activities.some((a) => a.includes('hip hop') || a.includes('western'))
      );
    case 'instruments':
      return (
        rawSlugs.includes('instruments') ||
        rawSlugs.includes('guitar') ||
        cat === 'instruments' ||
        name.includes('guitar') ||
        name.includes('keyboard') ||
        name.includes('piano') ||
        activities.some((a) => a.includes('guitar') || a.includes('piano') || a.includes('instrument'))
      );
    case 'music':
      return (
        rawSlugs.includes('music') ||
        rawSlugs.includes('sangeet') ||
        cat === 'music' ||
        cat === 'sangeet' ||
        name.includes('music') ||
        name.includes('vocal') ||
        activities.some((a) => a.includes('music') || a.includes('vocal') || a.includes('sangeet'))
      );
    case 'arts':
    case 'fine-arts':
      return (
        rawSlugs.includes('arts') ||
        rawSlugs.includes('fine-arts') ||
        rawSlugs.includes('painting') ||
        cat === 'arts' ||
        cat === 'fine-arts' ||
        cat === 'painting' ||
        name.includes('art') ||
        name.includes('paint') ||
        name.includes('draw') ||
        name.includes('sketch') ||
        activities.some((a) => a.includes('art') || a.includes('paint') || a.includes('sketch'))
      );
    default:
      return (
        rawSlugs.some((s: string) => s.includes(cleanHyphen) || s.includes(cleanSpace)) ||
        cat.includes(cleanHyphen) ||
        cat.includes(cleanSpace) ||
        name.includes(cleanSpace) ||
        tagline.includes(cleanSpace) ||
        activities.some((a) => a.includes(cleanSpace) || a.includes(cleanHyphen))
      );
  }
}

function mapCentreToAcademy(c: any, activeCity: string, userCoords?: { lat: number; lon: number } | null): Academy {
  const categorySlugs = (c.category ? c.category.split(',') : ['sports'])
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
  const activityNames = categorySlugs.map((slug: string) => getCategoryDisplayName(slug));

  const resolvedCity = c.city || resolveCentreCity(c) || activeCity || 'Agra';
  const cleanLoc = extractCleanLocality(c.locality, c.address);

  const locSlug = cleanLoc ? cleanLoc.slug : (c.locality ? c.locality.toLowerCase().replace(/\s+/g, '-') : '');
  const locName = cleanLoc ? cleanLoc.name : (c.locality ? c.locality.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : resolvedCity);

  const catSlug = (c.category || 'sports').toLowerCase();

  const batchFees = (c.batches || []).map((b: any) => Number(b.monthlyFee)).filter((f: any) => !isNaN(f) && f > 0);
  const startingFee = batchFees.length > 0 ? Math.min(...batchFees) : Number(c.monthlyTuitionFee || c.fee || 0);

  const isAllIndia = !activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india');
  let distance: number | undefined = undefined;
  let distanceText: string | undefined = undefined;

  if (!isAllIndia && userCoords && typeof c.latitude === 'number' && typeof c.longitude === 'number') {
    const distKm = calculateDistance(userCoords.lat, userCoords.lon, c.latitude, c.longitude);
    if (distKm <= 100) {
      distance = distKm;
      distanceText = formatDistanceText(distKm);
    }
  }

  return {
    id: c.id,
    name: c.name,
    tagline: c.tagline || 'Leading Academy for Youth',
    category: catSlug,
    categorySlugs,
    activities: activityNames.length > 0 ? activityNames : [getCategoryDisplayName(catSlug)],
    activitiesText: activityNames.length > 0 ? activityNames.join(' • ') : getCategoryDisplayName(catSlug),
    locality: locSlug,
    localityName: locName,
    city: resolvedCity,
    lat: c.latitude,
    lon: c.longitude,
    address: c.address,
    phone: c.phone,
    distance,
    distanceText,
    age: ['u8', 'u12', 'u16'] as any,
    ageText: c.eligibleAgeGroup || '5 - 16 Yrs',
    fee: startingFee,
    trialFee: Number(c.trialFee || 0),
    rating: Number(c.rating || 5.0),
    reviewsCount: Number(c.reviewsCount || 0),
    verifiedTag: c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : (c.isVerifiedBatch ? 'Verified Batch' : 'Safety Inspected'),
    image: c.image || resolveCategoryCoverImage(categorySlugs[0] || catSlug, ''),
    coachName: c.headCoachName || c.coachName || 'NIS Certified Coach',
    coachTitle: c.headCoachBio || c.coachTitle || '',
    coachesCount: c.coachesCount || 2,
    ratio: c.studentCoachRatio || '1 : 8',
    facilities: (c.facilities || []).map((f: any) => f.description || f),
    safety: '24/7 CCTV • First Aid • Police Verified',
    isTopInArea: Boolean(c.isTopInArea),
    planTier: c.planTier,
    isVerifiedBatch: Boolean(c.isVerifiedBatch),
    kycStatus: c.kycStatus,
    safetyGrade: c.safetyGrade,
    coachType: c.coachType,
    batches: (c.batches || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      time: b.schedule || b.time,
      schedule: b.schedule,
      ageGroup: b.ageGroup,
      seats: `${b.seatsFilled || 0}/${b.totalSeats || 20} Enrolled`,
      monthlyFee: Number(b.monthlyFee || startingFee || 0),
    })),
  };
}

function resolveActivityIcon(slug?: string, iconName?: string | null) {
  const s = (slug || '').toLowerCase();
  const ic = (iconName || '').toLowerCase();

  if (s === 'education' || ic.includes('grad') || ic.includes('book') || ic.includes('school')) {
    return GraduationCap;
  }
  if (s === 'brain-booster' || ic.includes('brain') || ic.includes('stem')) {
    return Brain;
  }
  if (s === 'arts' || ic.includes('palette') || ic.includes('paint') || ic.includes('art')) {
    return Palette;
  }
  if (s === 'sports' || ic.includes('trophy') || ic.includes('sport')) {
    return Trophy;
  }
  return SquaresFour;
}

export function ActivitiesExploreView({ initialData }: { initialData?: any } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCity: personaCity, activeLocality, activeCoords, setLocation } = usePersona();
  const { openModal } = useModalStore();

  const cityParam = searchParams.get('city');

  // Resolved activeCity: priority personaCity -> URL cityParam -> fallback 'Agra'
  const [activeCity, setActiveCity] = useState<string>(() => {
    if (cityParam && cityParam.trim()) return cityParam.trim();
    return personaCity || 'Agra';
  });

  const isInitialMountedRef = useRef(false);

  const rawCat = searchParams.get('category');
  const rawSearch = searchParams.get('search') || '';
  const rawLocality = searchParams.get('locality') || 'all';
  const rawAge = searchParams.get('age') || 'all';
  const rawActivity = searchParams.get('activity');

  // If category wasn't explicit in URL, infer from search term if matching
  const inferred = (!rawCat || rawCat === 'all') && rawSearch ? resolveCategoryFromSearch(rawSearch) : null;
  const initialCategory = rawCat || inferred?.category || 'all';
  const initialActivityPillar = rawActivity || (initialCategory !== 'all' ? getCategoryPillar(initialCategory) : (inferred?.pillar || 'all'));

  const [academiesList, setAcademiesList] = useState<Academy[]>(() => {
    const raw = initialData?.centres || initialData?.academies || [];
    if (raw.length > 0) {
      return raw.map((c: any) => mapCentreToAcademy(c, activeCity, activeCoords));
    }
    return [];
  });
  const [activitiesList, setActivitiesList] = useState<any[]>(() => initialData?.activities || []);
  const [isLoadingDb, setIsLoadingDb] = useState(!initialData?.centres || initialData.centres.length === 0);
  const [dbError, setDbError] = useState<string | null>(null);
  const initialLoadedRef = useRef(Boolean(initialData?.centres && initialData.centres.length > 0));

  // Selected Activity Pillar: 'all' | 'sports' | 'education' | 'brain-booster' | 'arts'
  const [selectedActivityPillar, setSelectedActivityPillar] = useState<string>(initialActivityPillar);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);
  const [selectedLocality, setSelectedLocality] = useState<string>(rawLocality);
  const [selectedAge, setSelectedAge] = useState<string>(rawAge);
  const [onlyTopInArea, setOnlyTopInArea] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'top' | 'rating' | 'distance' | 'fee-low'>('top');

  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Helper to synchronize URL query parameters without full page reloads
  const updateUrl = useCallback((newParams: Record<string, string | null | undefined>) => {
    if (typeof window === 'undefined') return;
    const current = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (
        v === null ||
        v === undefined ||
        v === '' ||
        v === 'all' ||
        (k === 'city' && (v.toLowerCase() === 'all' || v.toLowerCase().includes('india')))
      ) {
        current.delete(k);
      } else {
        current.set(k, v);
      }
    });
    const searchStr = current.toString();
    const newUrl = `${window.location.pathname}${searchStr ? `?${searchStr}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  // 1. Initial Mount: If city is provided in URL, sync it into PersonaContext
  useEffect(() => {
    if (!isInitialMountedRef.current) {
      isInitialMountedRef.current = true;
      if (cityParam && cityParam.trim() && cityParam.toLowerCase() !== (personaCity || '').toLowerCase()) {
        setLocation({ city: cityParam.trim(), locality: cityParam.trim() });
        setActiveCity(cityParam.trim());
      }
    }
  }, []);

  // 2. React to location changes from LocalityModal or header
  useEffect(() => {
    if (!isInitialMountedRef.current) return;
    if (personaCity && personaCity !== activeCity) {
      setActiveCity(personaCity);
      setSelectedLocality('all');
      updateUrl({ city: personaCity, locality: null });
    }
  }, [personaCity, activeCity, updateUrl]);

  // 3. React to browser back/forward or external searchParams changes
  useEffect(() => {
    const cat = searchParams.get('category');
    const act = searchParams.get('activity');
    const q = searchParams.get('search');
    const loc = searchParams.get('locality');
    const age = searchParams.get('age');
    const city = searchParams.get('city');

    let targetCat = cat;
    let targetPillar = act;

    if ((!targetCat || targetCat === 'all') && q) {
      const match = resolveCategoryFromSearch(q);
      if (match) {
        targetCat = match.category;
        if (!targetPillar || targetPillar === 'all') {
          targetPillar = match.pillar;
        }
      }
    }

    if (targetCat && targetCat !== selectedCategory) {
      setSelectedCategory(targetCat);
      if (targetCat !== 'all' && (!targetPillar || targetPillar === 'all')) {
        setSelectedActivityPillar(getCategoryPillar(targetCat));
      }
    }
    if (targetPillar && targetPillar !== selectedActivityPillar) {
      setSelectedActivityPillar(targetPillar);
    }
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
    if (loc && loc !== selectedLocality) {
      setSelectedLocality(loc);
    }
    if (age && age !== selectedAge) {
      setSelectedAge(age);
    }
    if (city && city !== activeCity) {
      setActiveCity(city);
    }
  }, [searchParams]);

  // 4. Debounced sync for search keyword input
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQueryInUrl = searchParams.get('search') || '';
      if (searchQuery.trim() !== currentQueryInUrl) {
        updateUrl({ search: searchQuery.trim() ? searchQuery.trim() : null });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, updateUrl]);

  // Fetch verified academies and taxonomy from DB
  const fetchDbData = useCallback(async () => {
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const res = await getDiscoveryData();
      if (res.activities) {
        setActivitiesList(res.activities);
      }
      const rawCentres = (res as any).centres || (res as any).academies || [];
      if (rawCentres.length > 0) {
        const mapped: Academy[] = rawCentres.map((c: any) => mapCentreToAcademy(c, activeCity, activeCoords));
        setAcademiesList(mapped);
      } else {
        setAcademiesList([]);
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to fetch discovery data in ActivitiesExploreView:', err);
      setDbError(err?.message || 'Database connection error: Failed to fetch discovery data.');
      setAcademiesList([]);
    } finally {
      setIsLoadingDb(false);
    }
  }, [activeCity, activeCoords]);

  useEffect(() => {
    if (initialLoadedRef.current) {
      initialLoadedRef.current = false;
      return;
    }
    fetchDbData();
  }, [fetchDbData]);

  // City-filtered academies
  const cityAcademies = useMemo(() => {
    if (!activeCity || activeCity.toLowerCase() === 'all' || activeCity.toLowerCase().includes('india')) {
      return academiesList;
    }
    return academiesList.filter((a) => {
      const cCity = a.city || resolveCentreCity(a);
      if (cCity.toLowerCase() === activeCity.toLowerCase()) return true;
      if (
        activeCity.toLowerCase() === 'delhi ncr' &&
        (cCity.toLowerCase().includes('delhi') || cCity.toLowerCase() === 'noida' || cCity.toLowerCase() === 'gurugram')
      ) {
        return true;
      }
      return false;
    });
  }, [academiesList, activeCity]);

  // Register dynamic DB taxonomy whenever activitiesList changes
  useEffect(() => {
    if (activitiesList && activitiesList.length > 0) {
      registerDynamicTaxonomy(activitiesList);
    }
  }, [activitiesList]);

  // Master list of categories compiled from DB activities
  const masterCategoriesList = useMemo(() => {
    const list: Array<{
      slug: string;
      name: string;
      shortName: string;
      imageUrl: string;
      badge?: string;
      pillar: string;
    }> = [];

    const seenSlugs = new Set<string>();

    if (activitiesList.length > 0) {
      activitiesList.forEach((act) => {
        (act.categories || []).forEach((cat: any) => {
          if (!seenSlugs.has(cat.slug)) {
            seenSlugs.add(cat.slug);
            list.push({
              slug: cat.slug,
              name: cat.name,
              shortName: CATEGORY_SHORT_NAMES[cat.slug] || cat.name,
              imageUrl: cat.imageUrl || resolveCategoryCoverImage(cat.slug, cat.imageUrl),
              badge: cat.badge,
              pillar: act.slug || getCategoryPillar(cat.slug),
            });
          }
        });
      });
    }

    return list;
  }, [activitiesList]);

  // Dynamic tabs generated directly from DB MajorActivity records (sports, education, brain-booster, arts, or new)
  const pillarTabs = useMemo(() => {
    const allTab = {
      id: 'all',
      label: 'All Activities',
      icon: SquaresFour,
      count: masterCategoriesList.length,
    };

    const fromDb = activitiesList.map((act) => {
      const Icon = resolveActivityIcon(act.slug, act.icon);
      const catCount = (act.categories || []).length || masterCategoriesList.filter((c) => c.pillar === act.slug).length;

      return {
        id: act.slug,
        label: act.name,
        icon: Icon,
        count: catCount,
      };
    });

    return [allTab, ...fromDb];
  }, [activitiesList, masterCategoriesList]);

  // Categories currently displayed in the Blinkit Left Rail (filtered by selected activity pillar)
  const displayedRailCategories = useMemo(() => {
    // 1. Root Item (All in Platform OR All in Selected Pillar)
    let rootItem: {
      slug: string;
      name: string;
      shortName: string;
      imageUrl: string;
      count: number;
      categoriesCount: number;
    };

    const currentAct = activitiesList.find((a) => a.slug === selectedActivityPillar);

    if (selectedActivityPillar !== 'all' && currentAct) {
      const pillarCentres = cityAcademies.filter((a) => {
        const raw = ((a as any).categorySlugs || (a.category ? a.category.split(',') : [])).map((s: string) => s.trim().toLowerCase());
        return raw.some((s: string) => getCategoryPillar(s) === selectedActivityPillar) || getCategoryPillar(a.category) === selectedActivityPillar;
      }).length;

      const actCategories = masterCategoriesList.filter((c) => c.pillar === selectedActivityPillar);

      rootItem = {
        slug: `all-${selectedActivityPillar}`,
        name: `All ${currentAct.name}`,
        shortName: `All ${currentAct.name.split('&')[0].trim()}`,
        imageUrl: currentAct.imageUrl || '',
        count: pillarCentres,
        categoriesCount: actCategories.length,
      };
    } else {
      rootItem = {
        slug: 'all',
        name: 'All Activities',
        shortName: `All (${masterCategoriesList.length})`,
        imageUrl: '',
        count: cityAcademies.length,
        categoriesCount: masterCategoriesList.length,
      };
    }

    // 2. Filter categories by pillar if a specific pillar is selected
    const filteredCats =
      selectedActivityPillar === 'all'
        ? masterCategoriesList
        : masterCategoriesList.filter((c) => c.pillar === selectedActivityPillar);

    const mapped = filteredCats.map((cat) => {
      const count = cityAcademies.filter((a) => matchesCategory(a, cat.slug)).length;
      return {
        slug: cat.slug,
        name: cat.name,
        shortName: cat.shortName,
        imageUrl: cat.imageUrl,
        badge: cat.badge,
        count,
        categoriesCount: 1,
      };
    });

    return [rootItem, ...mapped];
  }, [masterCategoriesList, selectedActivityPillar, cityAcademies]);

  // Available clean localities in active city (Excludes activeCity itself to prevent "Agra in Agra")
  const availableLocalities = useMemo(() => {
    const map = new Map<string, string>();
    const cityLower = (activeCity || '').toLowerCase().trim();

    cityAcademies.forEach((a) => {
      if (a.locality && a.locality !== 'all') {
        const clean = extractCleanLocality(a.locality, a.address);
        if (clean) {
          const slugLower = clean.slug.toLowerCase();
          if (
            slugLower !== cityLower &&
            !slugLower.includes('india') &&
            slugLower !== 'delhi-ncr' &&
            slugLower !== 'all'
          ) {
            map.set(clean.slug, clean.name);
          }
        }
      }
    });

    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [cityAcademies, activeCity]);

  // Filtered academies for right content panel
  const filteredAcademies = useMemo(() => {
    let result = [...cityAcademies];

    // Category / Pillar filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((a) => matchesCategory(a, selectedCategory));
    } else if (selectedActivityPillar !== 'all') {
      // If user selected a specific pillar tab but 'all' within that pillar
      result = result.filter((a) => {
        const raw = ((a as any).categorySlugs || (a.category ? a.category.split(',') : [])).map((s: string) => s.trim().toLowerCase());
        return raw.some((s: string) => getCategoryPillar(s) === selectedActivityPillar) || getCategoryPillar(a.category) === selectedActivityPillar;
      });
    }

    // Search query keyword filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isCategoryKeyword = selectedCategory && selectedCategory !== 'all' && (
        selectedCategory.toLowerCase() === q ||
        getCategoryDisplayName(selectedCategory).toLowerCase().includes(q) ||
        q.includes(selectedCategory.toLowerCase()) ||
        (q === 'dance' && (selectedCategory === 'dance' || selectedCategory === 'western-dance'))
      );

      if (!isCategoryKeyword) {
        result = result.filter((a) => {
          const qClean = q.trim();
          const qHyphen = qClean.replace(/\s+/g, '-');
          const qSpace = qClean.replace(/-/g, ' ');
          return (
            a.name.toLowerCase().includes(qClean) ||
            a.name.toLowerCase().includes(qSpace) ||
            (a.category && (a.category.toLowerCase().includes(qClean) || a.category.toLowerCase().includes(qHyphen) || a.category.toLowerCase().includes(qSpace))) ||
            (a.locality && a.locality.toLowerCase().includes(qClean)) ||
            (a.localityName && a.localityName.toLowerCase().includes(qClean)) ||
            (a.tagline && (a.tagline.toLowerCase().includes(qClean) || a.tagline.toLowerCase().includes(qSpace))) ||
            (a.activitiesText && (a.activitiesText.toLowerCase().includes(qClean) || a.activitiesText.toLowerCase().includes(qSpace))) ||
            (a.coachName && a.coachName.toLowerCase().includes(qClean)) ||
            (Array.isArray(a.activities) && a.activities.some((act: string) => act.toLowerCase().includes(qClean) || act.toLowerCase().includes(qSpace) || act.toLowerCase().includes(qHyphen)))
          );
        });
      }
    }

    // Locality filter
    if (selectedLocality && selectedLocality !== 'all') {
      const targetLoc = selectedLocality.toLowerCase().replace(/\s+/g, '-');
      const targetLocClean = selectedLocality.toLowerCase().replace(/-/g, ' ');
      result = result.filter((a) => {
        const aLoc = (a.locality || '').toLowerCase().replace(/\s+/g, '-');
        const aLocName = (a.localityName || '').toLowerCase();
        const aAddr = (a.address || '').toLowerCase();
        return (
          aLoc === targetLoc ||
          aLoc.includes(targetLoc) ||
          aLocName.includes(targetLocClean) ||
          aAddr.includes(targetLocClean)
        );
      });
    }

    // Age Group filter
    if (selectedAge !== 'all') {
      result = result.filter((a) => matchesAgeGroup(a.ageText, selectedAge));
    }

    // Premier Profiles Only (Top In Area / Premium Plan)
    if (onlyTopInArea) {
      result = result.filter((a) => Boolean(a.isTopInArea) || a.planTier === 'PREMIUM');
    }

    // Verified Centers Only (Verified Batch, Grade A+, Approved KYC)
    if (onlyVerified) {
      result = result.filter(
        (a: any) =>
          Boolean(a.isVerifiedBatch) ||
          a.safetyGrade === 'GRADE_A_PLUS' ||
          a.safetyGrade === 'GRADE_A' ||
          a.kycStatus === 'APPROVED' ||
          (a.verifiedTag && a.verifiedTag.toLowerCase().includes('verified'))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'fee-low') return (a.fee || 0) - (b.fee || 0);
      if (sortBy === 'distance') {
        const distA = typeof a.distance === 'number' ? a.distance : 999999;
        const distB = typeof b.distance === 'number' ? b.distance : 999999;
        return distA - distB;
      }
      if (a.isTopInArea && !b.isTopInArea) return -1;
      if (!a.isTopInArea && b.isTopInArea) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    return result;
  }, [
    cityAcademies,
    selectedCategory,
    selectedActivityPillar,
    searchQuery,
    selectedLocality,
    selectedAge,
    onlyTopInArea,
    onlyVerified,
    sortBy,
  ]);

  const handleSelectRailCategory = (slug: string) => {
    setSelectedCategory(slug);
    const isRoot = slug === 'all' || slug.startsWith('all-');
    updateUrl({
      category: isRoot ? null : slug,
      activity: selectedActivityPillar === 'all' ? null : selectedActivityPillar,
    });

    // Scroll results panel smoothly to top
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePillarChange = (pillar: string) => {
    setSelectedActivityPillar(pillar);
    const targetRoot = pillar === 'all' ? 'all' : `all-${pillar}`;

    setSelectedCategory(targetRoot);
    updateUrl({
      activity: pillar === 'all' ? null : pillar,
      category: null,
    });

    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedActivityPillar('all');
    setSearchQuery('');
    setSelectedLocality('all');
    setSelectedAge('all');
    setOnlyTopInArea(false);
    setOnlyVerified(false);
    setSortBy('top');
    updateUrl({
      category: null,
      activity: null,
      search: null,
      locality: null,
      age: null,
    });
  };

  const activeCategoryObj = masterCategoriesList.find((c) => c.slug === selectedCategory);
  const currentActObj = activitiesList.find((a) => a.slug === selectedActivityPillar);

  const activeCategoryTitle =
    selectedCategory === 'all' || selectedCategory.startsWith('all-')
      ? currentActObj
        ? currentActObj.name
        : 'All Kids Activities & Academies'
      : activeCategoryObj?.name || getCategoryDisplayName(selectedCategory);

  if (dbError) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <DatabaseErrorView
          title="Unable to Load Directory"
          message="We are having trouble loading academy listings right now. Please try again."
          error={dbError}
          onRetry={fetchDbData}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-104px)] md:h-[calc(100vh-65px)] bg-slate-50 flex flex-col overflow-hidden">
      {/* ========================================================
          TOP BREADCRUMB & ACTIVITY PILLAR SWITCHER BAR (DYNAMIC DB TABS)
         ======================================================== */}
      <div className="bg-white border-b border-slate-200 px-3.5 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 z-20">
        {/* Breadcrumb back to Browse Page */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <Link
            href="/activities"
            className="flex items-center gap-1 font-bold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Browse Categories</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
            {activeCategoryTitle}
          </span>
        </div>

        {/* Dynamic Activity Pillar Switcher Tabs from Database (All, Sports, Education, Brain, Arts, or any new DB activity) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          {pillarTabs.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedActivityPillar === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePillarChange(p.id)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? p.id === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon size={13} weight="bold" />
                <span>
                  {p.label} ({p.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Blinkit-Style Split Experience */}
      <div className="flex-1 flex w-full relative min-h-0">
        {/* ========================================================
            BLINKIT-STYLE FIXED LEFT SIDEBAR (Category Rail)
           ======================================================== */}
        <aside
          className="w-[82px] sm:w-[94px] md:w-36 lg:w-48 bg-white border-r border-slate-200 shrink-0 h-full overflow-y-auto hide-scrollbar py-2 z-10 shadow-xs flex flex-col"
          aria-label="Category Selector Rail"
        >
          <div className="space-y-1.5 px-1 sm:px-1.5">
            {displayedRailCategories.map((cat) => {
              const isSelected =
                selectedCategory === cat.slug ||
                (cat.slug === 'all' && selectedCategory === 'all') ||
                (cat.slug === 'all-sports' && selectedCategory === 'all-sports') ||
                (cat.slug === 'all-education' && selectedCategory === 'all-education') ||
                (cat.slug === 'all-brain-booster' && selectedCategory === 'all-brain-booster') ||
                (cat.slug === 'all-arts' && selectedCategory === 'all-arts');

              const isRootItem = cat.slug === 'all' || cat.slug.startsWith('all-');

              return (
                <button
                  key={cat.slug}
                  onClick={() => handleSelectRailCategory(cat.slug)}
                  className={`w-full flex flex-col sm:flex-col lg:flex-row items-center gap-1 sm:gap-1.5 lg:gap-2.5 p-1 sm:p-2 rounded-xl transition-all cursor-pointer text-center lg:text-left relative ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500/30'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                  title={`${cat.name} (${cat.count} centres)`}
                >
                  {/* Left Active Indicator Bar (Blinkit Rail visual) */}
                  {isSelected && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 rounded-r-full" />
                  )}

                  {/* Thumbnail Image / Icon */}
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                    {isRootItem ? (
                      <div
                        className={`w-full h-full flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <SquaresFour size={22} weight="duotone" />
                      </div>
                    ) : (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as any).src =
                            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop';
                        }}
                      />
                    )}
                    {isSelected && !isRootItem && (
                      <div className="absolute inset-0 bg-emerald-600/15" />
                    )}
                  </div>

                  {/* Title & Count (Optimized for Mobile so names NEVER get cut) */}
                  <div className="min-w-0 flex-1 leading-tight w-full">
                    {/* Mobile & Tablet Label (Shortened with line-clamp-2 and center alignment) */}
                    <div className="lg:hidden text-[9.5px] sm:text-[10.5px] font-bold leading-tight text-center line-clamp-2 px-0.5 break-words">
                      {cat.shortName || cat.name}
                    </div>

                    {/* Desktop Label (Full name with centers count) */}
                    <div className="hidden lg:block text-xs font-bold truncate max-w-full">
                      {cat.name}
                    </div>
                    <div className="hidden lg:block text-[9px] text-slate-400 font-medium">
                      {isRootItem ? `${cat.categoriesCount} Categories` : `${cat.count} centers`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ========================================================
            RIGHT MAIN CONTENT AREA (Listings & Filter Matrix)
           ======================================================== */}
        <main
          ref={resultsContainerRef}
          className="flex-1 min-w-0 h-full overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4"
        >
          {/* Top Header of Selected Category */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">{getCategoryEmoji(selectedCategory)}</span>
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight">
                  {activeCategoryTitle} in {activeCity}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing <strong>{filteredAcademies.length}</strong> verified coaching centers &amp; academies with free trial evaluations
              </p>
            </div>

            {/* Keyword Search within category */}
            <div className="relative w-full md:w-64">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search academy or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Quick Filters Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
            {/* City Location Button (Directly switch City from Explore bar) */}
            <button
              type="button"
              onClick={() => openModal('locality-selector')}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs"
              title="Change City"
            >
              <MapPin size={13} weight="fill" className="text-emerald-600 shrink-0" />
              <span>{activeCity}</span>
              <CaretDown size={11} className="text-emerald-700" />
            </button>

            {/* Premier Profiles Toggle */}
            <button
              onClick={() => setOnlyTopInArea(!onlyTopInArea)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                onlyTopInArea
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star size={13} weight="fill" className={onlyTopInArea ? 'text-white' : 'text-amber-500'} />
              <span>Premier Profiles</span>
            </button>

            {/* Verified Batches Toggle */}
            <button
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                onlyVerified
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SealCheck size={14} weight="fill" className={onlyVerified ? 'text-white' : 'text-blue-600'} />
              <span>Verified Batches</span>
            </button>

            {/* Age Filter Chips */}
            {[
              { id: 'all', label: 'All Ages' },
              { id: 'u5', label: '👶 3-5 Yrs' },
              { id: 'u8', label: '👦 6-8 Yrs' },
              { id: 'u12', label: '🎒 9-12 Yrs' },
              { id: 'u16', label: '🌟 13+ Yrs' },
            ].map((age) => (
              <button
                key={age.id}
                onClick={() => {
                  setSelectedAge(age.id);
                  updateUrl({ age: age.id === 'all' ? null : age.id });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedAge === age.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {age.label}
              </button>
            ))}

            {/* Locality Selector Dropdown */}
            {availableLocalities.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={selectedLocality}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedLocality(val);
                    updateUrl({ locality: val === 'all' ? null : val });
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-7"
                >
                  <option value="all">📍 All Localities</option>
                  {availableLocalities.map((loc) => (
                    <option key={loc.slug} value={loc.slug}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <CaretDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-7"
              >
                <option value="top">Top Rated</option>
                <option value="rating">Highest Rating</option>
                <option value="fee-low">Tuition: Low to High</option>
              </select>
              <CaretDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {(searchQuery || selectedLocality !== 'all' || selectedAge !== 'all' || onlyTopInArea || onlyVerified || sortBy !== 'top') && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <ArrowCounterClockwise size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Skeletons while loading */}
          {isLoadingDb && academiesList.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ActivityCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAcademies.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-2xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                {getCategoryEmoji(selectedCategory) || '🔍'}
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  No coaching centers match your current filters
                </h3>
                <p className="text-xs text-slate-500">
                  We could not find verified academies matching &quot;{activeCategoryTitle}&quot; with your active filters in {activeCity}.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => handlePillarChange('all')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
                >
                  Explore All Activities
                </button>
              </div>
            </div>
          ) : (
            /* Results Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {filteredAcademies.map((acad) => (
                <AcademyCard key={acad.id} academy={acad} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
