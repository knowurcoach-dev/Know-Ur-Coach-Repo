"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getDiscoveryData } from '@/lib/actions';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import {
  getCategoryPillar,
  getCategoryDisplayName,
  getCategoryEmoji,
  resolveCategoryCoverImage,
  resolveCategoryFromSearch,
} from '@/lib/categories';
import {
  MapPin,
  MagnifyingGlass,
  Sparkle,
  SquaresFour,
  CaretLeft,
  CaretRight,
  ArrowRight,
  X,
  Compass,
  Check,
  Trophy,
  Brain,
  Palette,
  ShieldCheck,
  Lightning,
} from '@phosphor-icons/react';

function computeCountMap(centres: any[]) {
  const countMap: Record<string, number> = {};
  if (!Array.isArray(centres)) return countMap;
  centres.forEach((a: any) => {
    const cat = (a.category || '').toLowerCase();
    const acts = (a.activities || []).map((x: string) => x.toLowerCase());
    const allTags = [cat, ...acts];
    allTags.forEach((t) => {
      if (t) countMap[t] = (countMap[t] || 0) + 1;
    });
  });
  return countMap;
}

export function ActivitiesView({ initialData }: { initialData?: any } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCity, activeLocality } = usePersona();
  const { openModal } = useModalStore();

  const rawSearch = searchParams.get('search') || '';
  const rawCategory = searchParams.get('category');
  const rawActivity = searchParams.get('activity');

  const inferred = (!rawCategory || rawCategory === 'all') && rawSearch ? resolveCategoryFromSearch(rawSearch) : null;
  const initialCategory = rawCategory || inferred?.category || '';
  const initialPillar = rawActivity || (initialCategory ? getCategoryPillar(initialCategory) : (inferred?.pillar || 'all'));
  const initialSearch = rawSearch || (initialCategory ? getCategoryDisplayName(initialCategory) : '');

  const [activitiesList, setActivitiesList] = useState<any[]>(() => initialData?.activities || []);
  const [academiesCountMap, setAcademiesCountMap] = useState<Record<string, number>>(() =>
    initialData?.centres ? computeCountMap(initialData.centres) : {}
  );
  const [totalAcademiesCount, setTotalAcademiesCount] = useState<number>(() =>
    initialData?.centres?.length || 0
  );
  const hasTaxonomy = Boolean(initialData?.activities && initialData.activities.length > 0);
  const [isLoadingDb, setIsLoadingDb] = useState(!hasTaxonomy);
  const [dbError, setDbError] = useState<string | null>(null);

  const initialLoadedRef = useRef(hasTaxonomy);

  // Filter state for categories on this browse page
  const [selectedActivityPillar, setSelectedActivityPillar] = useState<string>(initialPillar);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Sync with searchParams if navigated with new query
  useEffect(() => {
    const q = searchParams.get('search') || '';
    const cat = searchParams.get('category');
    const act = searchParams.get('activity');

    const inf = (!cat || cat === 'all') && q ? resolveCategoryFromSearch(q) : null;
    const targetCat = cat || inf?.category;
    const targetPillar = act || (targetCat ? getCategoryPillar(targetCat) : (inf?.pillar || 'all'));
    const targetSearch = q || (targetCat ? getCategoryDisplayName(targetCat) : '');

    if (targetPillar && targetPillar !== selectedActivityPillar) {
      setSelectedActivityPillar(targetPillar);
    }
    if (targetSearch !== searchQuery) {
      setSearchQuery(targetSearch);
    }
  }, [searchParams]);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch activities taxonomy & academy distribution
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
        setTotalAcademiesCount(rawCentres.length);
        setAcademiesCountMap(computeCountMap(rawCentres));
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to fetch discovery data in ActivitiesView:', err);
      setDbError(err?.message || 'Database connection error: Failed to fetch categories.');
      setActivitiesList([]);
    } finally {
      setIsLoadingDb(false);
    }
  }, [activeCity]);

  useEffect(() => {
    if (initialLoadedRef.current) {
      initialLoadedRef.current = false;
      return;
    }
    fetchDbData();
  }, [fetchDbData]);

  // Check scroll state of activity tabs
  const checkTabsScroll = () => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkTabsScroll();
    window.addEventListener('resize', checkTabsScroll);
    return () => window.removeEventListener('resize', checkTabsScroll);
  }, [activitiesList]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;
    const delta = direction === 'left' ? -220 : 220;
    tabsContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkTabsScroll, 250);
  };

  // Compile all display categories based on selected activity tab & search query
  const displayCategories = useMemo(() => {
    let list: any[] = [];
    if (selectedActivityPillar === 'all') {
      const seen = new Set<string>();

      activitiesList.forEach((act) => {
        (act.categories || []).forEach((cat: any) => {
          if (!seen.has(cat.slug)) {
            seen.add(cat.slug);
            list.push({
              ...cat,
              parentSlug: act.slug,
              parentName: act.name,
              imageUrl: resolveCategoryCoverImage(cat.slug, cat.imageUrl),
            });
          }
        });
      });
    } else {
      const currentAct = activitiesList.find((a) => a.slug === selectedActivityPillar);
      if (currentAct) {
        list = (currentAct.categories || []).map((cat: any) => ({
          ...cat,
          parentSlug: currentAct.slug,
          parentName: currentAct.name,
          imageUrl: resolveCategoryCoverImage(cat.slug, cat.imageUrl),
        }));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const filtered = list.filter((c: any) => c.name.toLowerCase().includes(q) || c.slug.includes(q));
      if (filtered.length > 0) return filtered;
    }

    return list;
  }, [selectedActivityPillar, activitiesList, searchQuery]);

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Autocomplete matching categories for search bar
  const matchingSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return displayCategories.slice(0, 6);
    }
    return displayCategories.filter((c: any) => c.name.toLowerCase().includes(q) || c.slug.includes(q)).slice(0, 6);
  }, [searchQuery, displayCategories]);

  // Handlers for navigating to Blinkit-style listing
  const handleCategoryClick = (catSlug: string) => {
    router.push(`/activities/explore?category=${encodeURIComponent(catSlug)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/activities/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/activities/explore');
    }
  };

  const handleAgeClick = (ageCode: string) => {
    router.push(`/activities/explore?age=${encodeURIComponent(ageCode)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-clip">
      {/* ========================================================
          HERO BANNER & SEARCH HEADER
         ======================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800 relative z-30">
        {/* Glowing Background Accents - isolated overflow hidden so it doesn't clip dropdowns */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkle size={14} weight="fill" />
            Browse Verified Categories in {activeCity}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Discover Kids Coaching, Sports &amp; Brain Boosters
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Select any category below to browse verified academies, compare NIS certified mentors, view synthetic courts and book 100% free trial passes.
          </p>

          {/* Search Box with Suggestions */}
          <form ref={searchFormRef} onSubmit={handleSearchSubmit} className="pt-2 relative z-30 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden p-1.5">
              <MagnifyingGlass size={18} className="text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search Badminton, Swimming, Robotics, Chess, Dance..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSuggestionsOpen(true);
                }}
                onFocus={() => setIsSuggestionsOpen(true)}
                className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {isSuggestionsOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 z-50 max-h-80 overflow-y-auto ring-1 ring-black/5">
                {matchingSuggestions.length > 0 ? (
                  <>
                    <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 flex items-center justify-between">
                      <span>{searchQuery.trim() ? 'Suggested Categories' : 'Popular Categories'}</span>
                      <span className="text-[9px] font-medium text-slate-400">Esc to close</span>
                    </div>
                    {matchingSuggestions.map((cat: any) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setIsSuggestionsOpen(false);
                          handleCategoryClick(cat.slug);
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-emerald-50 transition-colors cursor-pointer text-slate-800 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{getCategoryEmoji(cat.slug)}</span>
                          <span className="text-xs font-bold group-hover:text-emerald-700 transition-colors">{cat.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          View Listings <ArrowRight size={11} />
                        </span>
                      </button>
                    ))}
                  </>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center">
                    <p className="text-xs font-bold text-slate-600">No categories matching &quot;{searchQuery}&quot;</p>
                    <button
                      type="submit"
                      className="mt-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-800 underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Search all centres for &quot;{searchQuery}&quot;</span>
                      <ArrowRight size={12} weight="bold" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </form>

          {/* Current Area Pill */}
          <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
            <MapPin size={14} weight="fill" className="text-red-400 shrink-0" />
            <span>
              Active Area: <strong className="text-white">{activeLocality || activeCity}</strong>
            </span>
            <button
              type="button"
              onClick={() => openModal('locality-selector')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 transition-colors cursor-pointer ml-1"
            >
              Change Location
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          BROWSE BY CATEGORY SECTION (WITH PHOTO CARDS)
         ======================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-1 border border-emerald-200/60">
              <SquaresFour size={12} weight="fill" className="text-emerald-600" />
              Category Directory
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Browse by Category
            </h2>
          </div>

          <Link
            href="/activities/explore"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

        {/* Activity Pillar Tabs Scroller */}
        <div className="relative group/tabs">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Scroll left"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
          )}

          <div
            ref={tabsContainerRef}
            onScroll={checkTabsScroll}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar scroll-smooth p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80"
          >
            {/* All Activities Tab */}
            <button
              type="button"
              onClick={() => setSelectedActivityPillar('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${selectedActivityPillar === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
            >
              <SquaresFour size={14} weight="bold" />
              <span>All Activities</span>
            </button>

            {activitiesList.map((act) => {
              const isSelected = selectedActivityPillar === act.slug;
              return (
                <button
                  key={act.id || act.slug}
                  type="button"
                  onClick={() => setSelectedActivityPillar(act.slug)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                >
                  <span>{act.name}</span>
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Scroll right"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Categories Grid (Clicking navigates to Blinkit-style listing) */}
        {dbError ? (
          <div className="py-6">
            <DatabaseErrorView
              title="Unable to Load Activities"
              message="We are having trouble loading sports and learning categories right now. Please try again."
              error={dbError}
              onRetry={fetchDbData}
            />
          </div>
        ) : isLoadingDb && displayCategories.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="bg-slate-100 rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : displayCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayCategories.map((cat: any) => {
              const count = academiesCountMap[cat.slug] || 0;
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="group bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between text-left cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as any).src =
                          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Emoji / Icon Badge */}
                    <div className="absolute bottom-1.5 left-1.5 text-lg drop-shadow-md">
                      {getCategoryEmoji(cat.slug)}
                    </div>

                    {cat.badge && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-wider bg-emerald-600 shadow-2xs">
                          {cat.badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Title & Info */}
                  <div className="space-y-0.5 px-0.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{count > 0 ? `${count} centers` : 'Free Trial'}</span>
                      <CaretRight size={12} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200">
            <SquaresFour size={36} className="text-slate-400 mx-auto mb-2" />
            <h3 className="font-extrabold text-slate-800 text-sm">No Categories Available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no activities registered in this category in the database.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================
          AGE-WISE DISCOVERY SECTION
         ======================================================== */}
      <section className="bg-slate-100/70 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Explore by Child Age Group
          </h2>
          <p className="text-xs text-slate-500">
            Targeted evaluation batches designed specifically for cognitive and athletic developmental stages.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { id: 'u5', title: '👶 3–5 Yrs', subtitle: 'Early Explorers', desc: 'Motor skills, fun gymnastics & water play' },
            { id: 'u8', title: '👦 6–8 Yrs', subtitle: 'Skill Builders', desc: 'Mini tennis, basic robotics & karate' },
            { id: 'u12', title: '🎒 9–12 Yrs', subtitle: 'Junior Champs', desc: 'Badminton, chess, cricket & coding' },
            { id: 'u16', title: '🌟 13–16+ Yrs', subtitle: 'Pro Mastery', desc: 'Tournament squads & NIS coaching' },
          ].map((age) => (
            <button
              key={age.id}
              type="button"
              onClick={() => handleAgeClick(age.id)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all text-left cursor-pointer group"
            >
              <div className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                {age.title}
              </div>
              <div className="text-xs font-bold text-emerald-800 mt-0.5">
                {age.subtitle}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {age.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================
          BOTTOM CTA: BLINKIT EXPLORE LISTING
         ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Blinkit-Style Instant Directory
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Looking for All Verified Academies in {activeCity}?
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Switch to our full catalog view with side-by-side categories rail and complete coaching details.
          </p>
        </div>

        <Link
          href="/activities/explore"
          className="px-6 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-2"
        >
          <span>Open Full Directory</span>
          <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
