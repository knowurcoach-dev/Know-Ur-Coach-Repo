"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getAdminDashboardData,
  updateCoachDetails,
  suspendCoach,
  unsuspendCoach,
  deleteCoach,
} from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminVerifySkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Buildings,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  PencilSimple,
  Trash,
  Star,
  SealCheck,
  ShieldCheck,
  Phone,
  CurrencyInr,
  User,
  ArrowsClockwise,
  MapPin,
  Warning,
  X,
  FloppyDisk,
  Prohibit,
  FileText,
  Eye,
  Crown,
  Sparkle,
  EnvelopeSimple,
  CalendarBlank,
  Check,
  ArrowSquareOut,
  UsersThree,
  Funnel,
  Clock,
  Info,
  Tag,
  DotsThreeVertical,
  ArrowsLeftRight,
  CreditCard,
  EyeSlash,
} from '@phosphor-icons/react';
import { DocViewerModal } from '@/components/modals/DocViewerModal';
import { parseCoachDocuments, getCoachDocCount, cleanStatusNotes } from '@/lib/coach-docs';
import { getCentreSubscriptionStatus } from '@/lib/subscription';

export function getCoachVisibilityStatus(coach: any, allowFreeListing: boolean = false) {
  if (!coach) {
    return {
      code: 'UNKNOWN',
      label: 'UNKNOWN',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      visibilityText: 'Unknown Status',
      visibilitySub: 'No data',
      isLive: false,
      isPaymentPending: false,
    };
  }

  const sub = getCentreSubscriptionStatus(coach);

  if (coach.isSuspended || sub.publicListingStatus === 'SUSPENDED') {
    return {
      code: 'SUSPENDED',
      label: 'SUSPENDED',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      dotClass: 'bg-rose-500',
      visibilityText: 'Profile Suspended',
      visibilitySub: 'Hidden from public directory',
      isLive: false,
      isPaymentPending: false,
    };
  }

  if (sub.publicListingStatus === 'LIVE') {
    const isFree = sub.tier === 'FREE';
    return {
      code: isFree ? 'FREE_LIVE' : 'LIVE',
      label: isFree ? 'APPROVED • FREE LIVE' : 'APPROVED & LIVE',
      badgeClass: isFree
        ? 'bg-teal-50 text-teal-800 border-teal-200 font-extrabold'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
      dotClass: isFree ? 'bg-teal-500' : 'bg-emerald-500 animate-pulse',
      visibilityText: isFree ? 'Free Listing Live' : 'Public Profile Live',
      visibilitySub: coach.planTier === 'PREMIUM' ? 'Premier Sponsored Live' : 'Standard Verified Live',
      isLive: true,
      isPaymentPending: false,
    };
  }

  if (sub.publicListingStatus === 'EXPIRED') {
    return {
      code: 'EXPIRED',
      label: 'PLAN EXPIRED',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
      dotClass: 'bg-rose-500',
      visibilityText: 'Subscription Expired',
      visibilitySub: `Ended on ${sub.formattedExpiry}`,
      isLive: false,
      isPaymentPending: true,
    };
  }

  if (sub.publicListingStatus === 'PLAN_REQUIRED') {
    return {
      code: 'PAYMENT_PENDING',
      label: 'APPROVED • PAYMENT PENDING',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold ring-1 ring-amber-300/50',
      dotClass: 'bg-amber-500',
      visibilityText: 'Hidden from Public Search',
      visibilitySub: 'Awaiting plan payment by coach',
      isLive: false,
      isPaymentPending: true,
    };
  }

  if (coach.kycStatus === 'DOCS_REVIEW' || sub.publicListingStatus === 'UNDER_REVIEW') {
    return {
      code: 'DOCS_REVIEW',
      label: 'DOCS REVIEW',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
      dotClass: 'bg-blue-500',
      visibilityText: 'In Verification Desk',
      visibilitySub: 'Admin document audit in progress',
      isLive: false,
      isPaymentPending: false,
    };
  }

  if (coach.kycStatus === 'REFERRED_BACK' || sub.publicListingStatus === 'REVISIONS_REQUESTED') {
    return {
      code: 'REFERRED_BACK',
      label: 'NEEDS CHANGES',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      dotClass: 'bg-amber-500',
      visibilityText: 'Referred Back',
      visibilitySub: 'Awaiting fixes from coach',
      isLive: false,
      isPaymentPending: false,
    };
  }

  if (coach.kycStatus === 'REJECTED' || sub.publicListingStatus === 'KYC_REJECTED') {
    return {
      code: 'REJECTED',
      label: 'REJECTED',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold',
      dotClass: 'bg-red-500',
      visibilityText: 'Application Rejected',
      visibilitySub: 'Hidden from platform discovery',
      isLive: false,
      isPaymentPending: false,
    };
  }

  return {
    code: 'PENDING',
    label: 'PENDING ONBOARDING',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    dotClass: 'bg-slate-400',
    visibilityText: 'Pending KYC Submission',
    visibilitySub: 'Documents not yet provided',
    isLive: false,
    isPaymentPending: false,
  };
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

interface ColumnDef {
  id: string;
  title: string;
  defaultWidth: number;
  minWidth: number;
}

const COLUMNS: ColumnDef[] = [
  { id: 'name', title: 'Coach & Academy', defaultWidth: 320, minWidth: 220 },
  { id: 'email', title: 'Email & Contact', defaultWidth: 240, minWidth: 170 },
  { id: 'tier', title: 'Account Tier', defaultWidth: 220, minWidth: 170 },
  { id: 'status', title: 'Status & Visibility', defaultWidth: 230, minWidth: 180 },
  { id: 'dateJoined', title: 'Date Joined', defaultWidth: 150, minWidth: 120 },
  { id: 'actions', title: 'Actions', defaultWidth: 110, minWidth: 90 },
];

export default function AdminCoachRegistryPage() {
  const { showToast } = usePersona();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<any>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [coachTypeFilter, setCoachTypeFilter] = useState<'ALL' | 'INSTITUTE' | 'INDIVIDUAL'>('ALL');

  // Interactive Column Widths State (with localStorage persistence)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 320,
    email: 240,
    tier: 220,
    status: 200,
    dateJoined: 150,
    actions: 110,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('knowurcoach_admin_col_widths');
      if (saved) {
        setColumnWidths(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const updateColWidth = (id: string, width: number) => {
    setColumnWidths((prev) => {
      const next = { ...prev, [id]: width };
      try {
        localStorage.setItem('knowurcoach_admin_col_widths', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetColumnWidths = () => {
    const defaults = {
      name: 320,
      email: 240,
      tier: 220,
      status: 200,
      dateJoined: 150,
      actions: 110,
    };
    setColumnWidths(defaults);
    try {
      localStorage.removeItem('knowurcoach_admin_col_widths');
    } catch {}
    showToast('Column widths reset to default');
  };

  // Drag-to-resize handler
  const handleResizeStart = (e: React.MouseEvent, colId: string, minWidth: number) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columnWidths[colId] || 200;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColumnWidths((prev) => ({ ...prev, [colId]: newWidth }));
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startX;
      const finalWidth = Math.max(minWidth, startWidth + deltaX);
      updateColWidth(colId, finalWidth);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // 3-Dots Floating Menu Popover State
  const [menuCoach, setMenuCoach] = useState<any | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, coach: any) => {
    e.stopPropagation();
    if (menuCoach?.id === coach.id) {
      setMenuCoach(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right),
      });
      setMenuCoach(coach);
    }
  };

  // Close floating 3-dots menu on click outside or scroll
  useEffect(() => {
    if (!menuCoach) return;
    const handleClickOutside = () => {
      setMenuCoach(null);
      setMenuPosition(null);
    };
    const handleScroll = () => {
      setMenuCoach(null);
      setMenuPosition(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuCoach]);

  // Details Modal State
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    coach: any | null;
  }>({
    isOpen: false,
    coach: null,
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    coach: any | null;
    name: string;
    headCoachName: string;
    phone: string;
    locality: string;
    address: string;
    monthlyTuitionFee: number;
    trialFee: number;
    planTier: string;
    coachType: string;
    isTopInArea: boolean;
    isVerifiedBatch: boolean;
    statusNotes: string;
  }>({
    isOpen: false,
    coach: null,
    name: '',
    headCoachName: '',
    phone: '',
    locality: '',
    address: '',
    monthlyTuitionFee: 0,
    trialFee: 0,
    planTier: 'FREE',
    coachType: 'INDIVIDUAL',
    isTopInArea: false,
    isVerifiedBatch: false,
    statusNotes: '',
  });

  // Suspend Confirmation Modal State
  const [suspendModal, setSuspendModal] = useState<{
    isOpen: boolean;
    coach: any | null;
    action: 'suspend' | 'unsuspend';
  }>({
    isOpen: false,
    coach: null,
    action: 'suspend',
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    coach: any | null;
  }>({
    isOpen: false,
    coach: null,
  });

  // Document Viewer Modal State
  const [docViewerModal, setDocViewerModal] = useState<{
    isOpen: boolean;
    coach: any | null;
    initialDocIndex: number;
  }>({
    isOpen: false,
    coach: null,
    initialDocIndex: 0,
  });

  const handleOpenDocViewer = (coach: any, initialIndex = 0) => {
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
      setData(res.coaches || []);
      if (res.config) {
        setConfig(res.config);
      }
    } catch (err) {
      console.error("Failed to load coaches:", err);
      showToast("Error loading coach registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetailsModal = (coach: any) => {
    setDetailsModal({
      isOpen: true,
      coach,
    });
  };

  const openEditModal = (coach: any) => {
    const isApproved = coach.kycStatus === 'APPROVED' && !coach.isSuspended;
    const isPremier = coach.planTier === 'PREMIUM';
    const isStandard = coach.planTier === 'STANDARD';
    const batchFees = (coach.batches || []).map((b: any) => Number(b.monthlyFee)).filter((f: any) => !isNaN(f) && f > 0);
    const startingTuition = batchFees.length > 0 ? Math.min(...batchFees) : (Number(coach.monthlyTuitionFee) || 0);

    setEditModal({
      isOpen: true,
      coach,
      name: coach.name || '',
      headCoachName: coach.headCoachName || '',
      phone: coach.phone || '',
      locality: coach.locality || '',
      address: coach.address || '',
      monthlyTuitionFee: startingTuition,
      trialFee: Number(coach.trialFee) || 0,
      planTier: coach.planTier || 'FREE',
      coachType: coach.coachType || 'INDIVIDUAL',
      isTopInArea: (isPremier && isApproved) ? true : Boolean(coach.isTopInArea),
      isVerifiedBatch: isApproved && ((isPremier || isStandard) ? true : Boolean(coach.isVerifiedBatch)),
      statusNotes: cleanStatusNotes(coach.statusNotes),
    });
  };

  // When changing tier inside the edit modal, automatically adjust badge defaults
  const handleTierChange = (newTier: string) => {
    const isApproved = editModal.coach?.kycStatus === 'APPROVED' && !editModal.coach?.isSuspended;
    if (newTier === 'PREMIUM') {
      setEditModal((prev) => ({
        ...prev,
        planTier: newTier,
        isTopInArea: isApproved,
        isVerifiedBatch: isApproved,
      }));
    } else if (newTier === 'STANDARD') {
      setEditModal((prev) => ({
        ...prev,
        planTier: newTier,
        isVerifiedBatch: isApproved,
      }));
    } else {
      setEditModal((prev) => ({
        ...prev,
        planTier: newTier,
      }));
    }
  };

  const handleSaveEdit = () => {
    if (!editModal.coach) return;
    const coachId = editModal.coach.id;

    startTransition(async () => {
      try {
        const res = await updateCoachDetails(coachId, {
          name: editModal.name,
          headCoachName: editModal.headCoachName,
          phone: editModal.phone,
          locality: editModal.locality,
          address: editModal.address,
          monthlyTuitionFee: Number(editModal.monthlyTuitionFee),
          trialFee: Number(editModal.trialFee),
          planTier: editModal.planTier as any,
          coachType: editModal.coachType as any,
          isTopInArea: editModal.isTopInArea,
          isVerifiedBatch: editModal.isVerifiedBatch,
          statusNotes: editModal.statusNotes,
        });

        if (res.success) {
          showToast(`✅ Saved changes for ${editModal.name}`);
          setEditModal((prev) => ({ ...prev, isOpen: false, coach: null }));
          if (detailsModal.coach?.id === coachId) {
            setDetailsModal((prev) => ({
              ...prev,
              coach: {
                ...prev.coach,
                name: editModal.name,
                headCoachName: editModal.headCoachName,
                phone: editModal.phone,
                locality: editModal.locality,
                address: editModal.address,
                monthlyTuitionFee: Number(editModal.monthlyTuitionFee),
                trialFee: Number(editModal.trialFee),
                planTier: editModal.planTier,
                coachType: editModal.coachType,
                isTopInArea: editModal.isTopInArea,
                isVerifiedBatch: editModal.isVerifiedBatch,
                statusNotes: editModal.statusNotes,
              },
            }));
          }
          loadData();
        } else {
          showToast("Failed to save coach changes");
        }
      } catch (err) {
        showToast("Error saving coach details");
      }
    });
  };

  // Open Suspend Confirmation Dialog
  const promptSuspendToggle = (coach: any) => {
    setSuspendModal({
      isOpen: true,
      coach,
      action: coach.isSuspended ? 'unsuspend' : 'suspend',
    });
  };

  const handleConfirmSuspend = () => {
    if (!suspendModal.coach) return;
    const coach = suspendModal.coach;
    const isUnsuspend = suspendModal.action === 'unsuspend';

    startTransition(async () => {
      try {
        if (isUnsuspend) {
          const res = await unsuspendCoach(coach.id);
          if (res.success) {
            showToast(`✅ ${res.message || `Reactivated ${coach.name}.`}`);
          } else {
            showToast(res.message || "Failed to reactivate coach");
          }
        } else {
          const res = await suspendCoach(coach.id, "Suspended via Admin Registry");
          if (res.success) {
            showToast(`⚠️ Suspended ${coach.name}. Profile hidden from public listings.`);
          } else {
            showToast(res.message || "Failed to suspend coach");
          }
        }
        setSuspendModal({ isOpen: false, coach: null, action: 'suspend' });
        if (detailsModal.coach?.id === coach.id) {
          setDetailsModal((prev) => ({
            ...prev,
            coach: { ...prev.coach, isSuspended: !isUnsuspend },
          }));
        }
        loadData();
      } catch (err) {
        showToast("Failed to update suspension status");
      }
    });
  };

  // Open Delete Confirmation Dialog
  const promptDeleteCoach = (coach: any) => {
    setDeleteModal({
      isOpen: true,
      coach,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.coach) return;
    const coach = deleteModal.coach;
    startTransition(async () => {
      try {
        const res = await deleteCoach(coach.id);
        if (res.success) {
          showToast(`🗑️ Permanently removed ${coach.name}`);
          setDeleteModal({ isOpen: false, coach: null });
          if (detailsModal.coach?.id === coach.id) {
            setDetailsModal({ isOpen: false, coach: null });
          }
          loadData();
        } else {
          showToast("Failed to delete coach record");
        }
      } catch (err) {
        showToast("Failed to delete coach");
      }
    });
  };

  const allowFreeListing = config?.allowFreeTierPublicListing ?? false;

  // Filter logic
  const filtered = data.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.locality?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.headCoachName?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.owner?.email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const vis = getCoachVisibilityStatus(c, allowFreeListing);
    if (statusFilter === 'LIVE' && !vis.isLive) return false;
    if (statusFilter === 'PAYMENT_PENDING' && !vis.isPaymentPending) return false;
    if (statusFilter === 'APPROVED' && (!vis.isLive && !vis.isPaymentPending)) return false;
    if (statusFilter === 'PENDING' && c.kycStatus !== 'PENDING' && c.kycStatus !== 'DOCS_REVIEW' && c.kycStatus !== 'REFERRED_BACK') return false;
    if (statusFilter === 'SUSPENDED' && !c.isSuspended) return false;

    if (tierFilter !== 'ALL' && c.planTier !== tierFilter) return false;
    if (coachTypeFilter !== 'ALL' && c.coachType !== coachTypeFilter) return false;

    return true;
  });

  const totalPremier = data.filter((c) => c.planTier === 'PREMIUM').length;
  const totalStandard = data.filter((c) => c.planTier === 'STANDARD').length;
  const totalLive = data.filter((c) => getCoachVisibilityStatus(c, allowFreeListing).isLive).length;
  const totalPaymentPending = data.filter((c) => getCoachVisibilityStatus(c, allowFreeListing).isPaymentPending).length;
  const totalApproved = data.filter((c) => c.kycStatus === 'APPROVED' && !c.isSuspended).length;
  const totalPending = data.filter((c) => c.kycStatus === 'PENDING' || c.kycStatus === 'DOCS_REVIEW' || c.kycStatus === 'REFERRED_BACK').length;
  const totalSuspended = data.filter((c) => c.isSuspended).length;
  const totalAcademies = data.filter((c) => c.coachType === 'INSTITUTE').length;
  const totalSoloCoaches = data.filter((c) => c.coachType === 'INDIVIDUAL').length;

  const modalVis = detailsModal.coach ? getCoachVisibilityStatus(detailsModal.coach, allowFreeListing) : null;

  if (isLoading) {
    return <AdminVerifySkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ========================================================
            1. BANNER & HEADER
           ======================================================== */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase">
              <Buildings size={16} weight="fill" className="text-emerald-400" />
              Coach &amp; Academy Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Coach &amp; Academy Registry
            </h1>
            <p className="text-sm text-purple-200 max-w-2xl">
              Manage account tiers, verified badges, top-of-area sponsored placements, public listing visibility, and coach profiles.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={resetColumnWidths}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-white/15 transition-all cursor-pointer"
              title="Reset table column widths to default"
            >
              <ArrowsLeftRight size={14} />
              <span>Reset Widths</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh Registry"
            >
              <ArrowsClockwise size={15} className={isLoading ? "animate-spin" : ""} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            2. STATS & TIER METRICS CARDS
           ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Accounts</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{data.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">All registered</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Premier</span>
              <Crown size={14} weight="fill" className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{totalPremier}</div>
            <span className="text-[11px] text-amber-700 font-medium">Top sponsored</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Standard</span>
              <Sparkle size={14} weight="fill" className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1">{totalStandard}</div>
            <span className="text-[11px] text-purple-700 font-medium">Verified listing</span>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'LIVE' ? 'ALL' : 'LIVE')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              statusFilter === 'LIVE'
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                : 'bg-white border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50'
            }`}
            title="Filter by Live & Publicly Listed"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${statusFilter === 'LIVE' ? 'text-emerald-100' : 'text-emerald-700'}`}>Live Public</span>
              <SealCheck size={14} weight="fill" className={statusFilter === 'LIVE' ? 'text-white' : 'text-emerald-500'} />
            </div>
            <div className={`text-2xl font-black mt-1 ${statusFilter === 'LIVE' ? 'text-white' : 'text-emerald-700'}`}>{totalLive}</div>
            <span className={`text-[11px] font-medium ${statusFilter === 'LIVE' ? 'text-emerald-100' : 'text-emerald-700'}`}>Discoverable</span>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'PAYMENT_PENDING' ? 'ALL' : 'PAYMENT_PENDING')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              statusFilter === 'PAYMENT_PENDING'
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/30'
                : 'bg-white border-amber-300 bg-amber-50/30 hover:bg-amber-100/40'
            }`}
            title="Filter by Approved but Payment Pending"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${statusFilter === 'PAYMENT_PENDING' ? 'text-amber-100' : 'text-amber-800'}`}>Payment Pending</span>
              <CreditCard size={14} weight="bold" className={statusFilter === 'PAYMENT_PENDING' ? 'text-white' : 'text-amber-600'} />
            </div>
            <div className={`text-2xl font-black mt-1 ${statusFilter === 'PAYMENT_PENDING' ? 'text-white' : 'text-amber-900'}`}>{totalPaymentPending}</div>
            <span className={`text-[11px] font-medium ${statusFilter === 'PAYMENT_PENDING' ? 'text-amber-100' : 'text-amber-800'}`}>Approved • Unpaid</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">In Review / Susp.</span>
              <Prohibit size={14} weight="bold" className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1">
              {totalPending} <span className="text-xs font-semibold text-slate-400">({totalSuspended} susp.)</span>
            </div>
            <span className="text-[11px] text-rose-700 font-medium">Pending verification</span>
          </div>
        </div>

        {/* ========================================================
            3. SEARCH & FILTERS
           ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search coach, email, academy, locality, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Type Filter Pills (Academies vs Solo Coaches) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'All Accounts' },
                { id: 'INSTITUTE', label: `Academies (${totalAcademies})` },
                { id: 'INDIVIDUAL', label: `Solo Coaches (${totalSoloCoaches})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCoachTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    coachTypeFilter === t.id
                      ? 'bg-white text-indigo-950 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'All Status' },
                { id: 'LIVE', label: `Live (${totalLive})` },
                { id: 'PAYMENT_PENDING', label: `Payment Pending (${totalPaymentPending})` },
                { id: 'PENDING', label: `In Review (${totalPending})` },
                { id: 'SUSPENDED', label: `Suspended (${totalSuspended})` },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === s.id
                      ? s.id === 'PAYMENT_PENDING'
                        ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                        : 'bg-white text-purple-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Account Tier Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Crown size={14} className="text-amber-500 shrink-0" weight="fill" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-bold focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Account Tiers</option>
                <option value="PREMIUM">Premier Account (Sponsored)</option>
                <option value="STANDARD">Standard Account (Verified)</option>
                <option value="FREE">Free Tier</option>
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 font-medium pl-2">
              <ArrowsLeftRight size={13} className="text-purple-600" />
              <span>Drag dividers to resize</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            4. ADMIN COACH REGISTRY TABLE (DYNAMIC RESIZABLE WIDTHS)
           ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <colgroup>
                <col style={{ width: `${columnWidths.name}px` }} />
                <col style={{ width: `${columnWidths.email}px` }} />
                <col style={{ width: `${columnWidths.tier}px` }} />
                <col style={{ width: `${columnWidths.status}px` }} />
                <col style={{ width: `${columnWidths.dateJoined}px` }} />
                <col style={{ width: `${columnWidths.actions}px` }} />
              </colgroup>

              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      style={{ width: `${columnWidths[col.id]}px` }}
                      className={`py-4 px-5 relative select-none group ${col.id === 'actions' ? 'text-right' : 'text-left'}`}
                    >
                      <span className="whitespace-nowrap">{col.title}</span>

                      {/* Interactive Drag Resizer Handle */}
                      {col.id !== 'actions' && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, col.id, col.minWidth)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-600/30 transition-all flex items-center justify-center z-10"
                          title="Click and drag to adjust column width"
                        >
                          <div className="w-[1.5px] h-4 bg-slate-300 group-hover:bg-purple-600 transition-colors" />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <MagnifyingGlass size={24} />
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm">No coaches found</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          No coach records match your current filter criteria or search query.
                        </p>
                        <button
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('ALL');
                            setTierFilter('ALL');
                          }}
                          className="mt-2 text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((coach) => {
                    const vis = getCoachVisibilityStatus(coach, allowFreeListing);
                    const isApproved = coach.kycStatus === 'APPROVED' && !coach.isSuspended;
                    const isPremier = coach.planTier === 'PREMIUM';
                    const isStandard = coach.planTier === 'STANDARD';
                    const ownerEmail = coach.owner?.email || '—';
                    const joinedDate = coach.owner?.createdAt || coach.createdAt || coach.planPurchasedAt;

                    return (
                      <tr
                        key={coach.id}
                        className="hover:bg-purple-50/30 transition-colors group"
                      >
                        {/* COLUMN 1: Coach Name & Academy */}
                        <td className="py-4 px-5 overflow-hidden">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                              <span
                                className="font-black text-slate-900 text-sm truncate whitespace-nowrap"
                                title={coach.name}
                              >
                                {coach.name}
                              </span>
                              {coach.coachType === 'INSTITUTE' ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase shrink-0 whitespace-nowrap">
                                  Academy
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase shrink-0 whitespace-nowrap">
                                  Individual
                                </span>
                              )}
                            </div>

                            <div className="text-slate-500 font-medium text-[11px] truncate whitespace-nowrap">
                              Head: <strong className="text-slate-700">{coach.headCoachName}</strong>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate whitespace-nowrap">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{coach.locality}{coach.city ? `, ${coach.city}` : ''}</span>
                            </div>

                            {/* Badges Bar (Single Row, No Wrap) */}
                            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden pt-0.5">
                              {coach.isTopInArea && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-300 shrink-0 whitespace-nowrap">
                                  <Star size={10} weight="fill" className="text-amber-600" />
                                  Sponsored Top
                                </span>
                              )}
                              {coach.isVerifiedBatch && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-blue-200 shrink-0 whitespace-nowrap">
                                  <SealCheck size={10} weight="fill" className="text-blue-600" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* COLUMN 2: Email & Contact */}
                        <td className="py-4 px-5 overflow-hidden">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate whitespace-nowrap">
                              <EnvelopeSimple size={13} className="text-purple-600 shrink-0" />
                              <span className="font-mono text-[11px] truncate" title={ownerEmail}>
                                {ownerEmail}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                              <Phone size={13} className="text-slate-400 shrink-0" />
                              <span>{coach.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                              <CurrencyInr size={12} weight="bold" />
                              {(() => {
                                const batchFees = (coach.batches || []).map((b: any) => Number(b.monthlyFee)).filter((f: any) => !isNaN(f) && f > 0);
                                const tuition = batchFees.length > 0 ? Math.min(...batchFees) : (Number(coach.monthlyTuitionFee) || 0);
                                return tuition > 0 ? (
                                  <span>₹{tuition.toLocaleString('en-IN')}/mo</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">No batches</span>
                                );
                              })()}
                            </div>
                          </div>
                        </td>

                        {/* COLUMN 3: Account Tier (Standard / Premier) */}
                        <td className="py-4 px-5 overflow-hidden">
                          <div className="space-y-1">
                            {isPremier ? (
                              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100/90 text-amber-950 px-2.5 py-1.5 rounded-xl border border-amber-300/80 shadow-2xs whitespace-nowrap">
                                <Crown size={14} weight="fill" className="text-amber-600 shrink-0" />
                                <div>
                                  <span className="font-black text-xs block leading-none">Premier Account</span>
                                  <span className="text-[9px] font-bold text-amber-700">Top Sponsored + Verified</span>
                                </div>
                              </div>
                            ) : isStandard ? (
                              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-950 px-2.5 py-1.5 rounded-xl border border-purple-200 shadow-2xs whitespace-nowrap">
                                <Sparkle size={14} weight="fill" className="text-purple-600 shrink-0" />
                                <div>
                                  <span className="font-black text-xs block leading-none">Standard Account</span>
                                  <span className="text-[9px] font-bold text-purple-700">Verified Listing</span>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                                <Tag size={13} className="text-slate-400 shrink-0" />
                                <div>
                                  <span className="font-black text-xs block leading-none">Free Tier</span>
                                  <span className="text-[9px] font-medium text-slate-500">Unpaid Starter</span>
                                </div>
                              </div>
                            )}

                            {coach.planPaymentId && (
                              <div className="pt-0.5 truncate whitespace-nowrap">
                                <span className="font-mono text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block truncate" title={coach.planPaymentId}>
                                  {coach.planPaymentId}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* COLUMN 4: Status & Profile Visibility */}
                        <td className="py-4 px-5 overflow-hidden">
                          <div className="space-y-1.5">
                            {vis.code === 'PAYMENT_PENDING' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300 ring-1 ring-amber-300/60 shadow-2xs whitespace-nowrap"
                                title="Admin approved KYC, but coach has not paid for Standard/Premier plan yet. Profile is hidden from public discovery."
                              >
                                <CreditCard size={12} weight="bold" className="text-amber-700" />
                                APPROVED • PAYMENT PENDING
                              </span>
                            ) : vis.code === 'LIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                                <SealCheck size={12} weight="fill" className="text-emerald-600" />
                                APPROVED &amp; LIVE
                              </span>
                            ) : vis.code === 'FREE_LIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-300 whitespace-nowrap">
                                <SealCheck size={12} weight="fill" className="text-teal-600" />
                                APPROVED • FREE LIVE
                              </span>
                            ) : vis.code === 'SUSPENDED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                                <Prohibit size={12} weight="bold" />
                                SUSPENDED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200 whitespace-nowrap">
                                <Clock size={12} weight="bold" />
                                {vis.label}
                              </span>
                            )}

                            {/* Public Visibility Indicator */}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${vis.dotClass}`} />
                              <span className={
                                vis.isLive
                                  ? 'text-emerald-700'
                                  : vis.isPaymentPending
                                  ? 'text-amber-800 font-extrabold'
                                  : coach.isSuspended
                                  ? 'text-rose-700'
                                  : 'text-slate-600'
                              }>
                                {vis.visibilityText}
                              </span>
                            </div>

                            {vis.isPaymentPending && (
                              <div className="text-[9px] font-semibold text-amber-700 flex items-center gap-1 truncate" title="Coaches/academies must choose a plan in their dashboard to publish profile">
                                <EyeSlash size={10} weight="bold" className="shrink-0" />
                                <span>Awaiting coach subscription</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* COLUMN 5: Date Joined */}
                        <td className="py-4 px-5 overflow-hidden whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold whitespace-nowrap">
                            <CalendarBlank size={14} className="text-slate-400 shrink-0" />
                            <span>{formatDate(joinedDate)}</span>
                          </div>
                        </td>

                        {/* COLUMN 6: Action Buttons (3-Dots Menu) */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Details Button */}
                            <button
                              type="button"
                              onClick={() => openDetailsModal(coach)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-purple-200/80 shadow-2xs hover:shadow-xs whitespace-nowrap"
                              title="View full coach profile & details"
                            >
                              <Eye size={13} weight="bold" />
                              <span>Details</span>
                            </button>

                            {/* 3 Dots Menu Button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenMenu(e, coach)}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                menuCoach?.id === coach.id
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                              title="More row actions"
                            >
                              <DotsThreeVertical size={16} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            5. FLOATING 3-DOTS ACTION MENU
           ======================================================== */}
        {menuCoach && menuPosition && (
          <div
            style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
            className="fixed z-[100] w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 divide-y divide-slate-100 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Coach Actions</div>
              <div className="text-xs font-black text-slate-900 truncate">{menuCoach.name}</div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  openDetailsModal(menuCoach);
                  setMenuCoach(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-900 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Eye size={15} weight="bold" className="text-purple-600 shrink-0" />
                <span>View Full Details</span>
              </button>

              <button
                onClick={() => {
                  openEditModal(menuCoach);
                  setMenuCoach(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-purple-50 text-slate-700 hover:text-purple-900 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <PencilSimple size={15} weight="bold" className="text-slate-500 shrink-0" />
                <span>Edit Profile &amp; Tier</span>
              </button>

              <button
                onClick={() => {
                  handleOpenDocViewer(menuCoach);
                  setMenuCoach(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={15} weight="bold" className="text-indigo-600 shrink-0" />
                  <span>KYC Documents</span>
                </div>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {getCoachDocCount(menuCoach)}
                </span>
              </button>
            </div>

            <div className="py-1">
              <Link
                href={`/activities/${menuCoach.id}`}
                target="_blank"
                onClick={() => setMenuCoach(null)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowSquareOut size={15} weight="bold" className="text-slate-400 shrink-0" />
                  <span>Open Public Profile</span>
                </div>
                {getCoachVisibilityStatus(menuCoach, allowFreeListing).isPaymentPending && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Unlisted
                  </span>
                )}
              </Link>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  promptSuspendToggle(menuCoach);
                  setMenuCoach(null);
                }}
                className={`w-full text-left px-3.5 py-2 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  menuCoach.isSuspended
                    ? 'hover:bg-emerald-50 text-emerald-800'
                    : 'hover:bg-amber-50 text-amber-800'
                }`}
              >
                <Prohibit size={15} weight="bold" className={menuCoach.isSuspended ? "text-emerald-600 shrink-0" : "text-amber-600 shrink-0"} />
                <span>{menuCoach.isSuspended ? 'Reactivate Account' : 'Suspend Account'}</span>
              </button>

              <button
                onClick={() => {
                  promptDeleteCoach(menuCoach);
                  setMenuCoach(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash size={15} weight="bold" className="text-rose-500 shrink-0" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            6. "VIEW DETAILS" COMPREHENSIVE MODAL
           ======================================================== */}
        {detailsModal.isOpen && detailsModal.coach && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setDetailsModal({ isOpen: false, coach: null });
              }
            }}
          >
            <div
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 flex items-start justify-between gap-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-purple-200">
                      {detailsModal.coach.category || 'Sports & Athletics'}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {detailsModal.coach.coachType === 'INSTITUTE' ? 'Academy / Institute' : 'Individual Coach'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {detailsModal.coach.name}
                  </h2>
                  <p className="text-xs text-purple-200 font-medium">
                    Head Coach: <strong className="text-white">{detailsModal.coach.headCoachName}</strong> &bull; {detailsModal.coach.locality}{detailsModal.coach.city ? `, ${detailsModal.coach.city}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsModal({ isOpen: false, coach: null })}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                
                {/* 1. Account Tier & Badges Highlight Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tier Card */}
                  <div className={`p-4 rounded-2xl border ${
                    detailsModal.coach.planTier === 'PREMIUM'
                      ? 'bg-amber-50/60 border-amber-300'
                      : detailsModal.coach.planTier === 'STANDARD'
                      ? 'bg-purple-50/60 border-purple-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Commercial Tier
                      </span>
                      {detailsModal.coach.planTier === 'PREMIUM' ? (
                        <Crown size={16} weight="fill" className="text-amber-500" />
                      ) : (
                        <Sparkle size={16} weight="fill" className="text-purple-600" />
                      )}
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {detailsModal.coach.planTier === 'PREMIUM'
                        ? 'Premier Account'
                        : detailsModal.coach.planTier === 'STANDARD'
                        ? 'Standard Account'
                        : 'Free Tier (Unpaid)'}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-1">
                      {detailsModal.coach.planTier === 'PREMIUM'
                        ? 'Top-of-Area Sponsored Placement + Verified Badge + Priority Search Roster'
                        : detailsModal.coach.planTier === 'STANDARD'
                        ? 'Verified Badge + Live Public Discovery Profile + Online Enrollment'
                        : 'Standard basic account without premium sponsored placement.'}
                    </p>
                  </div>

                  {/* Badges & Visibility Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Profile Badges &amp; Status
                    </span>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Verified Badge:</span>
                      {detailsModal.coach.isVerifiedBatch ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          <SealCheck size={13} weight="fill" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">Not Granted</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Top of Area Sponsored:</span>
                      {detailsModal.coach.isTopInArea ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                          <Star size={13} weight="fill" className="text-amber-600" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">Inactive</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-600 font-medium">Directory Visibility:</span>
                      {detailsModal.coach.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                          <Prohibit size={13} weight="bold" /> Hidden (Suspended)
                        </span>
                      ) : modalVis?.isPaymentPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 ring-1 ring-amber-300/50">
                          <CreditCard size={13} weight="bold" className="text-amber-700" /> Hidden • Payment Pending
                        </span>
                      ) : modalVis?.isLive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle size={13} weight="fill" /> Live &amp; Discoverable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                          <Clock size={13} weight="bold" /> In Verification Desk
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning / Notice banner if Payment is Pending */}
                {modalVis?.isPaymentPending && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 flex items-start gap-3.5 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard size={20} weight="bold" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                        Admin KYC Approved &bull; Public Listing Awaiting Plan Payment
                      </h5>
                      <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                        This coach/academy has been approved by admin, but is not yet publicly visible on the search and discovery pages because they are currently on the <strong className="font-extrabold underline">Free Plan</strong>. They can go live instantly by upgrading to a Standard or Premier plan from their Coach Dashboard. Alternatively, you can grant them a plan in the Edit modal or enable free tier public listings in Platform Settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Key Contact & Account Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    Account &amp; Contact Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Email</span>
                      <span className="font-mono text-slate-900 font-semibold text-xs truncate block" title={detailsModal.coach.owner?.email}>
                        {detailsModal.coach.owner?.email || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                      <span className="font-bold text-slate-900 text-xs">{detailsModal.coach.phone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Date Joined</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {formatDate(detailsModal.coach.owner?.createdAt || detailsModal.coach.createdAt)}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Full Address</span>
                      <span className="text-slate-700 font-medium text-xs block">{detailsModal.coach.address || '—'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment / Order ID</span>
                      <span className="font-mono text-slate-700 font-semibold text-xs truncate block">
                        {detailsModal.coach.planPaymentId || 'None (Free Plan)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Commercial & Program Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Tuition</span>
                    {(() => {
                      const detailsBatchFees = (detailsModal.coach?.batches || []).map((b: any) => Number(b.monthlyFee)).filter((f: any) => !isNaN(f) && f > 0);
                      const detailsTuition = detailsBatchFees.length > 0 ? Math.min(...detailsBatchFees) : (Number(detailsModal.coach?.monthlyTuitionFee) || 0);
                      return (
                        <span className="text-base font-black text-slate-900">
                          {detailsTuition > 0 ? `₹${detailsTuition.toLocaleString('en-IN')}` : 'No batches'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Trial Fee</span>
                    <span className="text-base font-black text-slate-900">
                      {Number(detailsModal.coach.trialFee) > 0 ? `₹${detailsModal.coach.trialFee}` : 'Free Trial'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Rating &amp; Reviews</span>
                    <span className="text-base font-black text-amber-600 flex items-center gap-1">
                      <Star size={15} weight="fill" />
                      {Number(detailsModal.coach.rating || 5).toFixed(1)}
                      <span className="text-slate-400 text-xs font-semibold">({detailsModal.coach.reviewsCount || 0})</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Student Ratio</span>
                    <span className="text-base font-black text-slate-900">
                      {detailsModal.coach.studentCoachRatio || '1:10'}
                    </span>
                  </div>
                </div>

                {/* 4. Batches Roster */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                      Batches &amp; Training Schedules ({detailsModal.coach.batches?.length || 0})
                    </h4>
                  </div>

                  {detailsModal.coach.batches && detailsModal.coach.batches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {detailsModal.coach.batches.map((b: any) => (
                        <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900">{b.name}</span>
                            <span className="font-black text-purple-700">₹{b.monthlyFee}/mo</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{b.schedule}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>Age: {b.ageGroup}</span>
                            <span>Seats: {b.seatsFilled || 0} / {b.totalSeats}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      No batch schedules configured yet.
                    </p>
                  )}
                </div>

                {/* 5. Documents Card */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                      <FileText size={15} weight="bold" className="text-indigo-600" />
                      Uploaded Verification Documents
                    </h4>
                    <p className="text-[11px] text-indigo-800">
                      {getCoachDocCount(detailsModal.coach)} KYC verification documents uploaded by this coach.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDocViewer(detailsModal.coach)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Eye size={14} weight="bold" />
                    <span>Inspect Documents</span>
                  </button>
                </div>

                {/* Status Notes if any */}
                {cleanStatusNotes(detailsModal.coach.statusNotes) && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Internal Admin Notes</span>
                    <p className="text-slate-700 font-medium text-xs">
                      {cleanStatusNotes(detailsModal.coach.statusNotes)}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer Quick Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/activities/${detailsModal.coach.id}`}
                    target="_blank"
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    <span>View Public Page</span>
                    <ArrowSquareOut size={13} weight="bold" />
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const coach = detailsModal.coach;
                      setDetailsModal({ isOpen: false, coach: null });
                      openEditModal(coach);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <PencilSimple size={14} weight="bold" />
                    <span>Edit Profile &amp; Tier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => promptSuspendToggle(detailsModal.coach)}
                    className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      detailsModal.coach.isSuspended
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Prohibit size={14} weight="bold" />
                    <span>{detailsModal.coach.isSuspended ? 'Reactivate' : 'Suspend'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => promptDeleteCoach(detailsModal.coach)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete coach"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            7. EDIT COACH & TIER MODAL
           ======================================================== */}
        {editModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setEditModal((prev) => ({ ...prev, isOpen: false, coach: null }));
              }
            }}
          >
            <div
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[88vh] overflow-y-auto animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <PencilSimple size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Edit Coach &amp; Account Tier
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure account tier, badges, and listing information
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false, coach: null }))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Academy / Coach Name:</label>
                  <input
                    type="text"
                    value={editModal.name}
                    onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Head Coach / Founder:</label>
                  <input
                    type="text"
                    value={editModal.headCoachName}
                    onChange={(e) => setEditModal({ ...editModal, headCoachName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={editModal.phone}
                    onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Locality / Area:</label>
                  <input
                    type="text"
                    value={editModal.locality}
                    onChange={(e) => setEditModal({ ...editModal, locality: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Tuition Fee (₹):</label>
                  <input
                    type="number"
                    value={editModal.monthlyTuitionFee}
                    onChange={(e) => setEditModal({ ...editModal, monthlyTuitionFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Full Address:</label>
                  <input
                    type="text"
                    value={editModal.address}
                    onChange={(e) => setEditModal({ ...editModal, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* ACCOUNT TIER SELECTION */}
                <div className="sm:col-span-2 p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-2">
                  <label className="font-extrabold text-purple-950 block">
                    Account Tier:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      onClick={() => handleTierChange('FREE')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        editModal.planTier === 'FREE'
                          ? 'bg-white border-purple-600 shadow-xs font-black text-purple-900'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs">Free Tier</span>
                      <span className="text-[10px] text-slate-400 font-medium block">Standard basic</span>
                    </label>

                    <label
                      onClick={() => handleTierChange('STANDARD')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        editModal.planTier === 'STANDARD'
                          ? 'bg-white border-purple-600 ring-2 ring-purple-600/20 shadow-xs font-black text-purple-900'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs flex items-center justify-center gap-1">
                        <Sparkle size={12} weight="fill" className="text-purple-600" />
                        Standard
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold block">Auto-Verified</span>
                    </label>

                    <label
                      onClick={() => handleTierChange('PREMIUM')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        editModal.planTier === 'PREMIUM'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs font-black text-amber-950'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs flex items-center justify-center gap-1">
                        <Crown size={12} weight="fill" className="text-amber-600" />
                        Premier Pro
                      </span>
                      <span className="text-[10px] text-amber-700 font-semibold block">Top Sponsored + Verified</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organization Type:</label>
                  <select
                    value={editModal.coachType}
                    onChange={(e) => setEditModal({ ...editModal, coachType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="INDIVIDUAL">Individual Coach</option>
                    <option value="INSTITUTE">Sports Academy / Institute</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trial Pass Fee (₹):</label>
                  <input
                    type="number"
                    value={editModal.trialFee}
                    onChange={(e) => setEditModal({ ...editModal, trialFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Toggles for Badges */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editModal.isTopInArea}
                      onChange={(e) => setEditModal({ ...editModal, isTopInArea: e.target.checked })}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>⭐ Top of Area Sponsored Placement</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editModal.isVerifiedBatch}
                      onChange={(e) => setEditModal({ ...editModal, isVerifiedBatch: e.target.checked })}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>✓ Verified Badge</span>
                  </label>
                </div>

                {/* Docs Shortcut in Edit Modal */}
                {editModal.coach && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleOpenDocViewer(editModal.coach)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={15} weight="bold" />
                      <span>Inspect Uploaded KYC Documents ({getCoachDocCount(editModal.coach)})</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false, coach: null }))}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            7. SUSPEND / UNSUSPEND CONFIRMATION MODAL
           ======================================================== */}
        <ConfirmationModal
          isOpen={suspendModal.isOpen}
          title={suspendModal.action === 'unsuspend' ? "Reactivate Coach Profile" : "Suspend Coach Account"}
          itemName={suspendModal.coach?.name}
          message={
            suspendModal.action === 'unsuspend'
              ? "Are you sure you want to reactivate this coach account? Their verified profile and batches will be restored to the public discovery directory."
              : "Are you sure you want to suspend this coach account? Their profile and listings will be immediately hidden from parents and search results."
          }
          confirmText={suspendModal.action === 'unsuspend' ? "Yes, Reactivate Profile" : "Yes, Suspend Account"}
          variant={suspendModal.action === 'unsuspend' ? "warning" : "danger"}
          isPending={isPending}
          onConfirm={handleConfirmSuspend}
          onCancel={() => setSuspendModal({ isOpen: false, coach: null, action: 'suspend' })}
        />

        {/* ========================================================
            8. DELETE CONFIRMATION MODAL
           ======================================================== */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Coach Profile"
          itemName={deleteModal.coach?.name}
          message="Are you sure you want to permanently delete this coach? All batch rosters, facilities, and booking records will be permanently removed. This action cannot be undone."
          confirmText="Yes, Delete Permanently"
          variant="danger"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, coach: null })}
        />

        {/* ========================================================
            9. DOCUMENT VIEWER MODAL
           ======================================================== */}
        {docViewerModal.isOpen && docViewerModal.coach && (
          <DocViewerModal
            isOpen={docViewerModal.isOpen}
            onClose={() => setDocViewerModal({ isOpen: false, coach: null, initialDocIndex: 0 })}
            coach={docViewerModal.coach}
            documents={parseCoachDocuments(docViewerModal.coach)}
            initialDocIndex={docViewerModal.initialDocIndex}
            onVerifyDoc={(docId) => {
              showToast('✅ Marked document verified');
            }}
            onFlagDoc={(docId, reason) => {
              showToast(`⚠️ Document flagged: ${reason}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
