"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Academy } from '@/types';
import { AcademyCard } from '@/components/cards/AcademyCard';
import { ActivityCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getDiscoveryData } from '@/lib/actions';
import { resolveCentreCity } from '@/lib/location';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import {
  getCategoryPillar,
  getCategoryDisplayName,
  getCategoryEmoji,
  resolveCategoryCoverImage,
  resolveCategoryFromSearch,
  CATEGORY_SHORT_NAMES,
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
} from '@phosphor-icons/react';

function matchesAgeGroup(ageText: string | undefined, selectedAge: string): boolean {
  if (selectedAge === 'all') return true;
  if (!ageText) return true;
  const match = ageText.match(/(\d+)\s*[-to]+\s*(\d+)/i);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    switch (selectedAge) {
      case 'u5':
        return min <= 5;
      case 'u8':
        return min <= 8 && max >= 6;
      case 'u12':
        return min <= 12 && max >= 9;
      case 'u16':
        return max >= 13;
    }
  }
  return true;
}

function matchesCategory(acad: Academy, catSlug: string): boolean {
  if (!catSlug || catSlug === 'all') return true;

  // Pillar-wide "All in Pillar" matching
  if (catSlug === 'all-sports') {
    return getCategoryPillar(acad.category) === 'sports';
  }
  if (catSlug === 'all-brain-booster') {
    return getCategoryPillar(acad.category) === 'brain-booster';
  }
  if (catSlug === 'all-arts') {
    return getCategoryPillar(acad.category) === 'arts';
  }

  const cleanSlug = catSlug.toLowerCase().trim();
  const name = (acad.name || '').toLowerCase();
  const tagline = (acad.tagline || '').toLowerCase();
  const cat = (acad.category || '').toLowerCase().trim();
  const catSlugs = cat.split(',').map((s) => s.trim()).filter(Boolean);
  const activities = (acad.activities || []).map((a) => a.toLowerCase());
  const actText = (acad.activitiesText || '').toLowerCase();

  if (cat === cleanSlug || catSlugs.includes(cleanSlug)) return true;

  switch (cleanSlug) {
    case 'tennis':
      return (
        cat === 'tennis' ||
        cat === 'lawn-tennis' ||
        name.includes('tennis') ||
        tagline.includes('tennis') ||
        actText.includes('tennis') ||
        activities.some((a) => a.includes('tennis') && !a.includes('table tennis') && !a.includes('badminton'))
      );
    case 'badminton':
      return (
        cat === 'badminton' ||
        name.includes('badminton') ||
        name.includes('shuttle') ||
        tagline.includes('badminton') ||
        actText.includes('badminton') ||
        activities.some((a) => a.includes('badminton'))
      );
    case 'cricket':
      return (
        cat === 'cricket' ||
        name.includes('cricket') ||
        tagline.includes('cricket') ||
        actText.includes('cricket') ||
        activities.some((a) => a.includes('cricket'))
      );
    case 'football':
      return (
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
        cat === 'chess' ||
        name.includes('chess') ||
        tagline.includes('chess') ||
        activities.some((a) => a.includes('chess')) ||
        actText.includes('chess')
      );
    case 'coding':
      return (
        cat === 'coding' ||
        name.includes('coding') ||
        name.includes('python') ||
        name.includes('developer') ||
        activities.some((a) => a.includes('cod') || a.includes('python')) ||
        actText.includes('coding')
      );
    case 'science-labs':
      return (
        cat === 'science-labs' ||
        cat === 'science' ||
        name.includes('science') ||
        name.includes('experiment') ||
        activities.some((a) => a.includes('science') || a.includes('lab'))
      );
    case 'abacus':
      return (
        cat === 'abacus' ||
        cat === 'vedic-maths' ||
        name.includes('abacus') ||
        name.includes('vedic') ||
        tagline.includes('abacus') ||
        activities.some((a) => a.includes('abacus') || a.includes('vedic'))
      );
    case 'dance':
      return (
        cat === 'dance' ||
        name.includes('dance') ||
        name.includes('kathak') ||
        tagline.includes('dance') ||
        activities.some((a) => a.includes('dance') || a.includes('kathak'))
      );
    case 'western-dance':
      return (
        cat === 'western-dance' ||
        name.includes('hip hop') ||
        name.includes('western dance') ||
        activities.some((a) => a.includes('hip hop') || a.includes('western'))
      );
    case 'instruments':
      return (
        cat === 'instruments' ||
        name.includes('guitar') ||
        name.includes('keyboard') ||
        name.includes('piano') ||
        activities.some((a) => a.includes('guitar') || a.includes('piano') || a.includes('instrument'))
      );
    case 'music':
      return (
        cat === 'music' ||
        cat === 'sangeet' ||
        name.includes('music') ||
        name.includes('vocal') ||
        activities.some((a) => a.includes('music') || a.includes('vocal') || a.includes('sangeet'))
      );
    case 'arts':
    case 'fine-arts':
      return (
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
        cat.includes(cleanSlug) ||
        name.includes(cleanSlug) ||
        tagline.includes(cleanSlug) ||
        activities.some((a) => a.includes(cleanSlug))
      );
  }
}

