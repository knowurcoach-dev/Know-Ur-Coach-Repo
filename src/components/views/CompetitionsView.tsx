"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Competition } from '@/types';
import { getDiscoveryData } from '@/lib/actions';
import { CompetitionCard } from '@/components/cards/CompetitionCard';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { ActivityCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  PlusCircle,
  MagnifyingGlass,
  XCircle,
  MapPin,
  ClockCountdown,
  User,
  Funnel,
  Brain,
  Palette,
  ShieldStar,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';

export function CompetitionsView() {
  const { showToast, activeCity } = usePersona();
  const { openModal } = useModalStore();
  const { session, user, isGuest, isParent, isCoach, isAdmin, role } = useAuth();
  const router = useRouter();

  // Host Tournament is strictly authorized for Coach / Admin roles; hidden for Guests and Parents
  const canHostTournament = !isGuest && !isParent && (isCoach || isAdmin || role === 'COACH' || role === 'ADMIN');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [competitionsList, setCompetitionsList] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  async function loadComps() {
    setIsLoading(true);
    setDbError(null);
    try {
      const { competitions } = await getDiscoveryData();
      if (competitions && competitions.length > 0) {
        const mapped: Competition[] = competitions.map((c: any) => {
          const rawCat = (c.category || 'sports').toLowerCase();
          const normalizedCategory = ['badminton', 'football', 'tennis', 'cricket', 'swimming', 'athletics', 'sports'].includes(rawCat)
            ? 'sports'
            : rawCat;

          const rawAgeText = (c.ageDivisions || '').toLowerCase();
          const derivedAge: string[] = [];
          if (rawAgeText.includes('9') || rawAgeText.includes('u-9') || rawAgeText.includes('u9')) derivedAge.push('u9');
          if (rawAgeText.includes('11') || rawAgeText.includes('12') || rawAgeText.includes('u-11') || rawAgeText.includes('u-12') || rawAgeText.includes('u12')) derivedAge.push('u12');
          if (rawAgeText.includes('15') || rawAgeText.includes('16') || rawAgeText.includes('u-15') || rawAgeText.includes('u-16') || rawAgeText.includes('u15')) derivedAge.push('u15');
          if (rawAgeText.includes('17') || rawAgeText.includes('18') || rawAgeText.includes('u-17') || rawAgeText.includes('u-18') || rawAgeText.includes('u18')) derivedAge.push('u18');
          if (derivedAge.length === 0) derivedAge.push('u12', 'u15');

          return {
            id: c.id,
            title: c.title,
            sport: c.sport || 'Sports',
            category: normalizedCategory as any,
            locality: (c.locality as any) || 'kamla-nagar',
            venue: c.venue || (activeCity ? `${activeCity} Sports Complex` : 'Sports Complex'),
            venueShort: c.venue ? c.venue.split(',')[0] : (activeCity ? `${activeCity} Venue` : 'Sports Venue'),
            status: c.status || 'open',
            statusText: c.statusText || 'Registrations Open',
            age: derivedAge,
            ageText: c.ageDivisions || 'Under-11 & Under-15',
            fee: Number(c.registrationFee || c.fee) || 450,
            feeUnit: c.feeUnit || '/ participant',
            date: c.dates || 'Upcoming',
            timing: c.timing || 'Morning 9:00 AM to 5:30 PM',
            organizer: c.organizer || 'District Sports Association',
            badgeSpecial: c.badgeSpecial,
            prizePool: c.prizePool || 'Medals & Certificates',
            tags: c.tags || ['🏆 Verified Tournament', '📜 Certificate For All'],
            equipment: c.equipmentRules || 'Standard sports kit required',
            reporting: c.reportingRules || '30 mins before match',
            format: c.matchFormat || 'Knockout format',
            umpiring: c.umpiringRules || 'Certified referees',
            contact: c.contactPhone || c.contactEmail || c.contact || 'District Sports Council',
            rulebookPdf: c.rulebookPdfUrl || 'Tournament_Rulebook.pdf',
            isTeam: Boolean(c.isTeam),
          };
        });
        setCompetitionsList(mapped);
      } else {
        setCompetitionsList([]);
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to load competitions from database in CompetitionsView:', err);
      setDbError(err?.message || 'Database connection error: Failed to load competitions.');
      setCompetitionsList([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadComps();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocality('all');
    setSelectedStatus('all');
    setSelectedAge('all');
    setSelectedCategory('all');
    showToast('All tournament filters reset');
  };

  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedLocality !== 'all' ||
    selectedStatus !== 'all' ||
    selectedAge !== 'all' ||
    selectedCategory !== 'all';

  // Filter Algorithm - includes competitionsList in dependencies
  const filteredCompetitions = useMemo(() => {
    return competitionsList.filter((comp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        comp.title.toLowerCase().includes(q) ||
        comp.sport.toLowerCase().includes(q) ||
        comp.venue.toLowerCase().includes(q) ||
        comp.organizer.toLowerCase().includes(q);

      const matchLocality =
        selectedLocality === 'all' || comp.locality === selectedLocality;

      const matchStatus =
        selectedStatus === 'all' || comp.status === selectedStatus;

      const matchAge =
        selectedAge === 'all' ||
        (Array.isArray(comp.age) && comp.age.includes(selectedAge)) ||
        (comp.ageText && comp.ageText.toLowerCase().includes(selectedAge));

      const matchCategory =
        selectedCategory === 'all' ||
        comp.category === selectedCategory ||
        (selectedCategory === 'sports' && ['badminton', 'football', 'tennis', 'cricket', 'sports'].includes(comp.category));

      return matchSearch && matchLocality && matchStatus && matchAge && matchCategory;
    });
  }, [competitionsList, searchQuery, selectedLocality, selectedStatus, selectedAge, selectedCategory]);

  return (
    <div id="view-competitions" className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] text-white p-6 sm:p-8 relative overflow-hidden rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_10%,_transparent_20%)] bg-[length:24px_24px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold">
              <Trophy size={14} weight="fill" className="text-yellow-300" />
              <span>Verified Youth Competitions &amp; Tournaments</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              Upcoming Competitions &amp; Tournaments
            </h1>

            <p className="text-white/90 text-xs sm:text-sm leading-relaxed font-medium">
              Discover state-ranking sports championships, arts Olympiads, and STEM masterclasses {activeCity ? `in ${activeCity}` : 'across India'}. Download official rulebooks and enroll your child with certified entry passes.
            </p>
          </div>

          {/* Host Tournament Button: strictly visible only to coaches and admins */}
          {canHostTournament && (
            <button
              onClick={() => openModal('competition-host')}
              className="bg-white text-orange-600 text-xs font-black px-6 py-3.5 rounded-2xl shadow-xl hover:bg-orange-50 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 z-10"
            >
              <PlusCircle size={18} weight="bold" className="inline mr-1.5" />
              Host / Post a Tournament in {activeCity}
            </button>
          )}
        </div>


        {/* Search & Filter Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-orange-100/70">
          {/* Search Bar */}
          <div className="relative mb-3">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="competition-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournaments, badminton, chess, karate..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircle size={18} weight="fill" />
              </button>
            )}
          </div>

          {/* 3 Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none" />
              <select
                id="competition-filter-locality"
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Locations in {activeCity || 'India'}</option>
                <option value="eklavya">Eklavya Stadium, Sadar</option>
                <option value="sanjay-place">Sanjay Place Complex</option>
                <option value="kamla-nagar">Kamla Nagar Arena & Turf</option>
                <option value="dayalbagh">Dayalbagh Sports Pavilion</option>
                <option value="shilpgram">Shilpgram Cultural Complex</option>
              </select>
            </div>

            <div className="relative">
              <ClockCountdown size={14} weight="bold" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 pointer-events-none" />
              <select
                id="competition-filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">🟢 Registrations Open</option>
                <option value="fast-filling">🟡 Fast Filling (Few Left)</option>
                <option value="upcoming">🔵 Upcoming Next Month</option>
              </select>
            </div>

            <div className="relative">
              <User size={14} weight="bold" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none" />
              <select
                id="competition-filter-age"
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">Any Child Age</option>
                <option value="u9">Under-9 (Sub-Junior)</option>
                <option value="u12">Under-12 (Cadet)</option>
                <option value="u15">Under-15 (Junior)</option>
                <option value="u18">Under-18 (Youth)</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-3.5 pt-3 border-t border-gray-100">
            <div id="competition-category-pills" className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <span className="text-[10px] font-extrabold text-gray-500 flex-shrink-0 flex items-center gap-1">
                <Funnel size={13} weight="bold" /> Category:
              </span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'sports', label: 'Sports & Athletics', icon: Trophy },
                { id: 'stem', label: 'STEM & Chess', icon: Brain },
                { id: 'arts', label: 'Fine Arts', icon: Palette },
                { id: 'martial-arts', label: 'Martial Arts', icon: ShieldStar },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      showToast(`Showing ${cat.id === 'all' ? 'all' : cat.label} competitions`);
                    }}
                    className={`comp-cat-btn text-[10px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'active bg-orange-600 text-white shadow-sm'
                        : 'bg-orange-50 text-orange-800 border border-orange-100 hover:bg-orange-100'
                    }`}
                  >
                    {IconComponent && <IconComponent size={12} weight="fill" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Count & Reset Button */}
        <div className="flex items-center justify-between px-1 mb-3.5">
          <div className="text-xs font-semibold text-gray-600">
            {isLoading ? (
              <span className="inline-block w-40 h-4 bg-slate-200 animate-pulse rounded" />
            ) : (
              <>Showing <span className="font-extrabold text-[#0a1128]">{filteredCompetitions.length}</span> verified competitions</>
            )}
          </div>
          {isFiltered && !isLoading && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <ArrowCounterClockwise size={12} weight="bold" /> Reset Filters
            </button>
          )}
        </div>

        {/* Competitions Cards Container or Skeleton */}
        {dbError ? (
          <div className="py-6">
            <DatabaseErrorView
              title="Unable to Load Competitions"
              message="We are having trouble loading sports competitions and events right now. Please try again."
              error={dbError}
              onRetry={loadComps}
            />
          </div>
        ) : isLoading ? (
          <ActivityCardSkeleton count={4} />
        ) : filteredCompetitions.length > 0 ? (
          <div id="competitions-list" className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onOpenRegister={(comp) => {
                  if (isGuest) {
                    showToast('⚠️ Please sign in or register as a parent to book tournament passes');
                    router.push('/login?callbackUrl=/competitions');
                    return;
                  }
                  openModal('competition-register', {
                    competition: comp,
                    title: comp.title,
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div
            id="competitions-empty-state"
            className="text-center py-10 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-2"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 text-2xl mx-auto mb-3 border border-orange-100">
              <Trophy size={26} weight="bold" />
            </div>
            <h4 className="font-extrabold text-[#0a1128] text-base mb-1">No Competitions Found</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-5 leading-relaxed">
              No youth tournaments match your current filters. Try changing your search query, locality, or category.
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/30 hover:bg-orange-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowCounterClockwise size={14} weight="bold" /> Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
