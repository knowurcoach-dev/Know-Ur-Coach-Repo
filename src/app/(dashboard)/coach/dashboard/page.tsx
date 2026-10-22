"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import {
  checkInStudent,
  getCoachDashboardData,
  submitCoachKycProfile,
  updateCoachAcademyProfile,
  getCoachTournamentsAction,
} from '@/lib/actions';
import { parseDocsPayload } from '@/lib/coach-docs';
import { getCategoryEmoji, getCategoryDisplayName } from '@/lib/categories';
import { CoachDashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import {
  SealCheck,
  PencilSimple,
  CalendarPlus,
  Users,
  Trophy,
  WhatsappLogo,
  CheckCircle,
  Clock,
  Spinner,
  ArrowRight,
  ShieldCheck,
  CurrencyInr,
  Buildings,
  Star,
  Check,
  Lock,
  LockKey,
  WarningCircle,
  FileArrowUp,
  Image as ImageIcon,
  Plus,
  Trash,
  Phone,
  MapPin,
  Sparkle,
  ArrowSquareOut,
  Info,
  ArrowsClockwise,
  Crown,
  CreditCard,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';

interface StudentRosterItem {
  id: string;
  childId?: string;
  batchId?: string;
  name: string;
  type: string;
  passInfo: string;
  initials: string;
  colorBg: string;
  colorText: string;
  status: 'present' | 'absent';
}

interface BatchItem {
  id?: string;
  name: string;
  category?: string;
  coachName?: string;
  schedule: string;
  ageGroup: string;
  totalSeats: number;
  seatsFilled?: number;
  monthlyFee: number;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const { session, user, status } = useAuth();
  const { showToast } = usePersona();
  const { openModal } = useModalStore();
  const [isPending, startTransition] = useTransition();

  // File Input Refs for Real Upload Interactions
  const govIdFileRef = useRef<HTMLInputElement>(null);
  const nisCertFileRef = useRef<HTMLInputElement>(null);
  const venuePhotosFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // Centre Data
  const [centreData, setCentreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KYC & Onboarding State
  const [kycStatus, setKycStatus] = useState<string>('PENDING'); // PENDING | DOCS_REVIEW | REFERRED_BACK | REJECTED | APPROVED
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [referredBackRemarks, setReferredBackRemarks] = useState<string>('');

  // Active Tab in Onboarding Hub (Platform Plan removed from 4th step)
  const [activeHubTab, setActiveHubTab] = useState<'safety' | 'docs' | 'batches' | 'gallery'>('safety');
  const [platformConfig, setPlatformConfig] = useState<any>(null);

  // Safety Checklist State (starts clean for newly registered coach)
  const [safetyChecklist, setSafetyChecklist] = useState({
    cctvMonitored: false,
    nisCertified: false,
    policeVerifiedStaff: false,
    firstAidAvailable: false,
    girlChangingRoom: false,
    drinkingWater: false,
    fireSafety: false,
    sanitizedEquipment: false,
  });

  // Digital KYC Documents (starts clean with no default filenames)
  const [docGovIdName, setDocGovIdName] = useState<string>('');
  const [docGovIdNumber, setDocGovIdNumber] = useState<string>('');
  const [docGovIdUrl, setDocGovIdUrl] = useState<string>('');
  const [docNisCertName, setDocNisCertName] = useState<string>('');
  const [docNisCertUrl, setDocNisCertUrl] = useState<string>('');
  const [venuePhotos, setVenuePhotos] = useState<string[]>([]);

  // Gallery Showcase Images for Activities Detail Page
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Batches State (starts clean for new coach)
  const [batches, setBatches] = useState<BatchItem[]>([]);

  // Selected Subscription Plan
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Live Class Roster (starts clean for new coach)
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [checkingStudentId, setCheckingStudentId] = useState<string | null>(null);

  // Tournament metrics state
  const [tournamentsCount, setTournamentsCount] = useState<number>(0);
  const [registeredParticipantsCount, setRegisteredParticipantsCount] = useState<number>(0);

  // Load Coach & CoachingCentre Data
  useEffect(() => {
    async function loadData() {
      if (status === 'loading') return;

      const userEmail = session?.user?.email || (user as any)?.email;
      if (!userEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getCoachDashboardData(userEmail);
        if (res.config) {
          setPlatformConfig(res.config);
        }
        if (res.centre) {
          setCentreData(res.centre);
          setKycStatus(res.centre.kycStatus || 'PENDING');
          setRejectionReason(res.centre.rejectionReason || '');
          setReferredBackRemarks(res.centre.referredBackRemarks || '');

          if (res.centre.cctvMonitored !== undefined) {
            setSafetyChecklist({
              cctvMonitored: Boolean(res.centre.cctvMonitored),
              nisCertified: Boolean(res.centre.nisCertified),
              policeVerifiedStaff: Boolean(res.centre.policeVerifiedStaff),
              firstAidAvailable: Boolean(res.centre.firstAidAvailable),
              girlChangingRoom: Boolean(res.centre.facilities?.some((f: any) => f.description?.toLowerCase().includes('girl changing'))),
              drinkingWater: Boolean(res.centre.facilities?.some((f: any) => f.description?.toLowerCase().includes('water'))),
              fireSafety: Boolean(res.centre.facilities?.some((f: any) => f.description?.toLowerCase().includes('fire'))),
              sanitizedEquipment: Boolean(res.centre.facilities?.some((f: any) => f.description?.toLowerCase().includes('sanitized'))),
            });
          }

          if (res.centre.batches && res.centre.batches.length > 0) {
            setBatches(
              res.centre.batches.map((b: any) => ({
                id: b.id,
                name: b.name,
                category: b.category || (res.centre?.category ? res.centre.category.split(',')[0].trim().toLowerCase() : 'badminton'),
                coachName: b.coachName || '',
                schedule: b.pureSchedule || b.schedule,
                ageGroup: b.ageGroup,
                totalSeats: b.totalSeats,
                seatsFilled: b.seatsFilled || 0,
                monthlyFee: Number(b.monthlyFee) || 1800,
              }))
            );
          } else {
            setBatches([]);
          }

          if (res.centre.bookings && res.centre.bookings.length > 0) {
            const today = new Date();
            setRoster(
              res.centre.bookings.map((bk: any) => {
                const todayAtt = bk.attendances?.find((a: any) => {
                  const d = new Date(a.date);
                  return (
                    d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth() &&
                    d.getDate() === today.getDate()
                  );
                });
                const isPresentToday = todayAtt ? todayAtt.isPresent : Boolean(bk.isCheckedIn);

                return {
                  id: bk.id,
                  childId: bk.childId || bk.child?.id,
                  batchId: bk.batchId || bk.batch?.id,
                  name: bk.child?.fullName || bk.parent?.fullName || 'Student',
                  type: bk.passType === 'FREE_TRIAL' ? 'Trial Class' : 'Enrolled',
                  passInfo: `Pass: ${bk.passId || 'KUC-' + bk.id.slice(-6)} • Regular Student`,
                  initials: (bk.child?.fullName || 'ST').slice(0, 2).toUpperCase(),
                  colorBg: 'bg-blue-100',
                  colorText: 'text-blue-700',
                  status: isPresentToday ? 'present' : 'absent',
                };
              })
            );
          } else {
            setRoster([]);
          }

          // Extract documents info from statusNotes if present
          if (res.centre.statusNotes) {
            const payload = parseDocsPayload(res.centre);
            if (payload) {
              if (payload.govId?.name && payload.govId.name !== 'Govt_ID_Pending.pdf' && payload.govId.name !== 'Provided') {
                setDocGovIdName(payload.govId.name);
              }
              if (payload.govId?.number) {
                setDocGovIdNumber(payload.govId.number);
              }
              if (payload.govId?.url) {
                setDocGovIdUrl(payload.govId.url);
              }
              if (payload.nisCert?.name && payload.nisCert.name !== 'NIS_Coach_Certificate.pdf' && payload.nisCert.name !== 'Provided') {
                setDocNisCertName(payload.nisCert.name);
              }
              if (payload.nisCert?.url) {
                setDocNisCertUrl(payload.nisCert.url);
              }
              if (payload.venuePhotos && payload.venuePhotos.length > 0) {
                setVenuePhotos(payload.venuePhotos.map((p: any) => p.url).filter(Boolean));
              }
            } else {
              const govMatch = res.centre.statusNotes.match(/Govt ID \(([^)]+)\)/);
              if (govMatch && govMatch[1] && govMatch[1] !== 'Provided' && govMatch[1] !== 'Govt_ID_Pending.pdf') {
                setDocGovIdName(govMatch[1]);
              }
              const nisMatch = res.centre.statusNotes.match(/NIS Cert \(([^)]+)\)/);
              if (nisMatch && nisMatch[1] && nisMatch[1] !== 'Provided' && nisMatch[1] !== 'NIS_Coach_Certificate.pdf') {
                setDocNisCertName(nisMatch[1]);
              }
            }
          }

          if (res.centre.planTier === 'PREMIUM') {
            setSelectedPlan('pro');
          } else {
            setSelectedPlan('starter');
          }
        } else {
          setCentreData(null);
          setBatches([]);
          setRoster([]);
        }

        // Load hosted tournaments and registered participant rosters
        try {
          const tRes = await getCoachTournamentsAction(userEmail);
          if (tRes?.success && tRes.tournaments) {
            setTournamentsCount(tRes.tournaments.length);
            const totalReg = tRes.tournaments.reduce((acc: number, t: any) => acc + (t.participantsCount || 0), 0);
            setRegisteredParticipantsCount(totalReg);
          }
        } catch (tErr) {
          console.warn('Could not load coach tournaments in dashboard:', tErr);
        }
      } catch (err) {
        console.warn('Could not load coach centre data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session, user, status]);

  const handleCheckIn = (student: StudentRosterItem) => {
    if (centreData?.isSuspended) {
      showToast('🔒 Academy account is suspended. Student check-ins are locked.');
      return;
    }
    if (!subStatus.canOperate) {
      showToast(`🔒 ${subStatus.headline}. Please renew your plan to check in students.`);
      return;
    }
    if (kycStatus !== 'APPROVED' && !centreData?.isActive) {
      showToast('🔒 Student check-in is locked until your academy profile is verified.');
      return;
    }
    setCheckingStudentId(student.id);
    startTransition(async () => {
      try {
        const res = await checkInStudent(student.id, student.name, student.batchId, 'PRESENT');
        if (res.success) {
          setRoster((prev) =>
            prev.map((s) => (s.id === student.id ? { ...s, status: 'present' } : s))
          );
          showToast(`✅ ${res.message}`);
        } else {
          showToast(res.message || `Failed to check in ${student.name}`);
        }
      } catch (err) {
        showToast(`Failed to check in ${student.name}`);
      } finally {
        setCheckingStudentId(null);
      }
    });
  };

  const handleUndoCheckIn = (student: StudentRosterItem) => {
    setCheckingStudentId(student.id);
    startTransition(async () => {
      try {
        const res = await checkInStudent(student.id, student.name, student.batchId, 'ABSENT');
        if (res.success) {
          setRoster((prev) =>
            prev.map((s) => (s.id === student.id ? { ...s, status: 'absent' } : s))
          );
          showToast(`Marked ${student.name} as ABSENT`);
        } else {
          showToast(res.message || `Error updating ${student.name}`);
        }
      } catch (err) {
        showToast(`Error updating ${student.name}`);
      } finally {
        setCheckingStudentId(null);
      }
    });
  };

  // Compress images to reasonable dimensions and quality before encoding to data URL
  const compressFileToDataUrl = (file: File, maxDim = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((event.target?.result as string) || '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = (event.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Upload Handlers
  const handleGovIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocGovIdName(file.name);
      const dataUrl = await compressFileToDataUrl(file);
      if (dataUrl) setDocGovIdUrl(dataUrl);
      showToast(`📎 Attached Govt ID: ${file.name}`);
    }
  };

  const handleNisCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocNisCertName(file.name);
      const dataUrl = await compressFileToDataUrl(file);
      if (dataUrl) setDocNisCertUrl(dataUrl);
      showToast(`📎 Attached NIS Certificate: ${file.name}`);
    }
  };

  const handleVenuePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const compressedList = await Promise.all(
        Array.from(files).map((file) => compressFileToDataUrl(file))
      );
      setVenuePhotos((prev) => [...prev, ...compressedList.filter(Boolean)]);
      showToast(`📸 Added ${files.length} venue photo(s)`);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const compressedList = await Promise.all(
        Array.from(files).map((file) => compressFileToDataUrl(file))
      );
      setGalleryImages((prev) => [...prev, ...compressedList.filter(Boolean)]);
      showToast(`📸 Added ${files.length} showcase photo(s)`);
    }
  };

  // Submit Profile & In-App KYC
  const handleSubmitKyc = async () => {
    const userEmail = session?.user?.email || (user as any)?.email;
    const centreId = centreData?.id;

    if (!centreId && !userEmail) {
      showToast('⚠️ No academy profile loaded. Please refresh or sign in again.');
      return;
    }

    // 1. Mandatory Govt ID validation
    if (!docGovIdName && !docGovIdUrl) {
      showToast('⚠️ Coach Govt ID (Aadhaar / Voter ID) is mandatory for verification.');
      setActiveHubTab('docs');
      const hub = document.getElementById('onboarding-hub');
      if (hub) hub.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Mandatory Batches validation (minimum 1 batch required before submitting for review)
    if (batches.length === 0) {
      showToast('⚠️ At least one coaching batch with category, schedule, and tuition fee is mandatory before submitting for verification review.');
      setActiveHubTab('batches');
      const hub = document.getElementById('onboarding-hub');
      if (hub) hub.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 3. Mandatory batch field validation
    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      if (!b.name || !b.name.trim()) {
        showToast(`⚠️ Please enter a Batch Name for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
      if (!b.category || !b.category.trim()) {
        showToast(`⚠️ Please select an Activity/Category for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
      if (!b.schedule || !b.schedule.trim()) {
        showToast(`⚠️ Please enter Schedule & Timings for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
      if (!b.ageGroup || !b.ageGroup.trim()) {
        showToast(`⚠️ Please enter Age Group for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
      if (!b.totalSeats || b.totalSeats < 1) {
        showToast(`⚠️ Please set valid Capacity (min 1 seat) for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
      if (b.monthlyFee === undefined || b.monthlyFee === null || Number(b.monthlyFee) <= 0) {
        showToast(`⚠️ Please enter a valid Monthly Tuition Fee (greater than ₹0) for Batch #${i + 1}`);
        setActiveHubTab('batches');
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await submitCoachKycProfile({
          centreId,
          userEmail,
          safetyChecklist: {
            cctvMonitored: safetyChecklist.cctvMonitored,
            nisCertified: safetyChecklist.nisCertified,
            policeVerifiedStaff: safetyChecklist.policeVerifiedStaff,
            firstAidAvailable: safetyChecklist.firstAidAvailable,
            facilities: [
              safetyChecklist.cctvMonitored ? '24/7 CCTV Monitored' : null,
              safetyChecklist.nisCertified ? 'NIS Certified Head Coach' : null,
              safetyChecklist.policeVerifiedStaff ? 'Police Verified Staff' : null,
              safetyChecklist.firstAidAvailable ? 'First Aid & Medical Kit' : null,
              safetyChecklist.girlChangingRoom ? 'Girl Changing Room' : null,
              safetyChecklist.drinkingWater ? 'Purified Drinking Water' : null,
              safetyChecklist.fireSafety ? 'Fire Safety & Extinguisher' : null,
              safetyChecklist.sanitizedEquipment ? 'Sanitized Equipment' : null,
            ].filter(Boolean) as string[],
          },
          docs: {
            govIdDocName: docGovIdName || undefined,
            govIdNumber: docGovIdNumber || undefined,
            govIdUrl: docGovIdUrl || undefined,
            nisCertDocName: docNisCertName || undefined,
            nisCertUrl: docNisCertUrl || undefined,
            venuePhotoNames: venuePhotos.length > 0 ? venuePhotos : undefined,
          },
          planTier: selectedPlan,
          batches: batches.map((b) => ({
            name: b.name.trim(),
            category: b.category?.trim().toLowerCase(),
            coachName: b.coachName?.trim() || undefined,
            schedule: b.schedule.trim(),
            ageGroup: b.ageGroup.trim(),
            totalSeats: Number(b.totalSeats),
            monthlyFee: Number(b.monthlyFee),
          })),
        });

        if (res.success) {
          setKycStatus('DOCS_REVIEW');
          setReferredBackRemarks('');
          if (res.centre) {
            setCentreData(res.centre);
          }
          showToast('🎉 Digital KYC profile submitted for in-app compliance review!');
          // Smooth scroll to top so the coach immediately sees the "Application Under Digital Verification Review" banner
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showToast('⚠️ ' + (res.message || 'Submission failed'));
        }
      } catch (err) {
        console.error('Submit KYC error:', err);
        showToast('⚠️ Could not submit KYC profile. Please retry.');
      }
    });
  };

  const handleAddBatch = () => {
    const defaultCat = (centreData?.categories && centreData.categories[0]) ||
      (centreData?.category ? centreData.category.split(',')[0].trim().toLowerCase() : '');
    setBatches([
      ...batches,
      {
        name: `Batch #${batches.length + 1}`,
        category: defaultCat,
        coachName: centreData?.headCoachName || '',
        schedule: 'Tue, Thu, Sat • 4:00 PM - 5:15 PM',
        ageGroup: '7 - 14 Yrs',
        totalSeats: 15,
        seatsFilled: 0,
        monthlyFee: 1800,
      },
    ]);
    showToast('Added new batch. Select category, timing & tuition fee below.');
  };

  const handleRemoveBatch = (index: number) => {
    if (batches.length <= 1) return;
    setBatches(batches.filter((_, idx) => idx !== index));
    showToast('Batch removed');
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
    showToast('Added showcase photo to activity gallery!');
  };

  const isApproved = kycStatus === 'APPROVED';
  const isPendingReview = kycStatus === 'DOCS_REVIEW';
  const isReferredBack = kycStatus === 'REFERRED_BACK';
  const isRejected = kycStatus === 'REJECTED';
  const isPendingOnboarding = kycStatus === 'PENDING';

  const subStatus = getCentreSubscriptionStatus(centreData, platformConfig);
  const isPlanActive = subStatus.canOperate;
  const isOperationsUnlocked = isPlanActive;
  const isPublicLive = subStatus.isPublicLive;
  const isCoachSubscribed =
    (centreData?.planTier === 'STANDARD' ||
      centreData?.planTier === 'PREMIUM' ||
      Boolean(centreData?.isTrialActive)) &&
    Boolean(subStatus.canOperate);

  const presentCount = roster.filter((s) => s.status === 'present').length;
  const activeBatch = batches.length > 0 ? batches[0] : null;
  const liveClassName = activeBatch
    ? `${activeBatch.name}${activeBatch.ageGroup ? ` (Ages ${activeBatch.ageGroup})` : ''}`
    : 'Active Academy Session';
  const liveClassSchedule = activeBatch?.schedule
    ? `Today • ${activeBatch.schedule}`
    : 'Today • 4:00 PM - 5:15 PM (Main Training Ground)';
  const academyName =
    centreData?.name ||
    (session?.user?.name ? `${session.user.name}'s Academy` : 'My Coaching Centre');
  const headCoach = centreData?.headCoachName || session?.user?.name || 'Head Coach';
  const locality = centreData?.locality?.replace('-', ' ') || (session?.user as any)?.locality || 'Agra';
  const academyId = centreData?.id || '';

  if (loading || status === 'loading') {
    return <CoachDashboardSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ══════════════════════════════════════════
            TOP HEADER CARD
           ══════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0a1128] to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              {centreData?.isSuspended ? (
                <>
                  <WarningCircle size={14} weight="fill" className="text-red-400" />
                  <span className="text-red-300">Account Suspended</span>
                </>
              ) : isApproved ? (
                <>
                  <SealCheck size={14} weight="fill" className="text-emerald-400" />
                  <span className="text-emerald-300">Approved &amp; Verified Academy</span>
                </>
              ) : isPendingReview ? (
                <>
                  <Clock size={14} weight="bold" className="text-blue-300" />
                  <span className="text-blue-200">Pending Review — Under Verification</span>
                </>
              ) : isReferredBack ? (
                <>
                  <WarningCircle size={14} weight="fill" className="text-amber-400" />
                  <span className="text-amber-200">Action Required — Revisions Requested</span>
                </>
              ) : isRejected ? (
                <>
                  <WarningCircle size={14} weight="fill" className="text-rose-400" />
                  <span className="text-rose-300">Application Declined</span>
                </>
              ) : (
                <>
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-amber-200">Pending Review — Profile Setup Required</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight capitalize">
              {academyName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {locality}, Agra • Head Coach: <strong className="text-white">{headCoach}</strong> • {batches.length} Listed Batches
            </p>
            {centreData?.category && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {centreData.category.split(',').map((cat: string) => cat.trim()).filter(Boolean).map((cat: string) => (
                  <span key={cat} className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <span>{getCategoryEmoji(cat)}</span>
                    <span>{getCategoryDisplayName(cat)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {isPublicLive ? (
              <Link
                href={`/activities/${academyId}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Live Public Profile</span>
                <ArrowSquareOut size={15} weight="bold" />
              </Link>
            ) : isApproved && !isPlanActive ? (
              <Link
                href="/coach/plans"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Activate Plan to Go Live</span>
                <Crown size={15} weight="bold" />
              </Link>
            ) : (
              <div className="bg-white/10 border border-white/10 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                <Lock size={14} />
                <span>
                  {centreData?.isSuspended
                    ? 'Account Suspended'
                    : isPendingReview
                    ? 'Listing Queued (Under Review)'
                    : isReferredBack
                    ? 'Revisions Required'
                    : isRejected
                    ? 'Application Declined'
                    : 'Public Listing Locked'}
                </span>
              </div>
            )}

            {/* Host Tournament Quick Action Button (Locked for non-subscription) */}
            {isCoachSubscribed ? (
              <button
                onClick={() => openModal('competition-host', { centre: centreData, isSubscribed: true })}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trophy size={15} weight="fill" />
                <span>Host Tournament</span>
              </button>
            ) : (
              <Link
                href="/coach/plans"
                className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
                title="Tournament hosting is locked for free/unsubscribed academies. Upgrade to unlock."
              >
                <Lock size={14} className="text-amber-400" />
                <span>Host Tournament</span>
                <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">PRO</span>
              </Link>
            )}

            <button
              onClick={() => {
                setActiveHubTab('batches');
                const hub = document.getElementById('onboarding-hub');
                if (hub) hub.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all border border-white/15 cursor-pointer flex items-center gap-1.5"
            >
              <PencilSimple size={15} weight="bold" />
              Configure Batches
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DYNAMIC APPLICATION & SUBSCRIPTION STATUS ALERT BANNERS
           ══════════════════════════════════════════ */}

        {/* 0. ACCOUNT SUSPENSION BANNER */}
        {centreData?.isSuspended && (
          <div className="bg-gradient-to-r from-red-500/15 via-rose-500/20 to-red-500/15 border-2 border-red-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <WarningCircle size={26} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-red-200 text-red-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Account Suspended
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-red-950 leading-snug">
                    Academy Operations &amp; Public Visibility Temporarily Suspended
                  </h3>
                  <p className="text-xs text-red-900 font-medium leading-relaxed mt-0.5">
                    Your academy has been placed on administrative hold by trust &amp; safety compliance. Public listings and operational tools are paused. Please contact{' '}
                    <a href="mailto:support@knowurcoach.in" className="font-bold underline text-red-950">
                      support@knowurcoach.in
                    </a>{' '}
                    to review your account status.
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@knowurcoach.in?subject=Suspended%20Academy%20Review%20Appeal"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <span>Contact Compliance Desk</span>
                <ArrowRight size={14} weight="bold" />
              </a>
            </div>
          </div>
        )}

        {/* 0B. SUBSCRIPTION EXPIRED / LOCKED / WARNING ALERTS */}
        {subStatus.status === 'EXPIRED' && (
          <div className="bg-gradient-to-r from-red-500/10 via-rose-500/15 to-red-500/10 border-2 border-red-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <WarningCircle size={26} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-red-200 text-red-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Subscription Inactive
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-red-950 leading-snug">
                    {subStatus.isTrial ? 'Free Partner Trial Has Expired' : 'Academy Subscription Has Expired'}
                  </h3>
                  <p className="text-xs text-red-900 font-medium leading-relaxed mt-0.5">
                    Your subscription expired on <span className="font-bold underline">{subStatus.formattedExpiry}</span>. Operational tools (attendance rosters, student leads, batch schedules) and public search listings are currently locked. Renew your plan to immediately resume academy activities.
                  </p>
                </div>
              </div>
              <Link
                href="/coach/plans"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <CreditCard size={16} weight="bold" />
                <span>Renew Subscription Now</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        )}

        {subStatus.status === 'LOCKED' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border-2 border-amber-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Lock size={26} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Subscription Required
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-amber-950 leading-snug">
                    Activate a Partner Plan to Unlock Academy Operations
                  </h3>
                  <p className="text-xs text-amber-900 font-medium leading-relaxed mt-0.5">
                    {subStatus.subtext || 'Choose a subscription plan to unlock student attendance rosters, lead CRM, batch management, and live national directory listing.'}
                  </p>
                </div>
              </div>
              <Link
                href="/coach/plans"
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <CreditCard size={16} weight="bold" />
                <span>Explore Partner Plans</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        )}

        {subStatus.status === 'EXPIRING_SOON' && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Clock size={24} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Expiring in {subStatus.daysRemaining} {subStatus.daysRemaining === 1 ? 'Day' : 'Days'}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-amber-950 leading-snug">
                    {subStatus.isTrial ? 'Free Partner Trial Ending Soon' : 'Subscription Renewal Approaching'}
                  </h3>
                  <p className="text-xs text-amber-900 font-medium leading-relaxed mt-0.5">
                    Your plan will expire on <strong className="text-amber-950">{subStatus.formattedExpiry}</strong>. Renew or upgrade early to prevent interruptions to your public listing and attendance rosters.
                  </p>
                </div>
              </div>
              <Link
                href="/coach/plans"
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <CreditCard size={15} weight="bold" />
                <span>Renew / Extend Plan</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        )}

        {/* 1. PENDING PROFILE ONBOARDING BANNER */}
        {isPendingOnboarding && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Clock size={22} className="sm:hidden" weight="bold" />
                  <Clock size={24} className="hidden sm:block" weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-200/80 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Onboarding Incomplete
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-amber-950 leading-snug break-words">
                    Complete Your Academy Profile &amp; Verification Documents
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1 break-words">
                    Welcome to KnowUrCoach! Your academy is registered with zero upfront payment. To launch your verified public listing and start taking parent bookings, complete your <strong>Facility &amp; Safety Checklist</strong> and <strong>upload verification documents</strong> below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const hub = document.getElementById('onboarding-hub');
                  if (hub) hub.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black px-4 py-2.5 sm:py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 self-stretch sm:self-start"
              >
                <span>Complete Profile Now</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-amber-200/60 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-800 font-bold min-w-0">
                <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0" />
                <span className="truncate">1. Account Registered</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-amber-900 font-black min-w-0">
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] shrink-0">2</span>
                <span className="truncate">2. Safety &amp; Docs (Current)</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 font-medium min-w-0">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] shrink-0">3</span>
                <span className="truncate">3. Admin Review</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 font-medium min-w-0">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] shrink-0">4</span>
                <span className="truncate">4. Live Listing</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. UNDER REVIEW BANNER */}
        {isPendingReview && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Spinner size={22} className="sm:hidden animate-spin" />
                  <Spinner size={24} className="hidden sm:block animate-spin" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-blue-200/80 text-blue-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Turnaround: 24–48 Hours • Digital Verification
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-blue-950 leading-snug break-words">
                    Application Pending Admin Review
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed mt-1 break-words">
                    {isPlanActive
                      ? 'Your subscription is active and your verification documents have been submitted to our platform verification desk. Our team is validating your credentials and facility photos. Your public listing will automatically go live as soon as approved (typically within 24–48 hours)!'
                      : 'Your details and verification documents have been submitted to our platform verification desk. Our team is validating your credentials and facility photos. No payment is required for onboarding or approval. Once approved, activate your partner plan or free trial to make your public listing live!'}
                  </p>
                </div>
              </div>
              <div className="bg-white/80 border border-blue-200 rounded-2xl p-3 text-xs text-blue-900 shrink-0 text-center self-stretch sm:self-start">
                <div className="font-black">Status</div>
                <div className="font-bold text-[11px] text-blue-700 mt-0.5 uppercase">Pending Review</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-blue-200/60 text-xs">
              {docGovIdName ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white px-3 py-1 rounded-xl border border-blue-100">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span className="truncate">Govt ID Attached ({docGovIdName})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                  <Clock size={15} className="text-slate-400 shrink-0" />
                  <span>Govt ID Pending</span>
                </div>
              )}

              {docNisCertName && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white px-3 py-1 rounded-xl border border-blue-100">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span className="truncate">NIS License Attached</span>
                </div>
              )}

              {venuePhotos.length > 0 && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white px-3 py-1 rounded-xl border border-blue-100">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>{venuePhotos.length} Venue Photo(s) Attached</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. REFERRED BACK / NEEDS CHANGES BANNER */}
        {isReferredBack && (
          <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 animate-fade-in overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <WarningCircle size={22} className="sm:hidden" weight="bold" />
                  <WarningCircle size={24} className="hidden sm:block" weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Action Required by Coach
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-amber-950 leading-snug break-words">
                    Action Required: Application Referred Back by Admin
                  </h3>
                  <p className="text-xs text-amber-900 leading-relaxed mt-1 break-words">
                    The platform admin reviewed your registration and requested revisions. Please check the feedback note below, update your details or re-upload documents, and resubmit for approval.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveHubTab('docs');
                  const hub = document.getElementById('onboarding-hub');
                  if (hub) hub.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black px-4 py-2.5 sm:py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 self-stretch sm:self-start"
              >
                <span>Fix Issues &amp; Re-upload</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>

            {/* Admin Remarks Box with high visibility */}
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 text-xs space-y-1 shadow-2xs">
              <div className="font-black text-amber-900 flex items-center gap-1.5">
                <Info size={16} weight="fill" className="text-amber-600 shrink-0" />
                <span>Admin Feedback &amp; Required Actions:</span>
              </div>
              <p className="text-slate-800 font-bold leading-relaxed pl-5 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 break-words">
                "{referredBackRemarks || 'Please upload a clearer high-resolution copy of your verification documents and verify facility checklist.'}"
              </p>
            </div>
          </div>
        )}

        {/* 4. REJECTED BANNER */}
        {isRejected && (
          <div className="bg-gradient-to-r from-red-50 to-slate-100 border-2 border-red-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 animate-fade-in overflow-hidden">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <WarningCircle size={22} className="sm:hidden" weight="bold" />
                <WarningCircle size={24} className="hidden sm:block" weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-red-950 leading-snug break-words">
                  Application Declined
                </h3>
                <p className="text-xs text-red-800 leading-relaxed mt-1 break-words">
                  Reason: {rejectionReason || 'Uploaded documentation could not be verified.'}
                </p>
                <p className="text-xs text-slate-600 mt-2 break-words">
                  Please reach out to support at <a href="mailto:support@knowurcoach.in" className="text-blue-600 underline font-bold">support@knowurcoach.in</a> to submit an appeal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. APPROVED BANNER */}
        {isApproved && !centreData?.isSuspended && (
          subStatus.isPublicLive ? (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <SealCheck size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">
                    Academy Approved &amp; Verified • Listing Live
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Your academy listing is live on KnowUrCoach. Direct trial inquiries and WhatsApp leads are enabled.
                  </p>
                </div>
              </div>
              <Link
                href={`/activities/${academyId}`}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <span>View Public Listing</span>
                <ArrowSquareOut size={14} weight="bold" />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <SealCheck size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">
                    Academy KYC Verified • Plan Activation Required
                  </h3>
                  <p className="text-xs text-amber-800">
                    Your academy documentation has been audited and approved! Activate a partner plan to publish your public listing and unlock operations.
                  </p>
                </div>
              </div>
              <Link
                href="/coach/plans"
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Crown size={15} weight="bold" />
                <span>Activate Plan to Go Live</span>
              </Link>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════
            COACH PARTNER SUBSCRIPTION & GROWTH PLANS (SEPARATE & OPTIONAL)
           ══════════════════════════════════════════ */}
        {(() => {
          const isProPlan = centreData?.planTier === 'PREMIUM';
          const isStandardPlan = centreData?.planTier === 'STANDARD';
          const isTrial = subStatus.isTrial;
          const isPaidPlan = (isProPlan || isStandardPlan) && !isTrial;
          const isPubliclyListed = subStatus.isPublicLive;

          return (
            <div className="bg-gradient-to-br from-[#0a1128] via-[#101f42] to-[#0d1b3e] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/50 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      Partner Membership Tier
                    </span>

                    {centreData?.isSuspended ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                        <WarningCircle size={14} weight="fill" />
                        Account Suspended
                      </span>
                    ) : subStatus.isExpired ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                        <WarningCircle size={14} weight="fill" />
                        Subscription Expired ({subStatus.formattedExpiry})
                      </span>
                    ) : isProPlan ? (
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-sm">
                        <Crown size={14} weight="fill" />
                        Premier Pro Partner ({subStatus.daysRemaining}d left)
                      </span>
                    ) : isStandardPlan ? (
                      <span className="inline-flex items-center gap-1.5 bg-indigo-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                        <Sparkle size={14} weight="fill" />
                        Standard Growth Partner ({subStatus.daysRemaining}d left)
                      </span>
                    ) : isTrial ? (
                      <span className="inline-flex items-center gap-1.5 bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                        <Clock size={14} weight="fill" />
                        Free Partner Trial Active ({subStatus.daysRemaining}d left)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 font-extrabold text-xs px-3 py-1 rounded-full border border-rose-500/30">
                        <EyeSlash size={14} weight="bold" />
                        Unlisted Profile • Plan Required
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {centreData?.isSuspended
                      ? 'Account Under Administrative Hold'
                      : subStatus.isExpired
                      ? 'Plan Expired — Renewal Required'
                      : isProPlan
                      ? 'Premier Pro Academy Tier'
                      : isStandardPlan
                      ? 'Standard Growth Partner Tier'
                      : isTrial
                      ? `Free Starter Partner Trial (${subStatus.daysRemaining} Days Left)`
                      : 'Subscription Required to Go Public'}
                  </h2>

                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {centreData?.isSuspended
                      ? 'Your academy is temporarily suspended by compliance. Operations and public listings are paused. Please contact support@knowurcoach.in.'
                      : subStatus.isExpired
                      ? 'Your subscription period has ended. Operational rosters and public listings are paused. Renew your subscription below to restore instant WhatsApp leads and attendance management.'
                      : isPaidPlan && !isApproved
                      ? isPendingReview
                        ? 'Your paid subscription is active! Your public directory listing will automatically activate the moment our verification desk finishes reviewing your credentials (usually within 24–48 hours).'
                        : isReferredBack
                        ? 'Your paid subscription is active. Please address the revisions requested on your documents so our verification desk can approve and publish your listing.'
                        : isRejected
                        ? 'Your paid subscription is active, but your KYC verification was declined. Please reach out to support@knowurcoach.in to submit revised documents.'
                        : 'Your paid subscription is active! Please complete your facility safety checklist and upload verification documents below to launch your public listing.'
                      : isTrial && !isApproved
                      ? isPendingReview
                        ? 'Your free partner trial is active! Your public directory listing will automatically activate once admin approval is granted.'
                        : isReferredBack
                        ? 'Your free trial is active. Please address the revisions requested on your documents to get verified and published.'
                        : isRejected
                        ? 'Your free trial is active, but KYC verification was declined. Please reach out to support to appeal.'
                        : 'Your free partner trial is active! Complete your facility safety checklist and upload verification documents below to launch your public listing.'
                      : isProPlan
                      ? 'Your academy receives #1 top priority placement, instant WhatsApp lead alerts, and unlimited batch rosters.'
                      : isStandardPlan
                      ? 'Your academy is listed in the activities directory with priority search ranking and unlimited trial booking leads.'
                      : isTrial
                      ? 'You are enjoying complimentary free access to KnowUrCoach operations and directory listing during your trial period. Upgrade anytime to Standard or Premier to secure continuous visibility and enhanced rankings.'
                      : '⚠️ Newly registered academies are unlisted by default. Choose a partner plan or activate your complimentary trial to make your academy live to parents across India.'}
                  </p>

                  {/* Status & Expiry details */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-indigo-200">
                    {centreData?.planPaymentId && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        <CreditCard size={13} className="text-emerald-400" />
                        <span>Ref ID: {centreData.planPaymentId}</span>
                      </div>
                    )}
                    {centreData?.planExpiresAt && (
                      <div className="flex items-center gap-1.5 font-medium text-[11px]">
                        <Clock size={13} className={subStatus.isExpired ? "text-red-400" : "text-amber-400"} />
                        <span>
                          {subStatus.isExpired ? 'Expired: ' : 'Valid Until: '}
                          {subStatus.formattedExpiry}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 font-medium text-[11px]">
                      {isPubliclyListed ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-extrabold">
                          <Eye size={13} weight="bold" /> Public Directory: Live in Directory
                        </span>
                      ) : subStatus.publicListingStatus === 'UNDER_REVIEW' ? (
                        <span className="text-blue-400 flex items-center gap-1 font-extrabold">
                          <Clock size={13} weight="bold" /> Public Directory: Queued (Pending KYC Review)
                        </span>
                      ) : subStatus.publicListingStatus === 'PENDING_DOCS' ? (
                        <span className="text-amber-400 flex items-center gap-1 font-extrabold">
                          <Clock size={13} weight="bold" /> Public Directory: Inactive (Upload Verification Docs)
                        </span>
                      ) : subStatus.publicListingStatus === 'REVISIONS_REQUESTED' ? (
                        <span className="text-amber-400 flex items-center gap-1 font-extrabold">
                          <WarningCircle size={13} weight="bold" /> Public Directory: Inactive (Revisions Requested)
                        </span>
                      ) : subStatus.publicListingStatus === 'KYC_REJECTED' ? (
                        <span className="text-rose-400 flex items-center gap-1 font-extrabold">
                          <WarningCircle size={13} weight="bold" /> Public Directory: Blocked (KYC Declined)
                        </span>
                      ) : subStatus.publicListingStatus === 'SUSPENDED' ? (
                        <span className="text-red-400 flex items-center gap-1 font-extrabold">
                          <WarningCircle size={13} weight="bold" /> Public Directory: Paused (Account Suspended)
                        </span>
                      ) : subStatus.publicListingStatus === 'EXPIRED' ? (
                        <span className="text-red-400 flex items-center gap-1 font-extrabold">
                          <EyeSlash size={13} weight="bold" /> Public Directory: Paused (Plan Expired)
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-extrabold">
                          <EyeSlash size={13} weight="bold" /> Public Directory: Unlisted (Subscription Required)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                  <Link
                    href="/coach/plans"
                    className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown size={16} weight="bold" />
                    <span>{subStatus.isExpired ? 'Renew Subscription' : subStatus.canOperate ? 'Change / Upgrade Plan' : 'Choose Plan to Go Live'}</span>
                  </Link>
                  <Link
                    href="/coach/plans"
                    className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/15 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View All Plan Benefits &amp; Invoices</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════
            ACADEMY TOURNAMENTS & CHAMPIONSHIPS PORTAL
           ══════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Trophy size={18} weight="fill" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Academy Tournaments &amp; District Championships
                </h3>
                {!isCoachSubscribed && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-amber-300">
                    <Lock size={11} weight="bold" /> Partner Exclusive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Host official championships in {locality}, collect entry fees online via Razorpay or match-day desk, and manage real-time participant rosters.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {isCoachSubscribed ? (
                <>
                  <button
                    onClick={() => openModal('competition-host', { centre: centreData, isSubscribed: true })}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy size={15} weight="bold" />
                    <span>Host New Tournament</span>
                  </button>
                  <Link
                    href="/coach/tournaments"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users size={15} weight="bold" />
                    <span>View Registrations ({registeredParticipantsCount})</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/coach/plans"
                  className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown size={15} weight="bold" />
                  <span>Unlock Tournament Hosting</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              )}
            </div>
          </div>

          {!isCoachSubscribed ? (
            /* Locked state explanation banner */
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Lock size={20} weight="bold" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-black text-amber-950">
                    Tournament Hosting is Locked for Non-Subscribed Academies
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Publishing district championships, collecting entry fees via Razorpay, issuing verified QR passes, and viewing participant rosters requires an active <strong>Standard Growth</strong> or <strong>Premier Pro</strong> Partner plan.
                  </p>
                </div>
              </div>
              <Link
                href="/coach/plans"
                className="w-full sm:w-auto shrink-0 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl text-center transition-all whitespace-nowrap"
              >
                View Partner Plans →
              </Link>
            </div>
          ) : (
            /* Subscribed summary metrics */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                <span className="text-[10px] font-extrabold text-orange-700 uppercase tracking-wider block">
                  Tournaments Hosted
                </span>
                <div className="text-2xl font-black text-orange-950 mt-1">{tournamentsCount}</div>
                <span className="text-[11px] text-orange-800 font-medium">Published on KnowUrCoach</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                  Total Participants Registered
                </span>
                <div className="text-2xl font-black text-blue-950 mt-1">{registeredParticipantsCount}</div>
                <span className="text-[11px] text-blue-800 font-medium">Verified junior entries</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                    Payment &amp; Check-In Hub
                  </span>
                  <div className="text-xs font-extrabold text-emerald-950 mt-1">Razorpay + Match-Day Desk</div>
                  <span className="text-[11px] text-emerald-800 font-medium">Track who paid &amp; check-in status</span>
                </div>
                <Link
                  href="/coach/tournaments"
                  className="text-emerald-700 hover:text-emerald-800 font-extrabold text-xs inline-flex items-center gap-1 mt-2.5"
                >
                  <span>Open Tournament Portal</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            ONBOARDING & PROFILE COMPLETION HUB
            (Facility Checklist + Digital KYC + Batches + Photos)
           ══════════════════════════════════════════ */}
        <div id="onboarding-hub" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                Profile Completion &amp; Operations Config
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {isApproved ? 'Academy Configuration & Showcase' : 'Complete Your Profile for Verification'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your safety checklist, upload verification files, setup batches, and showcase activity photos
              </p>
            </div>

            {/* Hub Navigation Tabs - 4 Operational Steps (Plan moved to dedicated dashboard bar) */}
            <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl gap-1">
              {[
                { id: 'safety', label: '1. Facility & Safety', icon: ShieldCheck },
                { id: 'docs', label: '2. Digital KYC Uploads', icon: FileArrowUp },
                { id: 'batches', label: '3. Batches & Timings', icon: CalendarPlus },
                { id: 'gallery', label: '4. Activity Photos', icon: ImageIcon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveHubTab(id as any)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    activeHubTab === id
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} weight="bold" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* TAB 1: FACILITY & SAFETY CHECKLIST (MOVED FROM REGISTER) */}
            {activeHubTab === 'safety' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Facility &amp; Safety Compliance Checklist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select all facilities available at your centre. These badges appear prominently on your Agra parent profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'cctvMonitored', label: '24/7 CCTV Monitored Premises', desc: 'Active cameras covering entrance & courts' },
                    { key: 'nisCertified', label: 'NIS / Certified Head Coach on Staff', desc: 'Government / SAI certified diploma holder' },
                    { key: 'policeVerifiedStaff', label: 'Police Verified Support Staff', desc: 'Background verification completed' },
                    { key: 'firstAidAvailable', label: 'First-Aid & Emergency Medical Kit', desc: 'Bandages, ice packs, antiseptic stocked' },
                    { key: 'girlChangingRoom', label: 'Dedicated Girl Changing Room', desc: 'Private, secure restroom & changing area' },
                    { key: 'drinkingWater', label: 'Purified RO Drinking Water', desc: 'Hygienic cold & normal water dispenser' },
                    { key: 'fireSafety', label: 'Fire Extinguisher & Emergency Exit', desc: 'Safety signage and serviced equipment' },
                    { key: 'sanitizedEquipment', label: 'Regularly Sanitized Sports Gear', desc: 'Clean balls, cones, and practice nets' },
                  ].map(({ key, label, desc }) => {
                    const isChecked = Boolean((safetyChecklist as any)[key]);
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setSafetyChecklist((prev) => ({
                              ...prev,
                              [key]: !isChecked,
                            }))
                          }
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-extrabold">{label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Changes will be saved upon submitting verification.</span>
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('docs')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next: Upload Documents</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: IN-APP DIGITAL KYC UPLOADS (STARTUP MODEL) */}
            {activeHubTab === 'docs' && (
              <div className="space-y-6">
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={govIdFileRef}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleGovIdUpload}
                />
                <input
                  type="file"
                  ref={nisCertFileRef}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleNisCertUpload}
                />
                <input
                  type="file"
                  ref={venuePhotosFileRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleVenuePhotosUpload}
                />

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">In-App Digital KYC &amp; Verification Uploads</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Because KnowUrCoach is an agile startup, we verify everything in-app within 24–48 hours without demanding physical site inspections. Please provide clear digital documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document 1: Coach Govt ID */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        1. Coach Govt ID (Aadhaar / Voter ID) *
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        docGovIdName ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {docGovIdName ? 'Attached ✓' : 'Required *'}
                      </span>
                    </div>

                    <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-white text-center space-y-2">
                      <FileArrowUp size={28} className={`mx-auto ${docGovIdName ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {docGovIdName ? (
                        <>
                          <div className="text-xs font-bold text-slate-800 break-all">{docGovIdName}</div>
                          <div className="flex items-center justify-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => govIdFileRef.current?.click()}
                              className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Change File
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setDocGovIdName('')}
                              className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-500 font-medium">No document attached yet</div>
                          <button
                            type="button"
                            onClick={() => govIdFileRef.current?.click()}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileArrowUp size={14} weight="bold" /> Upload Aadhaar / Govt ID
                          </button>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Govt ID / Aadhaar Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={docGovIdNumber}
                        onChange={(e) => setDocGovIdNumber(e.target.value)}
                        placeholder="e.g. 12-digit Aadhaar / Voter ID Number"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Document 2: NIS Certificate */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        2. NIS / Federation Coaching Certificate (Optional)
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        docNisCertName ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {docNisCertName ? 'Attached ✓' : 'Optional'}
                      </span>
                    </div>

                    <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-white text-center space-y-2">
                      <FileArrowUp size={28} className={`mx-auto ${docNisCertName ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {docNisCertName ? (
                        <>
                          <div className="text-xs font-bold text-slate-800 break-all">{docNisCertName}</div>
                          <div className="flex items-center justify-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => nisCertFileRef.current?.click()}
                              className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Change File
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setDocNisCertName('')}
                              className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-500 font-medium">No coaching certificate attached yet</div>
                          <button
                            type="button"
                            onClick={() => nisCertFileRef.current?.click()}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileArrowUp size={14} weight="bold" /> Upload NIS / License File
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      NIS Patiala, SAI, or recognized State Sports Association diploma.
                    </p>
                  </div>
                </div>

                {/* Document 3: Venue & Safety Photos */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          3. Venue &amp; Facility Photos (Main Ground, Reception &amp; Safety Kit) (Optional)
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          venuePhotos.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {venuePhotos.length > 0 ? `${venuePhotos.length} Attached ✓` : 'Optional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Attach clear photos of your playing court, equipment, and safety gear (optional - can be added later)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => venuePhotosFileRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <FileArrowUp size={14} weight="bold" /> Upload Photos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt(
                            'Enter image URL for court/facility:',
                            'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop'
                          );
                          if (url) {
                            setVenuePhotos([...venuePhotos, url]);
                            showToast('Added venue photo');
                          }
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={14} weight="bold" /> URL
                      </button>
                    </div>
                  </div>

                  {venuePhotos.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-white text-center space-y-2">
                      <ImageIcon size={28} className="mx-auto text-slate-400" />
                      <div className="text-xs text-slate-600 font-bold">No facility photos attached yet</div>
                      <p className="text-[11px] text-slate-400">
                        Upload at least 2 photos of your venue, court, and safety kits to speed up KYC approval.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {venuePhotos.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-slate-200 border border-slate-300 group">
                          <img src={url} alt={`Venue photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setVenuePhotos(venuePhotos.filter((_, i) => i !== idx))}
                              className="bg-rose-600 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('safety')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back to Safety
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('batches')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next: Configure Batches</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: BATCHES, TIMINGS, CAPACITY & TUITION */}
            {activeHubTab === 'batches' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">Batches, Timings, Age Groups &amp; Tuition</h3>
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Required *
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your coaching batches with activity disciplines, class schedules, seats, and tuition fees.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBatch}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm self-start sm:self-auto shrink-0"
                  >
                    <Plus size={14} weight="bold" /> Add New Batch
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <WarningCircle size={18} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="font-extrabold text-amber-950 block mb-0.5">Mandatory for Verification Review</strong>
                    Creating at least one coaching batch with category, schedule, and monthly tuition fee is required before submitting your academy for review. Academy tuition fees displayed across KnowUrCoach are calculated directly from your batches.
                  </div>
                </div>

                <div className="space-y-3">
                  {batches.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-8 bg-slate-50/50 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CalendarPlus size={24} weight="bold" />
                      </div>
                      <div className="text-sm font-extrabold text-slate-800">No Batches Added Yet</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        At least one batch is mandatory for verification review. Configure schedules, category, age groups, capacity, and monthly tuition fee so parents can enroll.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddBatch}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus size={14} weight="bold" /> Add Your First Batch
                      </button>
                    </div>
                  ) : (
                    batches.map((batch, index) => {
                      const offeredCategories = centreData?.category
                        ? centreData.category.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
                        : (centreData?.categories || []);

                      return (
                      <div
                        key={index}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 relative shadow-2xs"
                      >
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200/80 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                              Batch #{index + 1}
                            </span>
                            {batch.category && (
                              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                                <span>{getCategoryEmoji(batch.category)}</span>
                                <span>{getCategoryDisplayName(batch.category)}</span>
                              </span>
                            )}
                            {batch.coachName && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                • Coach: <strong className="text-slate-700">{batch.coachName}</strong>
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatch(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash size={13} weight="bold" /> Remove
                          </button>
                        </div>

                      {/* Row 1: Category dropdown, Batch name, Assigned Coach */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Activity / Category *
                          </label>
                          <select
                            value={batch.category || offeredCategories[0] || ''}
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) => (idx === index ? { ...b, category: e.target.value } : b))
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">Select Category</option>
                            {offeredCategories.map((cat: string) => (
                              <option key={cat} value={cat}>
                                {getCategoryEmoji(cat)} {getCategoryDisplayName(cat)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Batch Name *
                          </label>
                          <input
                            type="text"
                            value={batch.name}
                            placeholder="e.g. Morning Junior Champs"
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) => (idx === index ? { ...b, name: e.target.value } : b))
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Assigned Coach (Optional)
                          </label>
                          <input
                            type="text"
                            value={batch.coachName || ''}
                            placeholder="e.g. Coach Rajesh Sharma"
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) => (idx === index ? { ...b, coachName: e.target.value } : b))
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 2: Schedule & Timings, Age Group */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Schedule &amp; Timings *
                          </label>
                          <input
                            type="text"
                            value={batch.schedule}
                            placeholder="e.g. Mon, Wed, Fri • 4:00 PM - 5:15 PM"
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) => (idx === index ? { ...b, schedule: e.target.value } : b))
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Age Group *
                          </label>
                          <input
                            type="text"
                            value={batch.ageGroup}
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) => (idx === index ? { ...b, ageGroup: e.target.value } : b))
                              )
                            }
                            placeholder="e.g. 5 - 12 Yrs"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 3: Total Capacity, Monthly Tuition Fee */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Total Capacity / Seats *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={batch.totalSeats}
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) =>
                                  idx === index ? { ...b, totalSeats: Number(e.target.value) } : b
                                )
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Monthly Tuition Fee (₹) *
                          </label>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={batch.monthlyFee}
                            onChange={(e) =>
                              setBatches(
                                batches.map((b, idx) =>
                                  idx === index ? { ...b, monthlyFee: Number(e.target.value) } : b
                                )
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                      );
                    }))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('docs')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back to Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('gallery')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next: Activity Photos</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: ACTIVITY SHOWCASE IMAGES (GALLERY FOR ACTIVITIES DETAIL PAGE) */}
            {activeHubTab === 'gallery' && (
              <div className="space-y-6">
                <input
                  type="file"
                  ref={galleryFileRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleGalleryUpload}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Activity Showcase Photos (Optional)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload images of your coaching sessions, grounds, and student awards. These photos appear on your public activity detail page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => galleryFileRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <FileArrowUp size={14} weight="bold" /> Upload Photos
                  </button>
                </div>

                {/* Add Image input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Or enter image URL (e.g. https://images.unsplash.com/...)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} weight="bold" /> Add URL
                  </button>
                </div>

                {/* Image Grid */}
                {galleryImages.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 text-center space-y-2">
                    <ImageIcon size={28} className="mx-auto text-slate-400" />
                    <div className="text-xs text-slate-600 font-bold">No showcase photos added yet</div>
                    <p className="text-[11px] text-slate-400">
                      Showcase photos are optional. You can upload photos from your device or paste image links anytime.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 group">
                        <img src={img} alt={`Showcase ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                            className="bg-rose-600 text-white p-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FINAL SUBMISSION CALL TO ACTION */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-slate-900 text-sm">
                    {kycStatus === 'DOCS_REVIEW'
                      ? 'Verification Application Status'
                      : isApproved
                      ? (subStatus.isPublicLive ? 'Academy Live & Operational' : 'Verification Approved • Plan Needed to Go Live')
                      : 'Ready to Submit?'}
                  </div>
                  {kycStatus === 'DOCS_REVIEW' && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} weight="bold" /> Under In-App Review
                    </span>
                  )}
                  {kycStatus === 'PENDING' && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Pending Submission
                    </span>
                  )}
                  {isApproved && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <SealCheck size={12} weight="fill" /> Approved &amp; Verified
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {kycStatus === 'DOCS_REVIEW'
                    ? 'Your documents have been submitted to compliance. You can update details anytime before final approval.'
                    : isApproved
                    ? (subStatus.isPublicLive ? 'Save your latest batch schedules, safety checklist, and gallery photos.' : 'Your safety credentials are approved! Activate a partner plan to publish your live directory listing.')
                    : 'Submit your checklist and digital documents for in-app verification.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitKyc}
                disabled={isPending}
                className={`w-full sm:w-auto font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 ${
                  kycStatus === 'DOCS_REVIEW'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                }`}
              >
                {isPending ? (
                  <>
                    <Spinner size={16} className="animate-spin" />
                    Submitting Profile…
                  </>
                ) : kycStatus === 'DOCS_REVIEW' ? (
                  <>
                    <CheckCircle size={18} weight="fill" className="text-white" />
                    Application Submitted ✓ (Update &amp; Resubmit)
                  </>
                ) : isReferredBack ? (
                  <>
                    <ShieldCheck size={18} weight="bold" />
                    Update &amp; Resubmit Application
                    <ArrowRight size={15} weight="bold" />
                  </>
                ) : isApproved ? (
                  <>
                    <ShieldCheck size={18} weight="bold" />
                    Save Profile Updates
                    <ArrowRight size={15} weight="bold" />
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} weight="bold" />
                    Submit Application for Verification
                    <ArrowRight size={15} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            OPERATIONAL TOOLS (LOCKED UNTIL APPROVED)
           ══════════════════════════════════════════ */}
        <div className="relative">
          {/* Frosted lock overlay if not operations unlocked */}
          {!isOperationsUnlocked && (
            <div className="absolute inset-0 bg-slate-100/75 backdrop-blur-[3px] rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-300">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg mb-3">
                <Lock size={26} weight="bold" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Operational Features Locked
              </h3>
              <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed">
                Live attendance check-ins, enrolled student roster, parent pass validation, and batch management unlock automatically once you activate a Standard or Premier partner plan.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
                <Link
                  href="/coach/plans"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Crown size={15} weight="bold" />
                  <span>Activate Partner Plan</span>
                </Link>
                {!isApproved && (
                  <button
                    onClick={() => {
                      const hub = document.getElementById('onboarding-hub');
                      if (hub) hub.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Complete Verification</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2-COLUMN RESPONSIVE OPERATIONS LAYOUT */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 items-start ${!isOperationsUnlocked ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            {/* LEFT COLUMN: Live Attendance & Class Roster */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        LIVE CLASS
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                        {liveClassName}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={13} weight="bold" />
                      {liveClassSchedule}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      {presentCount} / {roster.length} Checked In
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${roster.length > 0 ? (presentCount / roster.length) * 100 : 0}%` }}
                  />
                </div>

                {/* Roster Items */}
                <div className="space-y-3">
                  {roster.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      No enrolled students yet. Once parents register for trials or batches, students will appear in this roster for daily check-in.
                    </div>
                  ) : (
                    roster.map((student) => {
                      const isPresent = student.status === 'present';
                      const isBusy = checkingStudentId === student.id;

                      return (
                        <div
                          key={student.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl ${student.colorBg} ${student.colorText} font-black text-sm flex items-center justify-center shrink-0 border border-slate-200/60`}
                            >
                              {student.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm truncate">
                                  {student.name}
                                </span>
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    student.type === 'Trial Class'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {student.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {student.passInfo}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isPresent ? (
                              <button
                                onClick={() => handleUndoCheckIn(student)}
                                disabled={isBusy || isPending}
                                title="Click to undo check-in (mark absent)"
                                className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                              >
                                <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                                <span>Checked In</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCheckIn(student)}
                                disabled={isBusy || isPending}
                                className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                {isBusy ? <Spinner size={14} className="animate-spin" /> : null}
                                <span>Check In</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: WhatsApp CRM & Escrow */}
            <aside className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                      <Users size={20} weight="fill" className="text-blue-600" />
                      Parent Leads &amp; Inquiries
                    </h3>
                    <p className="text-[11px] text-slate-500">Direct WhatsApp leads from Agra parents</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-slate-900">Vikramaditya Rao</div>
                        <div className="text-[10px] text-slate-500">Child: Siddharth (Age 7) • Lawn Tennis</div>
                      </div>
                      <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/919897012345?text=Hi%20Vikramaditya%2C%20thank%20you%20for%20enquiring%20about%20${encodeURIComponent(
                        academyName
                      )}%20on%20KnowUrCoach.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <WhatsappLogo size={16} weight="fill" />
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Escrow Vault */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl p-6 border border-emerald-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <CurrencyInr size={22} weight="bold" className="text-emerald-700" />
                  <h3 className="font-extrabold text-emerald-950 text-base">
                    Escrow Revenue Vault
                  </h3>
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  ₹34,800{' '}
                  <span className="text-xs font-semibold text-emerald-700">Settled This Month</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Funds released within 24 hours of student check-in verification via QR scanner.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