export function ActivitiesExploreView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCity: personaCity, activeLocality, setLocation } = usePersona();

  const cityParam = searchParams.get('city');
  const activeCity = cityParam && cityParam.trim() ? cityParam.trim() : personaCity;

  const rawCat = searchParams.get('category');
  const rawSearch = searchParams.get('search') || '';
  const rawLocality = searchParams.get('locality') || 'all';
  const rawAge = searchParams.get('age') || 'all';
  const rawActivity = searchParams.get('activity');

  // If category wasn't explicit in URL, infer from search term if matching
  const inferred = (!rawCat || rawCat === 'all') && rawSearch ? resolveCategoryFromSearch(rawSearch) : null;
  const initialCategory = rawCat || inferred?.category || 'all';
  const initialActivityPillar = rawActivity || (initialCategory !== 'all' ? getCategoryPillar(initialCategory) : (inferred?.pillar || 'all'));

  const [academiesList, setAcademiesList] = useState<Academy[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Selected Activity Pillar: 'all' | 'sports' | 'brain-booster' | 'arts'
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

  // Sync category, search, locality, age, and pillar from URL parameter changes
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
    if (city && city !== personaCity) {
      setLocation({ city, locality: activeLocality || '' });
    }
  }, [searchParams]);

  // Fetch verified academies and taxonomy from DB
  const fetchDbData = React.useCallback(async () => {
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const res = await getDiscoveryData();
      if (res.activities) {
        setActivitiesList(res.activities);
      }
      const rawCentres = (res as any).centres || (res as any).academies || [];
      if (rawCentres.length > 0) {
        const mapped: Academy[] = rawCentres.map((c: any) => {
          const locName = c.locality
            ? c.locality.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : c.city || activeCity || 'City Center';

          const catSlug = (c.category || 'sports').toLowerCase();

          return {
            id: c.id,
            name: c.name,
            tagline: c.tagline || 'Leading Academy for Youth',
            category: catSlug,
            activities: Array.isArray(c.activities) && c.activities.length > 0 ? c.activities : [catSlug],
            activitiesText: Array.isArray(c.activities) && c.activities.length > 0
              ? c.activities.join(', ')
              : getCategoryDisplayName(catSlug),
            locality: c.locality,
            localityName: locName,
            city: c.city,
            lat: c.latitude,
            lon: c.longitude,
            address: c.address,
            phone: c.phone,
            distance: 2.5,
            distanceText: '2.5 km away',
            age: ['u8', 'u12', 'u16'] as any,
            ageText: c.eligibleAgeGroup || '5 - 16 Yrs',
            fee: Number(c.monthlyTuitionFee || c.fee || 1800),
            trialFee: Number(c.trialFee || 0),
            rating: Number(c.rating || 5.0),
            reviewsCount: Number(c.reviewsCount || 0),
            verifiedTag: c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : (c.isVerifiedBatch ? 'Verified Batch' : 'Safety Inspected'),
            image: c.image || resolveCategoryCoverImage(catSlug, ''),
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
              monthlyFee: Number(b.monthlyFee || c.monthlyTuitionFee || 1800),
            })),
          };
        });
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
  }, [activeCity]);

  useEffect(() => {
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

  // Master list of categories compiled from DB activities
  const masterCategoriesList = useMemo(() => {
    const list: Array<{
      slug: string;
      name: string;
      shortName: string;
      imageUrl: string;
      badge?: string;
      pillar: 'sports' | 'brain-booster' | 'arts';
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
              imageUrl: resolveCategoryCoverImage(cat.slug, cat.imageUrl),
              badge: cat.badge,
              pillar: getCategoryPillar(cat.slug),
            });
          }
        });
      });
    }

    return list;
  }, [activitiesList]);

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

    if (selectedActivityPillar === 'sports') {
      const sportsCentres = cityAcademies.filter((a) => getCategoryPillar(a.category) === 'sports').length;
      rootItem = {
        slug: 'all-sports',
        name: 'All Sports & Athletics',
        shortName: 'All Sports',
        imageUrl: '',
        count: sportsCentres,
        categoriesCount: 8,
      };
    } else if (selectedActivityPillar === 'brain-booster') {
      const brainCentres = cityAcademies.filter((a) => getCategoryPillar(a.category) === 'brain-booster').length;
      rootItem = {
        slug: 'all-brain-booster',
        name: 'All Brain & STEM',
        shortName: 'All Brain',
        imageUrl: '',
        count: brainCentres,
        categoriesCount: 5,
      };
    } else if (selectedActivityPillar === 'arts') {
      const artsCentres = cityAcademies.filter((a) => getCategoryPillar(a.category) === 'arts').length;
      rootItem = {
        slug: 'all-arts',
        name: 'All Cultural & Arts',
        shortName: 'All Arts',
        imageUrl: '',
        count: artsCentres,
        categoriesCount: 5,
      };
    } else {
      rootItem = {
        slug: 'all',
        name: 'All Activities',
        shortName: 'All (18)',
        imageUrl: '',
        count: cityAcademies.length,
        categoriesCount: 18,
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

  // Available localities in active city
  const availableLocalities = useMemo(() => {
    const map = new Map<string, string>();
    cityAcademies.forEach((a) => {
      if (a.locality && a.locality !== 'all') {
        const slug = a.locality.toLowerCase().replace(/\s+/g, '-');
        const name = a.localityName || a.locality.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        map.set(slug, name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [cityAcademies]);

  // Filtered academies for right content panel
  const filteredAcademies = useMemo(() => {
    let result = [...cityAcademies];

    // Category / Pillar filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((a) => matchesCategory(a, selectedCategory));
    } else if (selectedActivityPillar !== 'all') {
      // If user selected a specific pillar tab but 'all' within that pillar
      result = result.filter((a) => getCategoryPillar(a.category) === selectedActivityPillar);
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
          return (
            a.name.toLowerCase().includes(q) ||
            (a.category && a.category.toLowerCase().includes(q)) ||
            (a.locality && a.locality.toLowerCase().includes(q)) ||
            (a.localityName && a.localityName.toLowerCase().includes(q)) ||
            (a.tagline && a.tagline.toLowerCase().includes(q)) ||
            (a.activitiesText && a.activitiesText.toLowerCase().includes(q)) ||
            (a.coachName && a.coachName.toLowerCase().includes(q)) ||
            (Array.isArray(a.activities) && a.activities.some((act: string) => act.toLowerCase().includes(q)))
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
      if (sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);
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
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all' || slug.startsWith('all-')) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    window.history.replaceState(null, '', `?${params.toString()}`);

    // Scroll results panel smoothly to top
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePillarChange = (pillar: string) => {
    setSelectedActivityPillar(pillar);
    if (pillar === 'all') {
      handleSelectRailCategory('all');
    } else if (pillar === 'sports') {
      handleSelectRailCategory('all-sports');
    } else if (pillar === 'brain-booster') {
      handleSelectRailCategory('all-brain-booster');
    } else if (pillar === 'arts') {
      handleSelectRailCategory('all-arts');
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
  };

  const activeCategoryObj = masterCategoriesList.find((c) => c.slug === selectedCategory);
  const activeCategoryTitle =
    selectedCategory === 'all' || selectedCategory.startsWith('all-')
      ? selectedActivityPillar === 'sports'
        ? 'Sports & Athletics Academies'
        : selectedActivityPillar === 'brain-booster'
        ? 'Brain Booster & STEM Labs'
        : selectedActivityPillar === 'arts'
        ? 'Cultural & Fine Arts Studios'
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
          TOP BREADCRUMB & ACTIVITY PILLAR SWITCHER BAR
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

        {/* Activity Pillar Switcher (All 18 vs Specific Pillars) */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => handlePillarChange('all')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedActivityPillar === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <SquaresFour size={12} weight="bold" />
            <span>All Activities (18)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillarChange('sports')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedActivityPillar === 'sports'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Trophy size={12} weight="bold" />
            <span>Sports (8)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillarChange('brain-booster')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedActivityPillar === 'brain-booster'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Brain size={12} weight="bold" />
            <span>Brain &amp; STEM (5)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillarChange('arts')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              selectedActivityPillar === 'arts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Palette size={12} weight="bold" />
            <span>Arts &amp; Culture (5)</span>
          </button>
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
                      <div className={`w-full h-full flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
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
                onClick={() => setSelectedAge(age.id)}
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
                  onChange={(e) => setSelectedLocality(e.target.value)}
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
