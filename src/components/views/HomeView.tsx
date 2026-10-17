"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { AcademyCard } from '@/components/cards/AcademyCard';
import { Academy } from '@/types';
import { getDiscoveryData } from '@/lib/actions';
import { ActivityCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { HeroSlideData } from '@/lib/hero-slides';
import {
  HeroCarouselTheme,
  DEFAULT_HERO_CAROUSEL_THEME,
  getHeroOverlayGradient,
  getHeroCardHeightClass,
  hexToRgba,
} from '@/lib/hero-theme';
import {
  PlatformCategory,
  TaxonomyGroup,
  getCategoryDisplayName,
  getCategoryEmoji,
  getCategoryPillar,
} from '@/lib/categories';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import { getPopularNeighbourhoodsForCity, CityNeighbourhood, isStateLocation } from '@/lib/location';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { ParentTestimonialsSection } from '@/components/home/ParentTestimonialsSection';
import {
  Sparkle,
  MagnifyingGlass,
  CheckCircle,
  ShieldCheck,
  LockKey,
  Users,
  Trophy,
  Star,
  Buildings,
  Gift,
  Phone,
  EnvelopeSimple,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Play,
  Pause,
  X,
  CaretDown,
  MapPin,
  RocketLaunch,
} from '@phosphor-icons/react';

interface SearchSuggestion {
  type: 'category' | 'academy';
  title: string;
  subtitle?: string;
  icon?: string;
  categorySlug?: string;
  academyId?: string;
}

const SLIDE_DURATION_MS = 5000; // 5.0 seconds standard ideal carousel timer

export function HomeView() {
  const router = useRouter();
  const { activeCity, setLocation, showToast } = usePersona();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const journeySectionRef = useRef<HTMLDivElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainActivity, setSelectedMainActivity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [featuredAcademies, setFeaturedAcademies] = useState<Academy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Taxonomy & Hero Slides Data
  const [platformCategories, setPlatformCategories] = useState<PlatformCategory[]>([]);
  const [activitiesList, setActivitiesList] = useState<TaxonomyGroup[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlideData[]>([]);
  const [carouselTheme, setCarouselTheme] = useState<HeroCarouselTheme>(DEFAULT_HERO_CAROUSEL_THEME);
  const [dbError, setDbError] = useState<string | null>(null);

  // Carousel State & Timing
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [slideTimerKey, setSlideTimerKey] = useState(0); // Triggers visual progress bar restart

  // Autocomplete Suggestions State
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Popular Neighbourhoods Expansion State
  const [isAllNeighbourhoodsExpanded, setIsAllNeighbourhoodsExpanded] = useState(false);

  // Load dynamic data from DB (Centres, Categories, Activities, Hero Slides)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const data: any = await getDiscoveryData();
      if (data.heroCarouselTheme) {
        setCarouselTheme(data.heroCarouselTheme);
      }
      if (data.heroSlides && Array.isArray(data.heroSlides)) {
        setHeroSlides(data.heroSlides);
      } else {
        setHeroSlides([]);
      }
      if (data.activities && Array.isArray(data.activities)) {
        setActivitiesList(data.activities);
      } else {
        setActivitiesList([]);
      }
      if (data.categories && Array.isArray(data.categories)) {
        setPlatformCategories(data.categories);
      } else {
        setPlatformCategories([]);
      }
      if (data.centres && Array.isArray(data.centres) && data.centres.length > 0) {
        const mapped = data.centres.map((c: any) => {
          const categorySlugs = (c.category ? c.category.split(',') : ['tennis'])
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean);
          const activityNames = categorySlugs.map((slug: string) => getCategoryDisplayName(slug));

          return {
            id: c.id,
            name: c.name,
            tagline: c.tagline,
            category: (c.category as any) || 'tennis',
            activities: activityNames.length > 0 ? activityNames : [getCategoryDisplayName(c.category)],
            activitiesText: activityNames.length > 0 ? activityNames.join(' • ') : getCategoryDisplayName(c.category),
            locality: (c.locality as any) || 'central',
            localityName: c.locality
              ? c.locality.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
              : c.city || activeCity || 'City Center',
            address: c.address,
            phone: c.phone,
            distance: 2.5,
            distanceText: '2.5 km away',
            age: ['u8', 'u12', 'u16'] as any,
            ageText: c.eligibleAgeGroup || '5 - 16 Yrs',
            fee: Number(c.monthlyTuitionFee) || 1800,
            trialFee: Number(c.trialFee) || 0,
            rating: Number(c.rating) || 5.0,
            reviewsCount: Number(c.reviewsCount || 0),
            verifiedTag: c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Inspected',
            image: c.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
            coachName: c.headCoachName,
            coachTitle: 'NIS Certified Head Coach',
            coachesCount: c.coachesCount || 3,
            ratio: c.studentCoachRatio || '1 : 8',
            facilities: (c.facilities || []).map((f: any) => f.description),
            safety: '24/7 CCTV • First Aid • Police Verified',
            isTopInArea: c.isTopInArea,
            planTier: c.planTier,
            isVerifiedBatch: c.isVerifiedBatch,
            coachType: c.coachType,
            batches: (c.batches || []).map((b: any) => ({
              name: b.name,
              time: b.schedule,
              seats: `${b.seatsFilled}/${b.totalSeats} Enrolled`,
            })),
          };
        });
        setFeaturedAcademies(mapped);
      } else {
        setFeaturedAcademies([]);
      }
    } catch (err: any) {
      console.error('[FRONTEND_ERROR] Failed to load discovery data for home:', err);
      setDbError(err?.message || 'Database error: Failed to fetch live discovery data.');
      setFeaturedAcademies([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carousel Autoplay Timer (Exact 5 seconds with automatic reset on manual navigation)
  useEffect(() => {
    if (heroSlides.length <= 1 || isCarouselPaused) return;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
      setSlideTimerKey((k) => k + 1);
    }, SLIDE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [heroSlides.length, isCarouselPaused, currentSlideIndex, slideTimerKey]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev <= 0 ? heroSlides.length - 1 : prev - 1));
    setSlideTimerKey((k) => k + 1);
  }, [heroSlides.length]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    setSlideTimerKey((k) => k + 1);
  }, [heroSlides.length]);

  const handleJumpToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
    setSlideTimerKey((k) => k + 1);
  }, []);

  // Check if India is selected or a State is selected
  const isAllIndia = useMemo(() => {
    return !activeCity || activeCity.trim() === '' || activeCity.toLowerCase().includes('india');
  }, [activeCity]);

  const isState = useMemo(() => {
    return isStateLocation(activeCity);
  }, [activeCity]);

  // Popular Neighbourhoods based on selected City, State, or India
  const popularNeighbourhoods = useMemo<CityNeighbourhood[]>(() => {
    return getPopularNeighbourhoodsForCity(activeCity);
  }, [activeCity]);

  // Reset expansion state when active city changes
  useEffect(() => {
    setIsAllNeighbourhoodsExpanded(false);
  }, [activeCity]);

  const INITIAL_NEIGHBOURHOODS_COUNT = 6;
  const visibleNeighbourhoods = useMemo(() => {
    if (isAllNeighbourhoodsExpanded) return popularNeighbourhoods;
    return popularNeighbourhoods.slice(0, INITIAL_NEIGHBOURHOODS_COUNT);
  }, [popularNeighbourhoods, isAllNeighbourhoodsExpanded]);

  const remainingNeighbourhoodsCount = Math.max(0, popularNeighbourhoods.length - INITIAL_NEIGHBOURHOODS_COUNT);

  const handleNeighbourhoodClick = (localitySlug: string, localityName: string, localityCity?: string) => {
    const targetCity = localityCity || (isAllIndia ? 'All India' : activeCity);
    setLocation({
      locality: localityName,
      city: targetCity,
    });
    showToast(`📍 Exploring ${localityName}${localityCity && !localityCity.toLowerCase().includes('india') ? `, ${localityCity}` : ''}`);
    const params = new URLSearchParams();
    if (targetCity && !targetCity.toLowerCase().includes('india')) {
      params.set('city', targetCity);
    }
    params.set('locality', localitySlug);
    router.push(`/activities/explore?${params.toString()}`);
  };

  // Derived Linked Categories for Dropdown 2 based on selected Main Activity
  const linkedCategories = useMemo(() => {
    if (!selectedMainActivity) {
      const allTaxonomyCategories = activitiesList.flatMap((act) => act.categories || []);
      if (allTaxonomyCategories.length > 0) return allTaxonomyCategories;
      return platformCategories;
    }
    const foundGroup = activitiesList.find(
      (act) => act.slug === selectedMainActivity || act.id === selectedMainActivity
    );
    return foundGroup?.categories || [];
  }, [selectedMainActivity, activitiesList, platformCategories]);

  // Handle Main Activity change: clear category if not in new group
  const handleMainActivityChange = (newAct: string) => {
    setSelectedMainActivity(newAct);
    if (newAct) {
      const group = activitiesList.find((a) => a.slug === newAct || a.id === newAct);
      if (group && !group.categories?.some((c: any) => c.slug === selectedCategory)) {
        setSelectedCategory('');
      }
    }
  };

  // Autocomplete Suggestions Generator
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const categoryResults: SearchSuggestion[] = [];
    const academyResults: SearchSuggestion[] = [];

    // 1. Match categories
    const allKnownCategories = activitiesList.flatMap((act) => act.categories || []);
    const sourceCats = allKnownCategories.length > 0 ? allKnownCategories : platformCategories;
    const seenCatSlugs = new Set<string>();

    for (const cat of sourceCats) {
      if (seenCatSlugs.has(cat.slug)) continue;
      const name = cat.name.toLowerCase();
      const slug = cat.slug.toLowerCase();
      if (name.includes(query) || slug.includes(query)) {
        seenCatSlugs.add(cat.slug);
        categoryResults.push({
          type: 'category',
          title: cat.name,
          subtitle: 'Activity Category',
          icon: getCategoryEmoji(cat.slug),
          categorySlug: cat.slug,
        });
      }
      if (categoryResults.length >= 5) break;
    }

    // 2. Match featured academies
    for (const acad of featuredAcademies) {
      const name = (acad.name || '').toLowerCase();
      const tagline = (acad.tagline || '').toLowerCase();
      const acts = (acad.activitiesText || '').toLowerCase();
      if (name.includes(query) || tagline.includes(query) || acts.includes(query)) {
        academyResults.push({
          type: 'academy',
          title: acad.name,
          subtitle: `${acad.localityName || 'Verified Center'} • ${acad.rating}★ Rating`,
          icon: '🏫',
          academyId: acad.id,
        });
      }
      if (academyResults.length >= 5) break;
    }

    return [...categoryResults, ...academyResults];
  }, [searchQuery, activitiesList, platformCategories, featuredAcademies]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const POPULAR_TAG_MAP: Record<string, { category: string; search: string; pillar: string }> = {
    '🏸 Badminton': { category: 'badminton', search: 'Badminton', pillar: 'sports' },
    '🤖 Robotics': { category: 'robotics', search: 'Robotics', pillar: 'brain-booster' },
    '🎾 Tennis': { category: 'tennis', search: 'Tennis', pillar: 'sports' },
    '🥋 Martial Arts': { category: 'martial-arts', search: 'Martial Arts', pillar: 'sports' },
    '💃 Dance': { category: 'dance', search: 'Dance', pillar: 'arts' },
    '♟️ Chess': { category: 'chess', search: 'Chess', pillar: 'brain-booster' },
    '🏊 Swimming': { category: 'swimming', search: 'Swimming', pillar: 'sports' },
    '🎨 Art & Painting': { category: 'arts', search: 'Art & Painting', pillar: 'arts' },
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      setSearchQuery(suggestion.title);
      if (suggestion.categorySlug) {
        setSelectedCategory(suggestion.categorySlug);
      }
      setIsSuggestionsOpen(false);
      const params = new URLSearchParams();
      if (activeCity) params.set('city', activeCity);
      params.set('search', suggestion.title);
      if (suggestion.categorySlug) {
        params.set('category', suggestion.categorySlug);
        const pillar = getCategoryPillar(suggestion.categorySlug);
        if (pillar) params.set('activity', pillar);
      }
      router.push(`/activities/explore?${params.toString()}`);
    } else {
      setSearchQuery(suggestion.title);
      setIsSuggestionsOpen(false);
      const params = new URLSearchParams();
      if (activeCity) params.set('city', activeCity);
      params.set('search', suggestion.title);
      router.push(`/activities/explore?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return (
      <span>
        {before}
        <span className="text-blue-600 font-black bg-blue-50 px-0.5 rounded">{match}</span>
        {after}
      </span>
    );
  };

  // Submit search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (activeCity) params.set('city', activeCity);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedMainActivity) params.set('activity', selectedMainActivity);
    if (selectedCategory) {
      params.set('category', selectedCategory);
      if (!selectedMainActivity) {
        const pillar = getCategoryPillar(selectedCategory);
        if (pillar) params.set('activity', pillar);
      }
    }
    router.push(`/activities/explore?${params.toString()}`);
  };

  const handleQuickTagClick = (tag: string) => {
    const mapped = POPULAR_TAG_MAP[tag];
    const categorySlug = mapped ? mapped.category : tag.replace(/^[^\s]+\s*/, '').toLowerCase().replace(/\s+/g, '-');
    const cleanSearch = mapped ? mapped.search : tag.replace(/^[^\s]+\s*/, '');
    const pillar = mapped ? mapped.pillar : getCategoryPillar(categorySlug);

    setSearchQuery(cleanSearch);
    setSelectedCategory(categorySlug);
    setSelectedMainActivity(pillar);

    const params = new URLSearchParams();
    if (activeCity) params.set('city', activeCity);
    params.set('category', categorySlug);
    params.set('search', cleanSearch);
    if (pillar) {
      params.set('activity', pillar);
    }
    router.push(`/activities/explore?${params.toString()}`);
  };

  const scrollToSearch = () => {
    if (searchSectionRef.current) {
      searchSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => searchInputRef.current?.focus(), 400);
    }
  };

  const scrollToJourney = () => {
    if (journeySectionRef.current) {
      journeySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sortedFeatured = useMemo(() => {
    return [...featuredAcademies].sort((a, b) => {
      const aVer = Boolean(a.isVerifiedBatch);
      const bVer = Boolean(b.isVerifiedBatch);
      if (aVer !== bVer) return aVer ? -1 : 1;
      if (a.isTopInArea && !b.isTopInArea) return -1;
      if (!a.isTopInArea && b.isTopInArea) return 1;
      return b.rating - a.rating;
    });
  }, [featuredAcademies]);

  const topInAreaAcademies = sortedFeatured.filter((a) => a.isTopInArea);
  const displayTop = topInAreaAcademies.length > 0 ? topInAreaAcademies.slice(0, 4) : sortedFeatured.slice(0, 4);

  if (dbError && !isLoading && featuredAcademies.length === 0 && heroSlides.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <DatabaseErrorView
          title="Unable to Load Academies"
          message="We are having trouble loading sports academies and activities right now. Please check your internet connection or try refreshing."
          error={dbError}
          onRetry={loadData}
          showHomeButton={false}
        />
      </div>
    );
  }

  const hasSlides = heroSlides.length > 0;
  const activeSlide = hasSlides ? (heroSlides[currentSlideIndex] || heroSlides[0]) : null;

  return (
    <div className="space-y-8 sm:space-y-12 pb-20 overflow-hidden">
      {/* Compact error alert if partial error occurred */}
      {dbError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <DatabaseErrorView compact error={dbError} onRetry={loadData} />
        </div>
      )}

      {/* ========================================================
          1. HERO STAGE (GLASSMORPHISM & SPREADED GRADIENT AESTHETIC)
             Expansive chromatic gradients blooming across the canvas
             with translucent frosted glassmorphic consoles
         ======================================================== */}
      <section className="relative bg-gradient-to-br from-indigo-50/70 via-sky-50/40 to-emerald-50/50 text-slate-900 overflow-hidden py-4 sm:py-6 lg:py-8 border-b border-indigo-100/60 shadow-xs">
        {/* Expansive Spreaded Gradient Glows Blooming Across Canvas */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-gradient-to-br from-blue-400/25 via-indigo-300/20 to-purple-400/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/25 via-teal-200/20 to-cyan-300/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-[550px] h-[550px] bg-gradient-to-r from-amber-200/20 via-rose-200/15 to-indigo-200/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Fine Micro-Dot Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.07)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5 sm:space-y-4 relative z-10">
          {/* Dedicated Carousel Banner if slides exist */}
          {hasSlides && activeSlide ? (
            <div
              className={`relative ${carouselTheme.borderRadius || 'rounded-3xl'} overflow-hidden shadow-2xl shadow-indigo-500/10 bg-slate-900/95 border border-white/60 backdrop-blur-md ${getHeroCardHeightClass(carouselTheme)} flex items-center transition-all duration-300`}
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
            >
              {/* Carousel Slide Backgrounds */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                      } transition-transform duration-7000`}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center transition-all duration-500"
                      style={{
                        filter: `brightness(${carouselTheme.imageBrightness ?? 100}%)`,
                      }}
                    />
                  </div>
                ))}

                {/* Dynamic Translucent Scrim / Overlay configured from Admin Panel */}
                <div
                  className="hidden md:block absolute inset-0 pointer-events-none transition-all duration-500"
                  style={{
                    background: getHeroOverlayGradient(carouselTheme, true),
                  }}
                />
                <div
                  className="block md:hidden absolute inset-0 pointer-events-none transition-all duration-500"
                  style={{
                    background: getHeroOverlayGradient(carouselTheme, false),
                  }}
                />
              </div>

              {/* Carousel Side Navigation Arrows */}
              {heroSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md"
                    title="Previous Slide"
                    aria-label="Previous Slide"
                  >
                    <CaretLeft size={18} weight="bold" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md"
                    title="Next Slide"
                    aria-label="Next Slide"
                  >
                    <CaretRight size={18} weight="bold" />
                  </button>
                </>
              )}

              {/* Slide Content: Left Aligned on Desktop for maximum image visibility */}
              <div className="relative z-10 w-full max-w-2xl px-4 sm:px-10 lg:px-12 py-4 sm:py-6 space-y-2 sm:space-y-3 text-left">
                {/* Badge Pill */}
                {activeSlide.showBadge !== false && (activeSlide.badge || "India's Verified Kids Coaching Network") && (
                  <div
                    className="inline-flex items-center gap-1.5 backdrop-blur-md border border-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: hexToRgba(carouselTheme.badgeBgColor || '#000000', (carouselTheme.badgeBgOpacity ?? 50) / 100),
                      color: carouselTheme.badgeTextColor || '#ffffff',
                    }}
                  >
                    <Sparkle size={12} weight="fill" style={{ color: carouselTheme.badgeAccentColor || '#34d399' }} />
                    <span>{activeSlide.badge || "India's Verified Kids Coaching Network"}</span>
                  </div>
                )}

                {/* Inspiring Headline */}
                {activeSlide.showTitle !== false && (
                  <h1
                    className={`font-black tracking-tight leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-none transition-all duration-300 ${
                      carouselTheme.titleFontSizeMobile === 'sm' ? 'text-sm' :
                      carouselTheme.titleFontSizeMobile === 'base' ? 'text-base' :
                      carouselTheme.titleFontSizeMobile === 'xl' ? 'text-xl' :
                      carouselTheme.titleFontSizeMobile === '2xl' ? 'text-2xl' : 'text-lg'
                    } ${
                      carouselTheme.titleFontSizeDesktop === '3xl' ? 'md:text-3xl lg:text-3xl' :
                      carouselTheme.titleFontSizeDesktop === '4xl' ? 'md:text-3xl lg:text-4xl' :
                      carouselTheme.titleFontSizeDesktop === '6xl' ? 'md:text-4xl lg:text-6xl' : 'md:text-3xl lg:text-4xl xl:text-5xl'
                    } ${
                      carouselTheme.titleFontWeight === 'bold' ? 'font-bold' :
                      carouselTheme.titleFontWeight === 'extrabold' ? 'font-extrabold' : 'font-black'
                    } ${
                      carouselTheme.titleDropShadow === 'none' ? '' :
                      carouselTheme.titleDropShadow === 'subtle' ? 'drop-shadow-sm' :
                      carouselTheme.titleDropShadow === 'strong' ? 'drop-shadow-2xl' : 'drop-shadow-lg'
                    }`}
                    style={{ color: carouselTheme.titleColor || '#ffffff' }}
                  >
                    {activeSlide.title}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                      {activeCity.toLowerCase().includes('india') ? 'Across India' : `in ${activeCity}`}
                    </span>
                  </h1>
                )}

                {/* Subtitle */}
                {activeSlide.showSubtitle !== false && activeSlide.subtitle && (
                  <p
                    className={`leading-normal sm:leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none transition-all duration-300 ${
                      carouselTheme.subtitleFontSizeMobile === 'sm' ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
                    } ${
                      carouselTheme.subtitleFontSizeDesktop === 'base' ? 'md:text-base' :
                      carouselTheme.subtitleFontSizeDesktop === 'xs' ? 'md:text-xs' : 'md:text-sm'
                    } ${
                      carouselTheme.subtitleFontWeight === 'normal' ? 'font-normal' :
                      carouselTheme.subtitleFontWeight === 'semibold' ? 'font-semibold' : 'font-medium'
                    }`}
                    style={{ color: carouselTheme.subtitleColor || '#e2e8f0' }}
                  >
                    {activeSlide.subtitle}
                  </p>
                )}

                {/* Slide Action Buttons */}
                {(activeSlide.showPrimaryCta !== false || activeSlide.showSecondaryCta !== false) && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5 sm:pt-1">
                    {activeSlide.showPrimaryCta !== false && (
                      <Link
                        href={activeSlide.ctaLink || '/activities'}
                        className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[11px] sm:text-xs md:text-sm px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
                      >
                        <span>{activeSlide.ctaText || 'Explore Academies'}</span>
                        <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    {activeSlide.showSecondaryCta !== false && (
                      activeSlide.secondaryCtaLink && !activeSlide.secondaryCtaLink.startsWith('#') && activeSlide.secondaryCtaLink !== '/activities#search' ? (
                        <Link
                          href={activeSlide.secondaryCtaLink}
                          className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] sm:text-xs md:text-sm px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/25 backdrop-blur-md shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <MagnifyingGlass size={13} weight="bold" className="text-blue-300" />
                          <span>{activeSlide.secondaryCtaText || 'Search Below'}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={scrollToSearch}
                          className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] sm:text-xs md:text-sm px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/25 backdrop-blur-md shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <MagnifyingGlass size={13} weight="bold" className="text-blue-300" />
                          <span>{activeSlide.secondaryCtaText || 'Search Below'}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Carousel Slide Progress Bar at the bottom */}
              {heroSlides.length > 1 && !isCarouselPaused && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 overflow-hidden z-20">
                  <div
                    key={slideTimerKey}
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 animate-slide-progress"
                    style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-white/60 backdrop-blur-md p-4 sm:p-8 md:p-10 text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black text-white shadow-md mb-2">
                <Sparkle size={12} weight="fill" className="text-emerald-400" />
                <span>India&apos;s Verified Kids Coaching Network</span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                Discover Verified Sports, Arts &amp; STEM Coaching{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                  {activeCity.toLowerCase().includes('india') ? 'Across India' : `in ${activeCity}`}
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 mt-1.5 sm:mt-2 max-w-xl font-medium leading-normal sm:leading-relaxed">
                Hyperlocal verified academies, background-checked NIS trainers, CCTV audits &amp; free trial sessions with 100% money-back escrow protection.
              </p>
            </div>
          )}

          {/* Bottom: Streamlined Search Console (Frosted Glassmorphism) */}
          <div
            ref={searchSectionRef}
            className="relative bg-white/75 backdrop-blur-2xl rounded-3xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(30,58,138,0.08)] border border-white/80 ring-1 ring-black/[0.03] text-slate-800 space-y-2"
          >
            {/* Single Compact Form Line */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 relative">
              {/* 1. Keyword Input with Autocomplete Suggestions Dropdown */}
              <div className="relative flex-1">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Activity or coaching (e.g. Badminton, Robotics, Tennis)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setIsSuggestionsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white shadow-2xs transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSuggestionsOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {isSuggestionsOpen && suggestions.length > 0 && (
                  <div
                    ref={suggestionsBoxRef}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="px-3.5 py-1.5 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                      <span>Matching Suggestions</span>
                      <span>{suggestions.length} results</span>
                    </div>

                    {suggestions.map((item, idx) => {
                      const isSelected = idx === activeSuggestionIndex;
                      return (
                        <div
                          key={`${item.type}-${item.title}-${idx}`}
                          onClick={() => handleSelectSuggestion(item)}
                          onMouseEnter={() => setActiveSuggestionIndex(idx)}
                          className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/90 text-blue-900' : 'hover:bg-slate-50/80 text-slate-800'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{item.icon || (item.type === 'category' ? '🎯' : '🏫')}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold truncate">
                                {highlightMatch(item.title, searchQuery)}
                              </div>
                              {item.subtitle && (
                                <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 shrink-0">
                            <span className="capitalize">{item.type}</span>
                            <ArrowRight size={12} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dropdowns: 2-col Grid on Mobile, Inline on Desktop */}
              <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
                {/* 2. Main Activities Dropdown */}
                <div className="relative w-full md:w-44">
                  <Sparkle size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                  <select
                    value={selectedMainActivity}
                    onChange={(e) => handleMainActivityChange(e.target.value)}
                    className="w-full pl-7 pr-6 py-2 sm:py-2.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white cursor-pointer truncate appearance-none shadow-2xs transition-all"
                    title="Filter by Main Activity Pillar"
                  >
                    <option value="">All Activities</option>
                    {activitiesList.map((act) => (
                      <option key={act.slug || act.id} value={act.slug || act.id}>
                        {act.name}
                      </option>
                    ))}
                  </select>
                  <CaretDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* 3. Linked Categories Dropdown */}
                <div className="relative w-full md:w-48">
                  <Trophy size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-7 pr-6 py-2 sm:py-2.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white cursor-pointer truncate appearance-none shadow-2xs transition-all"
                    title="Filter by Linked Category"
                  >
                    <option value="">
                      {selectedMainActivity
                        ? `All ${activitiesList.find((a) => a.slug === selectedMainActivity || a.id === selectedMainActivity)?.name || ''} Categories`
                        : 'All Categories'}
                    </option>
                    {linkedCategories.map((cat: any) => (
                      <option key={cat.slug || cat.id} value={cat.slug}>
                        {getCategoryEmoji(cat.slug)} {cat.name}
                      </option>
                    ))}
                  </select>
                  <CaretDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Submit Search Button */}
              <button
                type="submit"
                id="hero-search-btn"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              >
                <MagnifyingGlass size={15} weight="bold" />
                <span>Search</span>
              </button>
            </form>

            {/* 1. Popular Activity Tags */}
            <div
              className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 flex-nowrap sm:flex-wrap"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide shrink-0 mr-0.5">
                Popular:
              </span>
              {[
                '🏸 Badminton',
                '🤖 Robotics',
                '🎾 Tennis',
                '🥋 Martial Arts',
                '💃 Dance',
                '♟️ Chess',
                '🏊 Swimming',
                '🎨 Art & Painting',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-2 py-0.5 rounded-lg bg-white/60 hover:bg-white/95 backdrop-blur-sm hover:text-blue-700 text-slate-600 text-[10px] sm:text-[11px] font-bold border border-white/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* 2. Popular Localities in City/State/India with +more Toggle */}
            {popularNeighbourhoods.length > 0 && (
              <div
                className="pt-2 sm:pt-2.5 border-t border-slate-200/50 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 flex-nowrap sm:flex-wrap"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex items-center gap-1 shrink-0 mr-0.5">
                  <MapPin size={13} weight="fill" className="text-emerald-600" />
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 uppercase tracking-wide shrink-0">
                    {isAllIndia ? 'Popular Across India:' : `Popular in ${activeCity}:`}
                  </span>
                </div>
                {visibleNeighbourhoods.map((nh) => (
                  <button
                    key={`${nh.slug}-${nh.cityName || ''}`}
                    type="button"
                    onClick={() => handleNeighbourhoodClick(nh.slug, nh.name, nh.cityName)}
                    className="inline-flex items-center gap-1 bg-white/60 hover:bg-emerald-50/80 hover:text-emerald-800 hover:border-emerald-300/80 text-slate-700 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-lg border border-white/80 backdrop-blur-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 group shrink-0 whitespace-nowrap"
                    title={`Explore coaching in ${nh.name}${nh.cityName ? `, ${nh.cityName}` : ''}`}
                  >
                    <span>{nh.name}</span>
                    {(isAllIndia || isState) && nh.cityName && (
                      <span className="text-[9px] text-slate-500 font-medium">({nh.cityName})</span>
                    )}
                  </button>
                ))}

                {/* +more / Show Less Toggle Button */}
                {remainingNeighbourhoodsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAllNeighbourhoodsExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-lg border border-blue-200/70 backdrop-blur-sm transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap shadow-2xs"
                    title={isAllNeighbourhoodsExpanded ? 'Show fewer neighbourhoods' : `Show ${remainingNeighbourhoodsCount} more neighbourhoods`}
                  >
                    <span>{isAllNeighbourhoodsExpanded ? 'Show Less' : `+${remainingNeighbourhoodsCount} more`}</span>
                    <CaretDown
                      size={10}
                      weight="bold"
                      className={`transition-transform duration-200 ${isAllNeighbourhoodsExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
            )}

            {/* 3. Age Wise Discovery */}
            <div
              className="border-t border-slate-200/50 pt-2 sm:pt-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 flex-nowrap sm:flex-wrap"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide shrink-0 mr-0.5">
                Age Wise Discovery:
              </span>
              {[
                { label: '👶 3-5 Yrs (Early Explorers)', shortLabel: '👶 3-5 Yrs', age: 'u5' },
                { label: '👦 6-8 Yrs (Skill Builders)', shortLabel: '👦 6-8 Yrs', age: 'u8' },
                { label: '🎒 9-12 Yrs (Junior Champs)', shortLabel: '🎒 9-12 Yrs', age: 'u12' },
                { label: '🌟 13-16+ Yrs (Mastery)', shortLabel: '🌟 13-16+ Yrs', age: 'u16' },
              ].map((chip) => (
                <button
                  key={chip.age}
                  type="button"
                  onClick={() => router.push(`/activities/explore?city=${encodeURIComponent(activeCity)}&age=${chip.age}`)}
                  className="bg-white/60 hover:bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <span className="sm:hidden">{chip.shortLabel}</span>
                  <span className="hidden sm:inline">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trust Guarantees & 5-Step Parent Journey (Frosted Glassmorphic Strip) */}
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl p-3 sm:p-3.5 border border-white/80 shadow-[0_15px_35px_rgba(30,58,138,0.06)] ring-1 ring-black/[0.02]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
              {/* 1. Free Trial Guarantee */}
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 leading-tight">Free Trial Guarantee</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">100% Zero-Fee Pass</div>
                </div>
              </div>

              {/* 2. Physical Safety Verified */}
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                  <ShieldCheck size={20} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 leading-tight">Physical Safety Verified</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">Audited Centers &amp; CCTV</div>
                </div>
              </div>

              {/* 3. 100% Escrow Protection */}
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 hover:border-amber-300 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                  <LockKey size={20} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 leading-tight">100% Escrow Protection</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">Money-Back Safety</div>
                </div>
              </div>

              {/* 4. 1,400+ Active Parents */}
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100/80 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                  <Users size={20} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 leading-tight">1,400+ Active Parents</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">Verified Community</div>
                </div>
              </div>

              {/* 5. Simple 5-Step Parent Journey */}
              <button
                type="button"
                onClick={scrollToJourney}
                className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 p-2 rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/15 backdrop-blur-md border border-blue-200/90 hover:border-blue-400 text-blue-950 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer group"
                title="Explore the 5-step parent roadmap"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <RocketLaunch size={18} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-blue-950 leading-tight">Simple 5-Step</div>
                    <div className="text-[10px] text-blue-700 font-extrabold truncate">Parent Journey</div>
                  </div>
                </div>
                <ArrowRight size={14} weight="bold" className="text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0 mr-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. "HOW IT WORKS" (Directly after Search Section)
         ======================================================== */}
      <div ref={journeySectionRef}>
        <HowItWorksSection onSearchClick={scrollToSearch} />
      </div>

      {/* ========================================================
          3. 100% FREE TRIAL GUARANTEE BANNER (ZERO PARENT CHARGES)
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/activities"
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer hover:shadow-2xl transition-all group block"
        >
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase">
              <CheckCircle size={15} weight="fill" className="text-white" /> 100% Zero-Fee Parent Guarantee
            </div>
            <h2 className="text-xl sm:text-2xl font-black leading-snug">
              Book Free Trial Sessions with Verified {activeCity || 'Top'} Coaches
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
              Parents never pay any booking or platform charges. Experience top sports, dance, music, robotics, and fine arts centers {activeCity ? `in ${activeCity}` : 'across India'} with 100% free trial sessions.
            </p>
          </div>

          <div className="bg-white text-emerald-800 group-hover:bg-slate-50 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2 flex-shrink-0">
            <span>Explore Free Trials</span>
            <ArrowRight size={16} weight="bold" />
          </div>
        </Link>
      </section>

      {/* ========================================================
          4. FEATURED "TOP IN AREA" PREMIER ACADEMIES
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-black text-amber-600 uppercase tracking-wider mb-1">
              <Star size={14} weight="fill" /> Premier Verified Centers
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Top in Area Coaching &amp; Academies
            </h2>
          </div>
          <Link
            href="/activities"
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            <span>View All Centers</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {isLoading ? (
          <ActivityCardSkeleton count={3} />
        ) : displayTop.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {displayTop.map((academy) => (
              <AcademyCard key={academy.id} academy={academy} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
              <Trophy size={24} weight="bold" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Fresh Season Launching in {activeCity}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verified academies and coaches are currently enrolling for the upcoming season. Are you a coach or academy owner? Register now to get verified and featured.
            </p>
            <div className="pt-1">
              <Link
                href="/register-coach"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <span>Register Your Academy</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          5. REAL PARENT TESTIMONIALS SECTION
         ======================================================== */}
      <ParentTestimonialsSection />

      {/* ========================================================
          6. COACHES & ACADEMIES PARTNERSHIP CALLOUT
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 rounded-3xl p-8 sm:p-12 text-slate-900 shadow-xl shadow-indigo-500/5 flex flex-col lg:flex-row justify-between items-center gap-8 border border-indigo-100">
          <div className="space-y-3 max-w-2xl text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase">
              <Buildings size={15} weight="fill" className="text-emerald-700" /> For Coaching Centers, Tutors &amp; Academies
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Grow Your Student Enrollments {activeCity ? `in ${activeCity}` : 'Across India'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              List your coaching center, cognitive gym, STEM lab, arts studio, or sports academy. Pass our physical safety KYC audit and reach 50,000+ parents seeking verified classes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
            <Link
              href="/register-coach"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>List Your Center</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/coach/dashboard"
              className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-slate-200 shadow-xs transition-all text-center cursor-pointer active:scale-95"
            >
              Coach Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. TRUST STANDARDS & FOOTER OPERATIONS HUB
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200/90 text-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 text-xl shadow-xs">
                <ShieldCheck size={22} weight="fill" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm mb-1 text-slate-900">100% Physically Verified Centers</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every academy and coaching centre is physically inspected for child safety, CCTV monitoring, NIS coaches, and clean courts &amp; classrooms.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-600 text-xl shadow-xs">
                <Gift size={22} weight="fill" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm mb-1 text-slate-900">Zero Fee Parent Guarantee</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Parents never pay platform fees. Zero hidden charges, free trial sessions, and verified coaches with complete escrow protection.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-600">
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm mb-1">
                <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                <span>KnowUrCoach National Operations Desk</span>
              </div>
              <p className="text-slate-500">Central Coordination Hub • Serving verified sports academies across India</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <Phone size={14} className="text-emerald-600" /> +91 97625 77714
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <EnvelopeSimple size={14} className="text-blue-600" /> knowurcoach@gmail.com
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
