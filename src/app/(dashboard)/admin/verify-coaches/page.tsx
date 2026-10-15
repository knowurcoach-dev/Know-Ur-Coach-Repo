"use client";

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminDashboardData,
  approveCoachKyc,
  rejectCoachKyc,
  referBackCoachKyc,
  deleteCoach,
  updateCoachDetails,
  verifyCoachDocument,
} from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminVerifySkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  X,
  ClipboardText,
  SealCheck,
  Spinner,
  PencilSimple,
  FloppyDisk,
  Trash,
  XCircle,
  MagnifyingGlass,
  Phone,
  CurrencyInr,
  ArrowsClockwise,
  Warning,
  Info,
  FileArrowUp,
  FileText,
  FilePdf,
  Image as ImageIcon,
  CalendarPlus,
  ArrowRight,
  Eye,
  Check,
} from '@phosphor-icons/react';
import { DocViewerModal } from '@/components/modals/DocViewerModal';
import { parseCoachDocuments, getCoachDocCount, cleanStatusNotes } from '@/lib/coach-docs';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';

interface BatchItem {
  id?: string;
  name: string;
  category?: string;
  coachName?: string;
  pureSchedule?: string;
  schedule: string;
  ageGroup: string;
  totalSeats: number;
  seatsFilled?: number;
  monthlyFee: number;
}

interface FacilityItem {
  id?: string;
  description: string;
}

interface CoachItem {
  id: string;
  name: string;
  category?: string;
  locality: string;
  address?: string;
  phone: string;
  headCoachName: string;
  rating?: number;
  monthlyTuitionFee?: number;
  trialFee?: number;
  kycStatus: string; // PENDING | DOCS_REVIEW | REFERRED_BACK | REJECTED | APPROVED
  safetyGrade: string;
  rejectionReason?: string | null;
  referredBackRemarks?: string | null;
  statusNotes?: string | null;
  planTier?: string;
  coachType?: string;
  cctvMonitored?: boolean;
  nisCertified?: boolean;
  policeVerifiedStaff?: boolean;
  firstAidAvailable?: boolean;
  batches?: BatchItem[];
  facilities?: FacilityItem[];
}

const FALLBACK_CENTRES: CoachItem[] = [
  {
    id: 'centre-1',
    name: 'Agra Champions Sports Club',
    locality: 'Kamla Nagar',
    headCoachName: 'Coach Sunil Rathore',
    phone: '+91 98970 12345',
    address: 'Plot 42, Near Water Tank, Kamla Nagar, Agra',
    kycStatus: 'DOCS_REVIEW',
    safetyGrade: 'PENDING_AUDIT',
    statusNotes: 'In-app digital KYC submitted. Aadhaar & NIS Diploma attached. 3 venue photos provided.',
    monthlyTuitionFee: 1500,
    trialFee: 0,
    planTier: 'PREMIUM',
    cctvMonitored: true,
    nisCertified: true,
    policeVerifiedStaff: false,
    firstAidAvailable: true,
    batches: [
      { name: 'Junior Badminton Squad', schedule: 'Mon, Wed, Fri • 4:00 PM', ageGroup: '6 - 12 Yrs', totalSeats: 15, monthlyFee: 1500 },
      { name: 'Advanced Cadet Camp', schedule: 'Tue, Thu, Sat • 5:30 PM', ageGroup: '11 - 16 Yrs', totalSeats: 12, monthlyFee: 2000 },
    ],
  },
  {
    id: 'centre-2',
    name: 'Taj Swimming & Aquatics Center',
    locality: 'Fatehabad Road',
    headCoachName: 'Coach Vikram Sharma',
    phone: '+91 94122 88412',
    address: 'Opposite Gateway Hotel, Fatehabad Road, Agra',
    kycStatus: 'DOCS_REVIEW',
    safetyGrade: 'GRADE_A',
    statusNotes: 'Pool filtration certificates verified. Life guard CPR certification cleared.',
    monthlyTuitionFee: 2200,
    trialFee: 0,
    planTier: 'PREMIUM',
    cctvMonitored: true,
    nisCertified: true,
    policeVerifiedStaff: true,
    firstAidAvailable: true,
    batches: [
      { name: 'Beginner Freestyle Swimming', schedule: 'Daily • 6:30 AM', ageGroup: '5 - 14 Yrs', totalSeats: 20, monthlyFee: 2200 },
    ],
  },
  {
    id: 'centre-3',
    name: 'Eklavya Cricket Nets & Academy',
    locality: 'Sadar Bazar',
    headCoachName: 'Coach Manoj Kulshrestha',
    phone: '+91 97600 33411',
    address: 'Near Cantt Railway Station, Sadar Bazar, Agra',
    kycStatus: 'PENDING',
    safetyGrade: 'PENDING_AUDIT',
    statusNotes: 'Newly registered coach. Pending in-app document upload & batch configuration.',
    monthlyTuitionFee: 1800,
    trialFee: 0,
    planTier: 'STANDARD',
    cctvMonitored: false,
    nisCertified: false,
    policeVerifiedStaff: false,
    firstAidAvailable: false,
  },
];

