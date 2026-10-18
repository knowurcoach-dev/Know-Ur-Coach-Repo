"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getCompetitionByIdAction, getParentDashboardData } from '@/lib/actions';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getCategoryDisplayName, getCategoryEmoji, resolveCategoryCoverImage } from '@/lib/categories';
import {
  Trophy,
  SealCheck,
  CalendarBlank,
  Clock,
  MapPin,
  CurrencyInr,
  Medal,
  Users,
  ShieldCheck,
  CheckCircle,
  FilePdf,
  WhatsappLogo,
  ShareNetwork,
  ArrowLeft,
  CaretRight,
  Ticket,
  Buildings,
  Sparkle,
  Phone,
  Info,
  Check,
  CircleNotch,
  ArrowSquareOut,
  Question,
  UsersThree,
} from '@phosphor-icons/react';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { session, user, isGuest } = useAuth();
  const { showToast, activeCity } = usePersona();
  const { openModal } = useModalStore();

  const [competition, setCompetition] = useState<any>(null);
  const [hostCentre, setHostCentre] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parent's children for quick registration
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildNames, setSelectedChildNames] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getCompetitionByIdAction(id);
        if (res.success && res.competition) {
          setCompetition(res.competition);
          setHostCentre(res.hostCentre);
        } else {
          setError(res.message || 'Tournament not found');
        }
      } catch (err: any) {
        console.error('Error fetching tournament detail:', err);
        setError('Failed to load tournament information.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  useEffect(() => {
    async function loadChildren() {
      if (!userEmail || isGuest) return;
      try {
        const pRes = await getParentDashboardData(userEmail);
        if (pRes?.children && pRes.children.length > 0) {
          setChildrenList(pRes.children);
          setSelectedChildNames([pRes.children[0].fullName]);
        }
      } catch (e) {
        console.warn('Could not load parent children:', e);
      }
    }
    loadChildren();
  }, [userEmail, isGuest]);

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('📋 Tournament link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(
      `🏆 *${competition?.title || 'Youth Championship'}*\n` +
      `📅 ${competition?.dates || 'Upcoming'}\n` +
      `📍 ${competition?.venue || 'Agra'}\n` +
      `🏅 Prize Pool: ${competition?.prizePool || 'Medals & Certificates'}\n\n` +
      `Register your child on KnowUrCoach:\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRegisterClick = () => {
    if (isGuest || !userEmail) {
      showToast('⚠️ Please sign in or create a parent account to register');
      router.push(`/login?callbackUrl=/competitions/${id}`);
      return;
    }

    openModal('competition-register', {
      competition,
      title: competition?.title,
      selectedChildNames: selectedChildNames.length > 0 ? selectedChildNames : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <CircleNotch size={36} className="animate-spin text-orange-600 mb-3" />
        <p className="text-sm font-bold text-slate-600">Loading tournament information...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <Trophy size={32} weight="duotone" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tournament Not Found</h2>
        <p className="text-slate-600 text-sm max-w-md mb-6">{error || 'This tournament may have been archived or removed.'}</p>
        <Link
          href="/competitions"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Browse All Competitions</span>
        </Link>
      </div>
    );
  }

  const isFree = Number(competition.registrationFee) === 0;
  const emoji = getCategoryEmoji(competition.sport || competition.category);
  const coverImage = resolveCategoryCoverImage(competition.sport || competition.category);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 text-slate-900 text-left">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
            <CaretRight size={12} className="text-slate-400 shrink-0" />
            <Link href="/competitions" className="hover:text-orange-600 transition-colors">Competitions & Tournaments</Link>
            <CaretRight size={12} className="text-slate-400 shrink-0" />
            <span className="text-slate-900 font-extrabold truncate max-w-[240px] sm:max-w-md">{competition.title}</span>
          </div>

          <Link
            href="/competitions"
            className="hidden sm:inline-flex items-center gap-1.5 text-slate-700 hover:text-orange-600 font-bold transition-colors shrink-0"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Back to Tournaments</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================
            HERO HEADER BANNER
           ======================================================== */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_white_10%,_transparent_20%)] bg-[length:24px_24px] pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3.5 max-w-3xl">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/20 border border-white/30 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="text-base">{emoji}</span>
                  <span>{getCategoryDisplayName(competition.sport || competition.category)}</span>
                </span>

                <span className="bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Registrations Open</span>
                </span>

                {isFree ? (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                    Free Entry
                  </span>
                ) : (
                  <span className="bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Official Ranking Tour
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {competition.title}
              </h1>

              {/* Organizer & Venue Subtitle */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-white/90 font-medium">
                <div className="flex items-center gap-1.5">
                  <Buildings size={16} weight="bold" className="text-amber-300" />
                  <span>Organized by: <strong className="text-white font-extrabold">{competition.organizer}</strong></span>
                  <span title="Verified Organizer" className="inline-flex">
                    <SealCheck size={16} weight="fill" className="text-blue-300 ml-0.5" />
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin size={16} weight="fill" className="text-red-300" />
                  <span>{competition.locality || 'Agra'}, UP</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleRegisterClick}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer whitespace-nowrap"
              >
                <Ticket size={18} weight="bold" />
                <span>{isFree ? 'Book Free Entry Pass' : `Register Now • ₹${competition.registrationFee}`}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <WhatsappLogo size={16} weight="fill" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
                  title="Copy link"
                >
                  <ShareNetwork size={16} weight="bold" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MAIN CONTENT GRID (2 COLUMNS)
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN: Overview & Detailed Tabs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Specs Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <CalendarBlank size={14} weight="bold" className="text-orange-600" />
                  Dates
                </span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{competition.dates}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Clock size={14} weight="bold" className="text-orange-600" />
                  Timings
                </span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{competition.timing}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users size={14} weight="bold" className="text-orange-600" />
                  Age Divisions
                </span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{competition.ageDivisions}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Medal size={14} weight="bold" className="text-amber-500" />
                  Prize Pool
                </span>
                <span className="font-extrabold text-amber-900 text-xs sm:text-sm line-clamp-2">{competition.prizePool}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <CurrencyInr size={14} weight="bold" className="text-emerald-600" />
                  Entry Fee
                </span>
                <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">
                  {isFree ? 'FREE Entry' : `₹${competition.registrationFee} / player`}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <UsersThree size={14} weight="bold" className="text-blue-600" />
                  Confirmed Entries
                </span>
                <span className="font-extrabold text-blue-900 text-xs sm:text-sm">
                  {competition.registeredCount || 0} Juniors Enrolled
                </span>
              </div>
            </div>

            {/* Venue & Location Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <MapPin size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Venue & Match Location</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Official sanctioned sports facility</p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(competition.venue + ', ' + (competition.locality || 'Agra'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-extrabold text-slate-900 text-sm">{competition.venue}</p>
                <p className="text-xs text-slate-600 font-medium">{competition.locality}, Agra, Uttar Pradesh</p>
              </div>

              {/* Venue Facility Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-700 block">🏟️ Standard Courts</span>
                  <span className="text-[9px] text-slate-500 font-medium">BWF / State Approved</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-700 block">👥 Spectator Seating</span>
                  <span className="text-[9px] text-slate-500 font-medium">Parents Gallery</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-700 block">🩹 On-Site First Aid</span>
                  <span className="text-[9px] text-slate-500 font-medium">Physiotherapy Deck</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-700 block">💧 Hydration Stations</span>
                  <span className="text-[9px] text-slate-500 font-medium">RO Mineral Water</span>
                </div>
              </div>
            </div>

            {/* Tournament Rules, Equipment & Match Format */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <ShieldCheck size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Official Competition Guidelines & Rules</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Standardized tournament governance and player conduct</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Trophy size={14} weight="fill" className="text-orange-500" />
                    <span>Match Format & Draw Structure</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {competition.matchFormat || 'Knockout elimination bracket. Best of 3 sets to 21 points with deuce rule applicable up to 30 points.'}
                  </p>
                </div>

                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Clock size={14} weight="bold" className="text-blue-500" />
                    <span>Reporting & Fixture Timing</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {competition.reportingRules || 'All players must report to the tournament desk 30 minutes before their scheduled match with Aadhaar / School ID.'}
                  </p>
                </div>

                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-emerald-500" />
                    <span>Mandatory Equipment & Attire</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {competition.equipmentRules || 'Non-marking sports shoes mandatory on wooden courts. Players must bring personal rackets/gear. Shuttles/balls provided.'}
                  </p>
                </div>

                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <SealCheck size={14} weight="fill" className="text-indigo-500" />
                    <span>Referees & Umpiring</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {competition.umpiringRules || 'State Federation certified line judges and chief referees oversee all quarter, semi, and final rounds. Chief referee decision is final.'}
                  </p>
                </div>
              </div>

              {/* Download Rulebook Action */}
              <div className="bg-orange-50/70 rounded-2xl p-4 border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                    <FilePdf size={22} weight="fill" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-orange-950">Official Rulebook & Age Cutoff Guidelines</h5>
                    <p className="text-[11px] text-orange-800/80 font-medium">Detailed schedule, eligibility verification & code of conduct</p>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`📄 Rulebook downloaded: ${competition.rulebookPdfUrl || 'Tournament_Guidelines.pdf'}`)}
                  className="bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-xs px-4 py-2 rounded-xl border border-orange-200 transition-colors cursor-pointer shrink-0"
                >
                  Download PDF
                </button>
              </div>
            </div>

            {/* Host Academy Card if linked */}
            {hostCentre && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Buildings size={18} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Host Academy & Organizing Mentor</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Verified KnowUrCoach Partner Centre</p>
                    </div>
                  </div>

                  <Link
                    href={`/activities/${hostCentre.id}`}
                    className="text-orange-600 hover:text-orange-700 font-extrabold text-xs transition-colors"
                  >
                    View Academy Profile →
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                      <span>{hostCentre.name}</span>
                      <SealCheck size={18} weight="fill" className="text-blue-500" />
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">{hostCentre.address}</p>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                        ⭐ {hostCentre.rating?.toFixed(1) || '5.0'} ({hostCentre.reviewsCount || 0} reviews)
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                        Safety Grade A+
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${hostCentre.phone}`}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors"
                    >
                      <Phone size={15} weight="bold" />
                      <span>Call Host</span>
                    </a>

                    <a
                      href={`https://wa.me/${hostCentre.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi Coach, I have an inquiry about ${competition.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors shadow-xs"
                    >
                      <WhatsappLogo size={16} weight="fill" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Frequently Asked Questions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Question size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Frequently Asked Questions</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Important details for parents and guardians</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 space-y-1">
                  <h5 className="font-extrabold text-slate-900">How do I verify my child's age group?</h5>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Parents can present a school ID card, Aadhaar card, or birth certificate copy during morning check-in at the venue desk to receive their official tournament wristband.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 space-y-1">
                  <h5 className="font-extrabold text-slate-900">When will the match fixtures &amp; timings be announced?</h5>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Official match draws and court assignments are published 24 hours prior to tournament day. Registered parents receive an automated WhatsApp confirmation slip with match slot details.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 space-y-1">
                  <h5 className="font-extrabold text-slate-900">Is parent viewing allowed at the venue?</h5>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Yes! Dedicated, air-conditioned spectator galleries are available for parents and families to cheer on participating juniors without extra charges.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Registration Card (1 col) */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-3xl p-6 border border-orange-200/80 shadow-lg space-y-5">
              {/* Fee Box */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/60">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Registration Fee</span>
                <div className="flex items-baseline gap-1 mt-1">
                  {isFree ? (
                    <span className="text-3xl font-black text-emerald-600">FREE</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-slate-900">₹{competition.registrationFee}</span>
                      <span className="text-xs text-slate-500 font-medium">/ participant</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  Includes digital verified pass, hydration, and certificate of participation.
                </p>
              </div>

              {/* Live Availability Callout */}
              <div className="flex items-center justify-between text-xs font-semibold px-1 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Slots Status:</span>
                </span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Fast Filling
                </span>
              </div>

              {/* Participant Quick Selection if parent signed in */}
              {childrenList.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-extrabold text-slate-700 block">Select Child Participant:</span>
                  <div className="space-y-1.5">
                    {childrenList.map((ch) => {
                      const isSelected = selectedChildNames.includes(ch.fullName);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            if (isSelected && selectedChildNames.length > 1) {
                              setSelectedChildNames((prev) => prev.filter((n) => n !== ch.fullName));
                            } else if (!isSelected) {
                              setSelectedChildNames((prev) => [...prev, ch.fullName]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-orange-300 text-orange-950 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {isSelected ? <Check size={12} weight="bold" /> : null}
                            </div>
                            <span>{ch.fullName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{ch.age} Yrs</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary Registration CTA */}
              <button
                onClick={handleRegisterClick}
                className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-[0.98] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Ticket size={20} weight="bold" />
                <span>{isFree ? 'Generate Free Entry Pass' : `Proceed to Register • ₹${(Number(competition.registrationFee) || 0) * Math.max(1, selectedChildNames.length)}`}</span>
              </button>

              {/* Security & Verification Guarantees */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>Instant digital QR pass issued to WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-blue-600 shrink-0" />
                  <span>100% Escrow Protection / Refund if tournament is postponed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Medal size={16} weight="fill" className="text-amber-500 shrink-0" />
                  <span>Merit medals for top 3 &amp; certificates for all</span>
                </div>
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/60 text-xs space-y-2">
              <span className="font-extrabold text-slate-900 block">Have Questions or Need Help?</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                KnowUrCoach tournament coordinators are available daily from 9:00 AM to 7:00 PM to help parents with registrations.
              </p>
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold hover:text-emerald-800 transition-colors"
              >
                <WhatsappLogo size={15} weight="fill" />
                <span>Chat with Coordinator on WhatsApp →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
