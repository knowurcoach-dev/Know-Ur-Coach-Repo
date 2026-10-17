"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Academy } from '@/types';
import { getAcademyById, getDiscoveryData, toggleCentreBookmark, getSavedCentreIds, getParentDashboardData, getCoachDashboardData, createCoachLead } from '@/lib/actions';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { ActivityDetailSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import { AcademyReviewsSection } from '@/components/reviews/AcademyReviewsSection';
import { useBookmarks } from '@/hooks/useBookmarks';
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
} from '@phosphor-icons/react';

export default function AcademyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { openModal } = useModalStore();
  const { showToast, activeCity } = usePersona();
  const { isGuest, session, user } = useAuth();
  const userEmail = session?.user?.email || (user as any)?.email;

  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [batchCategoryFilter, setBatchCategoryFilter] = useState<string>('all');
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

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
          const categorySlugs = (foundInDb.category ? foundInDb.category.split(',') : ['tennis'])
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean);
          const activityNames = categorySlugs.map((slug: string) => getCategoryDisplayName(slug));

          const batchFees = (foundInDb.batches || [])
            .map((b: any) => Number(b.monthlyFee))
            .filter((f: number) => !isNaN(f) && f > 0);
          const startingFee = batchFees.length > 0 ? Math.min(...batchFees) : (Number(foundInDb.monthlyTuitionFee) || 1800);

          const mapped: Academy = {
            id: foundInDb.id,
            name: foundInDb.name,
            tagline: foundInDb.tagline || `Verified Sports & Activities Academy in ${(foundInDb as any).city || activeCity || 'India'}`,
            category: (foundInDb.category as any) || 'tennis',
            activities: activityNames.length > 0 ? activityNames : [getCategoryDisplayName(foundInDb.category)],
            activitiesText: activityNames.length > 0 ? activityNames.join(' • ') : getCategoryDisplayName(foundInDb.category),
            locality: (foundInDb.locality as any) || 'kamla-nagar',
            localityName: foundInDb.locality ? foundInDb.locality.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : ((foundInDb as any).city || activeCity || 'City Center'),
            address: foundInDb.address || `${(foundInDb as any).city || activeCity || 'India'}, Uttar Pradesh`,
            phone: foundInDb.phone || '+91 98970 12345',
            distance: 2.5,
            distanceText: '2.5 km away',
            age: ['u8', 'u12', 'u16'],
            ageText: foundInDb.eligibleAgeGroup || '5 - 16 Yrs',
            fee: startingFee,
            trialFee: Number(foundInDb.trialFee) || 0,
            rating: Number(foundInDb.rating) || 5.0,
            reviewsCount: typeof foundInDb.reviewsCount === 'number' ? foundInDb.reviewsCount : (Number(foundInDb.reviewsCount) || 0),
            verifiedTag: foundInDb.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Inspected',
            image: (foundInDb as any).image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
            coachName: foundInDb.headCoachName || 'Certified Head Coach',
            coachTitle: 'NIS Certified Head Coach',
            coachesCount: foundInDb.coachesCount || 3,
            ratio: foundInDb.studentCoachRatio || '1 : 8',
            facilities: (foundInDb.facilities || []).map((f: any) => f.description),
            safety: '24/7 CCTV • First Aid • Police Verified Staff',
            isTopInArea: foundInDb.isTopInArea,
            planTier: foundInDb.planTier,
            isVerifiedBatch: foundInDb.isVerifiedBatch,
            coachType: foundInDb.coachType,
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
              monthlyFee: Number(b.monthlyFee) || startingFee,
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
              const coachCatSlugs = (coachCentre.category ? coachCentre.category.split(',') : ['tennis'])
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean);
              const coachActivityNames = coachCatSlugs.map((slug: string) => getCategoryDisplayName(slug));

              const coachBatchFees = (coachCentre.batches || [])
                .map((b: any) => Number(b.monthlyFee))
                .filter((f: number) => !isNaN(f) && f > 0);
              const coachStartingFee = coachBatchFees.length > 0 ? Math.min(...coachBatchFees) : (Number(coachCentre.monthlyTuitionFee) || 1800);

              const mapped: Academy = {
                id: coachCentre.id,
                name: coachCentre.name,
                tagline: coachCentre.tagline || `Verified Sports & Activities Academy in ${(coachCentre as any).city || activeCity || 'Agra'}`,
                category: (coachCentre.category as any) || 'tennis',
                activities: coachActivityNames.length > 0 ? coachActivityNames : [getCategoryDisplayName(coachCentre.category)],
                activitiesText: coachActivityNames.length > 0 ? coachActivityNames.join(' • ') : getCategoryDisplayName(coachCentre.category),
                locality: (coachCentre.locality as any) || 'kamla-nagar',
                localityName: coachCentre.locality ? coachCentre.locality.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : ((coachCentre as any).city || activeCity || 'City Center'),
                address: coachCentre.address || `${(coachCentre as any).city || activeCity || 'Agra'}, Uttar Pradesh`,
                phone: coachCentre.phone || '+91 98970 12345',
                distance: 2.5,
                distanceText: '2.5 km away',
                age: ['u8', 'u12', 'u16'],
                ageText: coachCentre.eligibleAgeGroup || '5 - 16 Yrs',
                fee: coachStartingFee,
                trialFee: Number(coachCentre.trialFee) || 0,
                rating: Number(coachCentre.rating) || 5.0,
                reviewsCount: typeof coachCentre.reviewsCount === 'number' ? coachCentre.reviewsCount : (Number(coachCentre.reviewsCount) || 0),
                verifiedTag: coachCentre.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Academy' : 'Safety Inspected',
                image: (coachCentre as any).image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
                coachName: coachCentre.headCoachName || 'Certified Head Coach',
                coachTitle: 'NIS Certified Head Coach',
                coachesCount: coachCentre.coachesCount || 2,
                ratio: coachCentre.studentCoachRatio || '1 : 8',
                facilities: (coachCentre.facilities || []).map((f: any) => f.description),
                safety: '24/7 CCTV • First Aid • Police Verified Staff',
                isTopInArea: coachCentre.isTopInArea,
                planTier: coachCentre.planTier,
                isVerifiedBatch: coachCentre.isVerifiedBatch,
                coachType: coachCentre.coachType,
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
                  monthlyFee: Number(b.monthlyFee) || coachStartingFee,
                  totalSeats: b.totalSeats || 15,
                  seatsFilled: b.seatsFilled || 0,
                })),
              };
              setAcademy(mapped);
              setIsOwnerPreview(true);
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
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile is Currently Private</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          This academy profile is either unlisted or currently on a private plan. Under platform rules, only verified academies on <strong>Standard</strong> and <strong>Premier</strong> tiers are publicly listed in the directory.
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
  const minBatchFee = batchFees.length > 0 ? Math.min(...batchFees) : (Number(academy?.fee) || 1800);

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
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                Private Preview
              </span>
              <span>
                🔒 <strong>Unlisted Profile Notice:</strong> Your academy page is not listed publicly. Purchase a Standard or Premier subscription to make this page visible to parents.
              </span>
            </div>
            <Link
              href="/coach/plans"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-1.5 rounded-xl transition-all shrink-0 shadow-xs"
            >
              Activate Standard or Premier Plan →
            </Link>
          </div>
        </div>
      )}

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider">
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
                  Self-Listed Profile
                </span>
              )}
              {(academy.activities && academy.activities.length > 0
                ? academy.activities
                : [getCategoryDisplayName(academy.category)]
              ).map((act, idx) => (
                <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md">
                  {act}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0a1128] tracking-tight">
              {academy.name}
            </h1>

            <p className="text-slate-600 text-sm font-medium">
              {academy.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
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
                {academy.localityName}, {academy.city || activeCity || 'India'} • <strong className="text-slate-900">{academy.distanceText}</strong>
              </span>

              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Users size={15} weight="bold" className="text-blue-500" />
                {academy.ageText}
              </span>
            </div>
          </div>

          {/* Quick CTA on Desktop Header */}
          <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">Monthly Coaching Tuition</div>
              <div className="text-2xl font-black text-[#0a1128]">
                Starts from ₹{minBatchFee.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
            </div>
            <button
              onClick={() => handleBookTrial()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Ticket size={16} weight="bold" />
              Book Free Trial Session
            </button>
          </div>
        </div>

        {/* 3. Image Gallery Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[260px] sm:h-[340px] rounded-3xl overflow-hidden relative border border-slate-200/80 shadow-xs group">
            <img
              src={academy.image}
              alt={academy.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
              <SealCheck size={14} weight="fill" className="text-blue-400" />
              Physically Inspected by KYC Field Audit Team
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 h-[340px]">
            <div className="flex-1 rounded-3xl overflow-hidden relative border border-slate-200/80">
              <img
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80"
                alt="Academy Infrastructure"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                Tournament Grade Courts
              </span>
            </div>
            <div className="flex-1 rounded-3xl overflow-hidden relative border border-slate-200/80">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80"
                alt="Training Sessions"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                Certified Coaching Sessions
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            MOBILE / TABLET QUICK BOOKING CARD (Hidden on Desktop)
            Solves mobile issue where booking was previously at the bottom
           ======================================================== */}
        <div className="lg:hidden bg-white rounded-3xl p-5 border-2 border-blue-500/20 shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coaching Tuition</span>
              <div className="text-2xl font-black text-[#0a1128]">
                ₹{minBatchFee.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle size={12} weight="fill" className="text-emerald-600" />
              Zero Platform Fee
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => handleBookTrial()}
              className="bg-[#0066ff] hover:bg-blue-700 text-white font-black py-3 px-3 rounded-2xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Ticket size={18} weight="bold" />
              <span>Book Free Trial</span>
            </button>
            <button
              onClick={() => handleEnrollBatch()}
              className="bg-slate-900 hover:bg-black text-white font-extrabold py-3 px-3 rounded-2xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CalendarPlus size={16} weight="bold" />
              <span>Enroll Batch</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <Sparkle size={13} weight="fill" className="text-emerald-600" />
              100% Free 1-Day Trial Session
            </span>
            <a
              href="#inquire-section"
              className="text-blue-600 font-bold hover:underline"
            >
              Ask Coach Question →
            </a>
          </div>
        </div>

        {/* ========================================================
            STICKY SUB-NAVIGATION PILLS BAR
            Allows 1-tap jumping to any section without infinite scrolling
           ======================================================== */}
        <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto hide-scrollbar flex items-center gap-1 sm:gap-2">
          <a
            href="#batches-section"
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Clock size={15} weight="fill" className="text-blue-600" />
            <span>Batches &amp; Timings</span>
          </a>
          <a
            href="#coach-safety-section"
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <GraduationCap size={15} weight="fill" className="text-emerald-600" />
            <span>Coach &amp; Safety</span>
          </a>
          <a
            href="#facilities-location-section"
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Buildings size={15} weight="fill" className="text-purple-600" />
            <span>Amenities &amp; Map</span>
          </a>
          <a
            href="#reviews-section"
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Star size={15} weight="fill" className="text-amber-500" />
            <span>Parent Reviews {academy.reviewsCount > 0 ? `(${academy.reviewsCount})` : ''}</span>
          </a>
          <a
            href="#inquire-section"
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-slate-100 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ChatCircleDots size={15} weight="fill" className="text-blue-500" />
            <span>Ask Coach</span>
          </a>
        </div>

        {/* 4. 2-COLUMN DESKTOP EDITORIAL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ========================================================
              LEFT COLUMN (65% width): Streamlined Editorial Specs
             ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ----------------------------------------------------
                SECTION 1: AVAILABLE BATCHES & TIMINGS
               ---------------------------------------------------- */}
            <div id="batches-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Clock size={22} weight="fill" className="text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1128]">
                    Available Batches &amp; Timings
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
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
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        No batches listed for this category yet.
                      </div>
                    );
                  }

                  return filteredBatches.map((batch, index) => {
                    const isSelected = selectedBatchIndex === index;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedBatchIndex(index)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
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

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} weight="bold" className="text-blue-600" />
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

                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                          {batch.monthlyFee !== undefined && (
                            <div className="text-left md:text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Tuition Fee</span>
                              <span className="font-mono font-extrabold text-sm text-emerald-700">₹{batch.monthlyFee}/mo</span>
                            </div>
                          )}
                          <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg">
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
            <div id="coach-safety-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 scroll-mt-28">
              {/* Part A: Head Coach Profile */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <GraduationCap size={22} weight="fill" className="text-emerald-600" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1128]">
                    Head Coach &amp; Training Faculty
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
                    {academy.coachName.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">{academy.coachName}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        NIS Certified ✓
                      </span>
                    </div>
                    <p className="text-xs font-bold text-blue-600">{academy.coachTitle}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Professional athletic mentor specializing in youth agility, technique discipline, and tournament coaching in Uttar Pradesh championships.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Ratio</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{academy.ratio}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Faculty</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{academy.coachesCount} Coaches</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Police Verified</div>
                    <div className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5">100% Cleared</div>
                  </div>
                </div>
              </div>

              {/* Part B: Physical Safety Audit Report */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} weight="fill" className="text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">
                        Physical Safety Audit Checklist
                      </h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Inspection Certificate #KUC-AUD-8841
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Safe
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                    <VideoCamera size={18} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[11px] font-semibold">24/7 CCTV Surveillance Courts &amp; Gate</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                    <FirstAid size={18} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[11px] font-semibold">First Aid Trauma Kit &amp; Doctor Tie-up</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                    <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[11px] font-semibold">Police Verified Background for All Staff</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2.5">
                    <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                    <span className="text-slate-800 text-[11px] font-semibold">Clean Gender-Separated Washrooms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 3: AMENITIES & CAMPUS LOCATION (Unified)
               ---------------------------------------------------- */}
            <div id="facilities-location-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 scroll-mt-28">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Buildings size={22} weight="fill" className="text-purple-600" />
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1128]">
                  Campus Facilities &amp; Location
                </h2>
              </div>

              {/* Amenities Grid */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Infrastructure &amp; Amenities
                </span>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {academy.facilities.map((facility, index) => (
                    <li key={index} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-medium">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="truncate">{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <MapPin size={16} weight="fill" className="text-red-500" />
                    <span>{academy.name}</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 text-[10px]">
                    📍 {academy.distanceText} away
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{academy.address}</p>
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(academy.name + ' ' + academy.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline text-xs"
                  >
                    Open in Google Maps Navigation ↗
                  </a>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                SECTION 4: DIRECT ACADEMY INQUIRY & QUESTIONS
               ---------------------------------------------------- */}
            <div id="inquire-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4 scroll-mt-28">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ChatCircleDots size={22} weight="fill" className="text-blue-600" />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0a1128]">
                      Have Questions? Ask Coach {academy.coachName}
                    </h2>
                    <p className="text-xs text-slate-500">
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
                    {[
                      'Do you offer weekend batches?',
                      'What safety gear or shoes are required?',
                      'Can I meet the coach before enrolling?',
                      'Are transport or van services available?',
                    ].map((prompt) => (
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
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-500/20 shadow-lg space-y-5">
              
              {/* Dynamic Tuition Header */}
              {(() => {
                const selectedBatch = academy.batches?.[selectedBatchIndex] || academy.batches?.[0];
                const batchFees = (academy.batches || [])
                  .map((b) => Number(b.monthlyFee))
                  .filter((fee) => !isNaN(fee) && fee > 0);
                const minBatchFee = batchFees.length > 0 ? Math.min(...batchFees) : (Number(academy.fee) || 1800);
                const displayFee = selectedBatch?.monthlyFee ? Number(selectedBatch.monthlyFee) : minBatchFee;

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
                    <div className="text-3xl font-black text-[#0a1128]">
                      ₹{displayFee.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-slate-400">/ month</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Selected slot: <strong>{selectedBatch?.name || 'Standard Batch'}</strong> ({selectedBatch?.time || 'Regular Schedule'})
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
                        {b.name} • {b.time} (₹{b.monthlyFee || minBatchFee}/mo)
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

      {/* 5. Mobile Sticky Bottom Booking Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3.5 flex items-center justify-between gap-3 z-40 shadow-2xl">
        <div>
          <span className="text-[10px] font-bold text-slate-400 block">Monthly Fee</span>
          <span className="text-base font-black text-[#0a1128]">Starts from ₹{minBatchFee.toLocaleString('en-IN')}/mo</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookTrial}
            className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Ticket size={16} weight="bold" />
            Free Trial
          </button>
          <button
            onClick={handleEnrollBatch}
            className="bg-slate-900 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
}