const SUGGESTED_REFERRED_REMARKS = [
  'NIS Coach Certificate scan is blurry. Please re-upload a clear high-resolution copy.',
  'Coach Government ID front & back photo is required. Please upload valid Aadhaar or Voter ID.',
  'Venue photos must clearly show the playing turf boundary fencing and first-aid medical kit.',
  'Please add age group and timing details for all listed batches in your dashboard.',
  'CCTV monitored box is checked, but venue photo does not show DVR installation.',
];

export default function AdminVerifyCoachesPage() {
  const { showToast } = usePersona();
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [approvingCoachId, setApprovingCoachId] = useState<string | null>(null);

  // Filters & Search (4 clean statuses: Pending Review, Approved, Needs Changes, Rejected, All)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REFERRED_BACK' | 'REJECTED'>('PENDING_REVIEW');

  // Review Modal State (Step 1 = Profile details, Step 2 = Verification docs)
  const [activeReviewCoach, setActiveReviewCoach] = useState<CoachItem | null>(null);
  const [reviewStep, setReviewStep] = useState<1 | 2>(1);

  const handleOpenReview = (coach: CoachItem, step: 1 | 2 = 1) => {
    setActiveReviewCoach(coach);
    setReviewStep(step);
  };

  // Edit Mode per Coach
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    headCoachName: string;
    phone: string;
    locality: string;
    address: string;
    monthlyTuitionFee: number;
    safetyGrade: any;
    statusNotes: string;
  }>({
    name: '',
    headCoachName: '',
    phone: '',
    locality: '',
    address: '',
    monthlyTuitionFee: 0,
    safetyGrade: 'PENDING_AUDIT',
    statusNotes: '',
  });

  // Action Modals
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; coach: CoachItem | null; reason: string }>({
    isOpen: false,
    coach: null,
    reason: '',
  });

  const [referBackModal, setReferBackModal] = useState<{ isOpen: boolean; coach: CoachItem | null; remarks: string }>({
    isOpen: false,
    coach: null,
    remarks: '',
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; coach: CoachItem | null }>({
    isOpen: false,
    coach: null,
  });

  // Document Viewer Modal State
  const [docViewerModal, setDocViewerModal] = useState<{
    isOpen: boolean;
    coach: CoachItem | null;
    initialDocIndex: number;
  }>({
    isOpen: false,
    coach: null,
    initialDocIndex: 0,
  });

  const handleOpenDocViewer = (coach: CoachItem, initialIndex = 0) => {
    setDocViewerModal({
      isOpen: true,
      coach,
      initialDocIndex: initialIndex,
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      if (res.coaches && res.coaches.length > 0) {
        setCoaches(res.coaches as any);
      } else {
        setCoaches(FALLBACK_CENTRES);
      }
    } catch (err) {
      console.error("Failed to load coaches for KYC audit:", err);
      setCoaches(FALLBACK_CENTRES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enter Edit Mode
  const handleStartEdit = (coach: CoachItem) => {
    setEditingCoachId(coach.id);
    setEditForm({
      name: coach.name || '',
      headCoachName: coach.headCoachName || '',
      phone: coach.phone || '',
      locality: coach.locality || '',
      address: coach.address || '',
      monthlyTuitionFee: Number(coach.monthlyTuitionFee) || 0,
      safetyGrade: coach.safetyGrade || 'PENDING_AUDIT',
      statusNotes: coach.statusNotes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingCoachId(null);
  };

  const handleSaveEdit = (coachId: string) => {
    startTransition(async () => {
      try {
        const res = await updateCoachDetails(coachId, {
          name: editForm.name,
          headCoachName: editForm.headCoachName,
          phone: editForm.phone,
          locality: editForm.locality,
          address: editForm.address,
          monthlyTuitionFee: editForm.monthlyTuitionFee,
          safetyGrade: editForm.safetyGrade,
          statusNotes: editForm.statusNotes,
        });
        if (res.success) {
          showToast(`✅ Changes saved for ${editForm.name}`);
          setCoaches((prev) =>
            prev.map((c) => (c.id === coachId ? { ...c, ...editForm } : c))
          );
          setEditingCoachId(null);
        } else {
          showToast("Failed to save changes");
        }
      } catch (err) {
        showToast("Error updating coach details");
      }
    });
  };

  // Actions
  const handleApprove = (coach: CoachItem) => {
    if (approvingCoachId) return;
    setApprovingCoachId(coach.id);
    startTransition(async () => {
      try {
        const res = await approveCoachKyc(coach.id, coach.name, 'Admin Verification Desk');
        if (res.success) {
          showToast(`✅ ${coach.name} verified and approved! Listing is now live.`);
          setCoaches((prev) =>
            prev.map((c) =>
              c.id === coach.id
                ? {
                    ...c,
                    kycStatus: 'APPROVED',
                    safetyGrade: 'GRADE_A_PLUS',
                    statusNotes: `Application verified and approved on ${new Date().toLocaleDateString('en-IN')}`,
                  }
                : c
            )
          );
          setActiveReviewCoach(null);
        } else {
          showToast(res.message || "Failed to approve coach");
        }
      } catch (err) {
        showToast("Failed to approve coach");
      } finally {
        setApprovingCoachId(null);
      }
    });
  };

  const handleConfirmReject = () => {
    if (!rejectModal.coach || !rejectModal.reason.trim()) {
      showToast("Please provide a rejection reason");
      return;
    }
    const target = rejectModal.coach;
    startTransition(async () => {
      try {
        const res = await rejectCoachKyc(target.id, target.name, rejectModal.reason, 'Admin Verification Desk');
        if (res.success) {
          showToast(`Marked ${target.name} as Rejected`);
          setCoaches((prev) =>
            prev.map((c) =>
              c.id === target.id
                ? {
                    ...c,
                    kycStatus: 'REJECTED',
                    rejectionReason: rejectModal.reason,
                  }
                : c
            )
          );
          setRejectModal({ isOpen: false, coach: null, reason: '' });
          setActiveReviewCoach(null);
        }
      } catch (err) {
        showToast("Failed to reject coach");
      }
    });
  };

  const handleConfirmReferBack = () => {
    if (!referBackModal.coach || !referBackModal.remarks.trim()) {
      showToast("Please provide feedback remarks");
      return;
    }
    const target = referBackModal.coach;
    startTransition(async () => {
      try {
        const res = await referBackCoachKyc(target.id, target.name, referBackModal.remarks, 'Admin Verification Desk');
        if (res.success) {
          showToast(`Referred back ${target.name} with remarks`);
          setCoaches((prev) =>
            prev.map((c) =>
              c.id === target.id
                ? {
                    ...c,
                    kycStatus: 'REFERRED_BACK',
                    referredBackRemarks: referBackModal.remarks,
                  }
                : c
            )
          );
          setReferBackModal({ isOpen: false, coach: null, remarks: '' });
          setActiveReviewCoach(null);
        }
      } catch (err) {
        showToast("Failed to refer back coach");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.coach) return;
    const target = deleteModal.coach;
    startTransition(async () => {
      try {
        const res = await deleteCoach(target.id);
        if (res.success) {
          showToast(`Deleted ${target.name}`);
          setCoaches((prev) => prev.filter((c) => c.id !== target.id));
          setDeleteModal({ isOpen: false, coach: null });
        }
      } catch (err) {
        showToast("Failed to delete coach");
      }
    });
  };

  // Filtered List
  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.headCoachName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING_REVIEW') {
      return coach.kycStatus === 'DOCS_REVIEW' || coach.kycStatus === 'PENDING';
    }
    return coach.kycStatus === statusFilter;
  });

  const pendingReviewCount = coaches.filter((c) => c.kycStatus === 'DOCS_REVIEW' || c.kycStatus === 'PENDING').length;
  const approvedCount = coaches.filter((c) => c.kycStatus === 'APPROVED').length;
  const referredCount = coaches.filter((c) => c.kycStatus === 'REFERRED_BACK').length;
  const rejectedCount = coaches.filter((c) => c.kycStatus === 'REJECTED').length;

  if (isLoading) {
    return <AdminVerifySkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ══════════════════════════════════════════
            HEADER BANNER (DIGITAL VERIFICATION & APPROVAL DESK)
           ══════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <ShieldCheck size={16} weight="fill" className="text-emerald-400" />
              Digital Verification &amp; Approval Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Coach &amp; Academy Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
              Streamlined 2-step verification for coaches and sports academies across India. Review submitted profile details, verify uploaded credentials (Govt ID, NIS license, venue photos), and approve live listings or refer back with clear actionable notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            QUICK KPI CARDS (4 STATUS-BASED SYSTEM)
           ══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">{pendingReviewCount}</div>
            <span className="text-[11px] text-blue-600 font-semibold">Requires Admin Review</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Approved
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Live on Directory</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Needs Changes
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">{referredCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting Coach Revisions</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Rejected
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Declined Applications</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SEARCH & STATUS FILTER BAR
           ══════════════════════════════════════════ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search academy, head coach, locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'PENDING_REVIEW', label: `Pending Review (${pendingReviewCount})`, activeColor: 'bg-blue-600 text-white' },
              { id: 'APPROVED', label: `Approved (${approvedCount})`, activeColor: 'bg-emerald-600 text-white' },
              { id: 'REFERRED_BACK', label: `Needs Changes (${referredCount})`, activeColor: 'bg-amber-600 text-white' },
              { id: 'REJECTED', label: `Rejected (${rejectedCount})`, activeColor: 'bg-red-700 text-white' },
              { id: 'ALL', label: `All (${coaches.length})`, activeColor: 'bg-slate-900 text-white' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? `${tab.activeColor} shadow-sm font-extrabold`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ACADEMY QUEUE LIST
           ══════════════════════════════════════════ */}
        <div className="space-y-4">
          {filteredCoaches.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <CheckCircle size={40} weight="fill" className="text-emerald-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No academies in this queue
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All submissions under this filter have been processed or none match your search criteria.
              </p>
            </div>
          ) : (
            filteredCoaches.map((coach) => {
              const isEditing = editingCoachId === coach.id;
              const isApproved = coach.kycStatus === 'APPROVED';
              const isDocsReview = coach.kycStatus === 'DOCS_REVIEW';
              const isPendingOnboarding = coach.kycStatus === 'PENDING';
              const isReferred = coach.kycStatus === 'REFERRED_BACK';
              const isRejected = coach.kycStatus === 'REJECTED';

              return (
                <div
                  key={coach.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs space-y-4 ${
                    isApproved
                      ? 'border-emerald-200 bg-white'
                      : isDocsReview
                      ? 'border-blue-300 ring-2 ring-blue-500/10 bg-white'
                      : isPendingOnboarding
                      ? 'border-amber-200 bg-amber-50/20'
                      : isReferred
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  {/* Top Status & ID Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isDocsReview || isPendingOnboarding
                            ? 'bg-blue-100 text-blue-900 border border-blue-300 animate-pulse'
                            : isReferred
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <SealCheck size={13} weight="fill" className="text-emerald-600" />
                            APPROVED &amp; VERIFIED
                          </>
                        ) : isDocsReview || isPendingOnboarding ? (
                          <>
                            <Clock size={13} weight="bold" className="text-blue-600" />
                            PENDING REVIEW
                          </>
                        ) : isReferred ? (
                          <>
                            <Warning size={13} weight="bold" className="text-amber-600" />
                            NEEDS CHANGES / REFERRED BACK
                          </>
                        ) : (
                          <>
                            <XCircle size={13} weight="bold" className="text-red-600" />
                            REJECTED
                          </>
                        )}
                      </span>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Tier: {coach.planTier || 'FREE'}
                      </span>

                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        ID: {coach.id.slice(0, 10)}
                      </span>
                    </div>

                    {/* Quick Controls */}
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(coach)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <PencilSimple size={14} weight="bold" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(coach.id)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <FloppyDisk size={14} weight="bold" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isPending}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, coach })}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Academy"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  {!isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                          {coach.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <User size={13} weight="bold" />
                            Head Coach: {coach.headCoachName}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone size={13} weight="bold" />
                            {coach.phone}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <CurrencyInr size={13} weight="bold" />
                            Tuition: ₹{coach.monthlyTuitionFee || 1500}/mo
                          </span>
                        </p>
                      </div>

                      {/* Locality & Address */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-800 space-y-1.5 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin size={15} weight="bold" className="text-red-500 shrink-0" />
                          <span>
                            <strong>{coach.locality || 'Locality'}:</strong> {coach.address || 'Facility Address'}
                          </span>
                        </div>

                        {/* Status Notes */}
                        {coach.statusNotes && (
                          <div className="flex items-start gap-1.5 text-blue-900 font-medium pt-0.5">
                            <Info size={14} weight="fill" className="text-blue-600 shrink-0 mt-0.5" />
                            <span>{cleanStatusNotes(coach.statusNotes)}</span>
                          </div>
                        )}

                        {/* Admin Remarks for Referred Back */}
                        {coach.referredBackRemarks && (
                          <div className="text-rose-800 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                            Referred Back Remarks: {coach.referredBackRemarks}
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {coach.rejectionReason && (
                          <div className="text-red-800 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
                            Rejection Reason: {coach.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Batches Preview if present */}
                      {coach.batches && coach.batches.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Configured Batches ({coach.batches.length})</span>
                            <span className="text-[10px] text-slate-400 font-normal">Prices &amp; Categories</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {coach.batches.map((b, i) => {
                              const batchCat = b.category || coach.category;
                              return (
                                <div
                                  key={i}
                                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-slate-900 text-xs truncate">{b.name}</span>
                                      {batchCat && (
                                        <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                                          <span>{getCategoryEmoji(batchCat)}</span>
                                          <span>{getCategoryDisplayName(batchCat)}</span>
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {b.pureSchedule || b.schedule} • {b.ageGroup}
                                    </p>
                                  </div>
                                  <span className="font-black text-emerald-700 text-xs font-mono shrink-0">
                                    ₹{b.monthlyFee}/mo
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit Mode Form */
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-3 animate-fade-in">
                      <div className="text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-1">
                        Editing Academy Information
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Academy Name:</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Head Coach / Founder:</label>
                          <input
                            type="text"
                            value={editForm.headCoachName}
                            onChange={(e) => setEditForm({ ...editForm, headCoachName: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Contact Phone:</label>
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Locality:</label>
                          <input
                            type="text"
                            value={editForm.locality}
                            onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Full Address:</label>
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Monthly Tuition Fee (₹):</label>
                          <input
                            type="number"
                            value={editForm.monthlyTuitionFee}
                            onChange={(e) => setEditForm({ ...editForm, monthlyTuitionFee: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Compliance Notes:</label>
                          <input
                            type="text"
                            value={editForm.statusNotes}
                            onChange={(e) => setEditForm({ ...editForm, statusNotes: e.target.value })}
                            placeholder="Add compliance notes..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {!isApproved ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(coach, 1)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ClipboardText size={15} weight="bold" />
                          <span>Review Application (2 Steps)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDocViewer(coach, 0)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Inspect uploaded coach documents"
                        >
                          <FileText size={15} weight="bold" />
                          <span>Check Uploaded Docs ({getCoachDocCount(coach)})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(coach)}
                          disabled={approvingCoachId === coach.id}
                          className={`bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                            approvingCoachId === coach.id ? 'opacity-75 cursor-wait' : ''
                          }`}
                        >
                          {approvingCoachId === coach.id ? (
                            <>
                              <ArrowsClockwise size={15} weight="bold" className="animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={15} weight="bold" />
                              <span>Quick Approve</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setReferBackModal({ isOpen: true, coach, remarks: '' })}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Warning size={15} weight="bold" />
                          <span>Needs Changes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectModal({ isOpen: true, coach, reason: '' })}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle size={15} weight="bold" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <SealCheck size={15} weight="fill" className="text-emerald-600" />
                          Live &amp; Verified on Directory
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenDocViewer(coach, 0)}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                          title="Inspect uploaded coach documents"
                        >
                          <FileText size={14} weight="bold" />
                          <span>Check Docs ({getCoachDocCount(coach)})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(coach, 1)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Re-open Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ══════════════════════════════════════════
            MODAL 1: 2-STEP APPLICATION REVIEW MODAL
            (Step 1: Profile Details • Step 2: Verification Documents)
           ══════════════════════════════════════════ */}
        {activeReviewCoach && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveReviewCoach(null);
            }}
          >
            <div
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-scale-in border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-xs">
                    <ShieldCheck size={22} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                      Coach Application Review
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {activeReviewCoach.name} ({activeReviewCoach.locality}) • Head Coach: {activeReviewCoach.headCoachName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReviewCoach(null)}
                  className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center border border-gray-200 cursor-pointer"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Step Navigation Tabs Bar */}
              <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStep(1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      reviewStep === 1
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      reviewStep === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      1
                    </span>
                    <span>Step 1: Profile Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStep(2)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      reviewStep === 2
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      reviewStep === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      2
                    </span>
                    <span>Step 2: Verification Documents</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      reviewStep === 2 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {getCoachDocCount(activeReviewCoach)}
                    </span>
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400">
                  Step {reviewStep} of 2
                </span>
              </div>

              {/* Scrollable Audit Body */}
              <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto text-xs">
                {/* ══════════════════════════════════════════
                    STEP 1: REVIEW PROFILE DETAILS
                   ══════════════════════════════════════════ */}
                {reviewStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="font-black text-slate-900 uppercase tracking-wide block mb-2">
                        1. Academy &amp; Coach Profile Information
                      </span>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Academy Name</span>
                          <span className="text-slate-900 font-extrabold text-sm">{activeReviewCoach.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Founder / Head Coach</span>
                          <span className="text-slate-900 font-extrabold text-sm">{activeReviewCoach.headCoachName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">WhatsApp Phone</span>
                          <span className="text-slate-900 font-bold">{activeReviewCoach.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Locality / Area</span>
                          <span className="text-slate-900 font-bold">{activeReviewCoach.locality}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Venue &amp; Facility Address</span>
                          <span className="text-slate-900 font-semibold">{activeReviewCoach.address || 'Facility Address Not Specified'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Monthly Tuition Fee</span>
                          <span className="text-slate-900 font-bold">₹{activeReviewCoach.monthlyTuitionFee || 1500}/month</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Partner Plan Tier</span>
                          <span className="text-slate-900 font-bold">{activeReviewCoach.planTier || 'FREE'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Facility & Safety Checklist */}
                    <div>
                      <span className="font-black text-slate-900 uppercase tracking-wide block mb-2">
                        2. Facility &amp; Safety Compliance Status
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '24/7 CCTV Monitored', active: activeReviewCoach.cctvMonitored ?? true },
                          { label: 'NIS Certified Head Coach', active: activeReviewCoach.nisCertified ?? true },
                          { label: 'First Aid & Medical Kit', active: activeReviewCoach.firstAidAvailable ?? true },
                          { label: 'Police Verified Staff', active: activeReviewCoach.policeVerifiedStaff ?? false },
                          { label: 'Girl Changing Room', active: true },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={item.active ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Batches & Timings */}
                    <div>
                      <span className="font-black text-slate-900 uppercase tracking-wide block mb-2">
                        3. Listed Coaching Batches &amp; Disciplines
                      </span>
                      {activeReviewCoach.batches && activeReviewCoach.batches.length > 0 ? (
                        <div className="space-y-2">
                          {activeReviewCoach.batches.map((batch, idx) => {
                            const batchCat = batch.category || activeReviewCoach.category;
                            return (
                              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center gap-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{batch.name}</span>
                                    {batchCat && (
                                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                                        <span>{getCategoryEmoji(batchCat)}</span>
                                        <span>{getCategoryDisplayName(batchCat)}</span>
                                      </span>
                                    )}
                                    <span className="text-slate-400 text-xs">({batch.ageGroup})</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                    <span>{batch.pureSchedule || batch.schedule}</span>
                                    <span>•</span>
                                    <span>Cap: {batch.totalSeats} seats</span>
                                    {batch.coachName && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-700 font-semibold">Coach: {batch.coachName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm shrink-0">₹{batch.monthlyFee}/mo</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                          Standard batch configured (Mon, Wed, Fri • 4:00 PM - 5:15 PM).
                        </div>
                      )}
                    </div>

                    {/* Step 1 Next Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setReviewStep(2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Proceed to Step 2: Review Documents</span>
                        <ArrowRight size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════
                    STEP 2: REVIEW VERIFICATION DOCUMENTS
                   ══════════════════════════════════════════ */}
                {reviewStep === 2 && (() => {
                  const coachDocs = parseCoachDocuments(activeReviewCoach);
                  const govDoc = coachDocs.find((d) => d.type === 'GOVT_ID');
                  const nisDoc = coachDocs.find((d) => d.type === 'NIS_CERT');
                  const venueDoc = coachDocs.find((d) => d.type === 'VENUE_PHOTOS');

                  return (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-slate-900 uppercase tracking-wide block">
                            Uploaded Verification Documents ({coachDocs.length} Total)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Inspect each uploaded credential to verify coach identity and ground safety.
                          </p>
                        </div>
                        {coachDocs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenDocViewer(activeReviewCoach, 0)}
                            className="text-[11px] font-extrabold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye size={13} weight="bold" />
                            <span>Full Doc Viewer Desk</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Document 1: Coach Govt ID */}
                        <div className={`p-4 rounded-2xl border space-y-2.5 transition-colors shadow-2xs ${
                          govDoc ? 'border-slate-200 bg-white hover:border-blue-300' : 'border-dashed border-slate-200 bg-slate-50/60'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              <FileArrowUp size={16} className={govDoc ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                              <span>Govt Photo ID (Aadhaar / Voter ID)</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              govDoc?.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : govDoc
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {govDoc?.status === 'VERIFIED' ? 'Verified ✓' : govDoc ? 'Attached' : 'Not Uploaded'}
                            </span>
                          </div>

                          {govDoc ? (
                            <>
                              <div className="text-[11px] text-slate-600 font-medium truncate">
                                File: {govDoc.fileName}
                              </div>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {govDoc.docNumber ? `ID: ${govDoc.docNumber}` : 'Govt Identity Card'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(activeReviewCoach, coachDocs.indexOf(govDoc))}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={13} weight="bold" />
                                  <span>Inspect Document</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic py-1">
                              Coach has not attached Government ID yet.
                            </div>
                          )}
                        </div>

                        {/* Document 2: NIS Certification */}
                        <div className={`p-4 rounded-2xl border space-y-2.5 transition-colors shadow-2xs ${
                          nisDoc ? 'border-slate-200 bg-white hover:border-emerald-300' : 'border-dashed border-slate-200 bg-slate-50/60'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              <SealCheck size={16} className={nisDoc ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
                              <span>NIS Coach Certificate / License</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              nisDoc?.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : nisDoc
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {nisDoc?.status === 'VERIFIED' ? 'Verified ✓' : nisDoc ? 'Attached' : 'Not Uploaded (Optional)'}
                            </span>
                          </div>

                          {nisDoc ? (
                            <>
                              <div className="text-[11px] text-slate-600 font-medium truncate">
                                File: {nisDoc.fileName}
                              </div>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Coaching License
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(activeReviewCoach, coachDocs.indexOf(nisDoc))}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={13} weight="bold" />
                                  <span>Inspect Document</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic py-1">
                              No NIS diploma uploaded (optional for local instructors).
                            </div>
                          )}
                        </div>

                        {/* Document 3: Venue & Facility Photos */}
                        <div className={`col-span-1 sm:col-span-2 p-4 rounded-2xl border space-y-2.5 transition-colors shadow-2xs ${
                          venueDoc && venueDoc.photos && venueDoc.photos.length > 0 ? 'border-slate-200 bg-white hover:border-purple-300' : 'border-dashed border-slate-200 bg-slate-50/60'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              <ImageIcon size={16} className={venueDoc ? 'text-purple-600 shrink-0' : 'text-slate-400 shrink-0'} />
                              <span>Venue &amp; Safety Facility Photos (Courts, First Aid, CCTV)</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                              venueDoc && venueDoc.photos && venueDoc.photos.length > 0
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {venueDoc && venueDoc.photos && venueDoc.photos.length > 0
                                ? `${venueDoc.photos.length} Photos Attached`
                                : 'Optional (Not Uploaded)'}
                            </span>
                          </div>

                          {venueDoc && venueDoc.photos && venueDoc.photos.length > 0 ? (
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                {venueDoc.photos.slice(0, 4).map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => handleOpenDocViewer(activeReviewCoach, coachDocs.indexOf(venueDoc))}
                                    className="w-14 h-10 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenDocViewer(activeReviewCoach, coachDocs.indexOf(venueDoc))}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Eye size={13} weight="bold" />
                                <span>Inspect Facility Photos</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic py-1">
                              Coach has not uploaded playing surface or first-aid kit photos yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2 Back Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setReviewStep(1)}
                          className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>← Back to Step 1: Profile Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Modal Footer Decision Actions (Visible on both steps) */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModal({ isOpen: true, coach: activeReviewCoach, reason: '' });
                        setActiveReviewCoach(null);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
                    >
                      Reject Application
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReferBackModal({ isOpen: true, coach: activeReviewCoach, remarks: '' });
                        setActiveReviewCoach(null);
                      }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-amber-300 cursor-pointer"
                    >
                      Needs Changes / Refer Back
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApprove(activeReviewCoach)}
                    disabled={approvingCoachId === activeReviewCoach.id}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      approvingCoachId === activeReviewCoach.id ? 'opacity-75 cursor-wait' : ''
                    }`}
                  >
                    {approvingCoachId === activeReviewCoach.id ? (
                      <>
                        <ArrowsClockwise size={16} weight="bold" className="animate-spin" />
                        <span>Approving &amp; Publishing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} weight="fill" />
                        <span>Approve Application &amp; Publish Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL 2: REFER BACK MODAL (WITH PRESET REMARKS)
           ══════════════════════════════════════════ */}
        {referBackModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setReferBackModal({ isOpen: false, coach: null, remarks: '' });
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Warning size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Refer Back Application (Needs Changes)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {referBackModal.coach?.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Specify what needs to be fixed. The coach will clearly see this note on their dashboard and can update their profile or re-upload documents.
              </p>

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Feedback Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_REFERRED_REMARKS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReferBackModal((prev) => ({ ...prev, remarks: sug }))}
                      className="text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
                    >
                      {sug.slice(0, 48)}…
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Feedback Note for Coach:
                </label>
                <textarea
                  rows={3}
                  value={referBackModal.remarks}
                  onChange={(e) => setReferBackModal({ ...referBackModal, remarks: e.target.value })}
                  placeholder="e.g. Please re-upload clearer scanned copies of NIS coach credentials and ground boundaries..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReferBackModal({ isOpen: false, coach: null, remarks: '' })}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReferBack}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Send Feedback to Coach
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL 3: REJECT MODAL
           ══════════════════════════════════════════ */}
        {rejectModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setRejectModal({ isOpen: false, coach: null, reason: '' });
              }
            }}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Reject Academy Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {rejectModal.coach?.name}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Rejection Reason (Recorded in audit logs):
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="e.g. Identity documents falsified; invalid registration credentials..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, coach: null, reason: '' })}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODAL 4: DELETE CONFIRMATION MODAL
           ══════════════════════════════════════════ */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Academy Permanently"
          itemName={deleteModal.coach?.name}
          message="Are you sure you want to permanently delete this academy? All associated coaching batches, facilities, lead inquiries, and inspection logs will be erased. This action cannot be undone."
          confirmText="Yes, Delete Academy"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, coach: null })}
        />

        {/* ══════════════════════════════════════════
            MODAL 5: DIGITAL KYC DOCUMENT VIEWER MODAL
           ══════════════════════════════════════════ */}
        {docViewerModal.isOpen && docViewerModal.coach && (
          <DocViewerModal
            isOpen={docViewerModal.isOpen}
            onClose={() => setDocViewerModal({ isOpen: false, coach: null, initialDocIndex: 0 })}
            coach={docViewerModal.coach}
            documents={parseCoachDocuments(docViewerModal.coach)}
            initialDocIndex={docViewerModal.initialDocIndex}
            onVerifyDoc={async (docId) => {
              if (!docViewerModal.coach) return;
              const coachId = docViewerModal.coach.id;
              const docs = parseCoachDocuments(docViewerModal.coach);
              const targetDoc = docs.find((d) => d.id === docId);
              const docType = targetDoc?.type || (docId.includes('gov') ? 'GOVT_ID' : docId.includes('nis') ? 'NIS_CERT' : 'VENUE_PHOTOS');

              showToast('✅ Marked document as verified in compliance audit');
              const res = await verifyCoachDocument(coachId, docType, 'VERIFIED');
              if (res.success && res.centre) {
                setCoaches((prev) =>
                  prev.map((c) => (c.id === coachId ? { ...c, statusNotes: res.centre.statusNotes } : c))
                );
                setDocViewerModal((prev) => ({
                  ...prev,
                  coach: { ...prev.coach!, statusNotes: res.centre.statusNotes },
                }));
                if (activeReviewCoach && activeReviewCoach.id === coachId) {
                  setActiveReviewCoach({ ...activeReviewCoach, statusNotes: res.centre.statusNotes });
                }
              }
            }}
            onFlagDoc={async (docId, reason) => {
              if (!docViewerModal.coach) return;
              const coachId = docViewerModal.coach.id;
              const docs = parseCoachDocuments(docViewerModal.coach);
              const targetDoc = docs.find((d) => d.id === docId);
              const docType = targetDoc?.type || (docId.includes('gov') ? 'GOVT_ID' : docId.includes('nis') ? 'NIS_CERT' : 'VENUE_PHOTOS');

              showToast(`⚠️ Document flagged: ${reason}`);
              const res = await verifyCoachDocument(coachId, docType, 'REJECTED', reason);
              if (res.success && res.centre) {
                setCoaches((prev) =>
                  prev.map((c) => (c.id === coachId ? { ...c, statusNotes: res.centre.statusNotes } : c))
                );
                setDocViewerModal((prev) => ({
                  ...prev,
                  coach: { ...prev.coach!, statusNotes: res.centre.statusNotes },
                }));
                if (activeReviewCoach && activeReviewCoach.id === coachId) {
                  setActiveReviewCoach({ ...activeReviewCoach, statusNotes: res.centre.statusNotes });
                }
              }
              setReferBackModal({
                isOpen: true,
                coach: docViewerModal.coach,
                remarks: `Document issue flagged: ${reason}. Please update your verification documents in coach dashboard.`,
              });
            }}
            onQuickApprove={(coach) => {
              handleApprove(coach);
            }}
            onReferBack={(coach, remarks) => {
              setReferBackModal({
                isOpen: true,
                coach,
                remarks: remarks || '',
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
