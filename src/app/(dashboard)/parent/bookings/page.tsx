"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { BookingPassCard, BookingPassData } from '@/components/cards/BookingPassCard';
import { ParentBookingsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { getParentDashboardData, addChildProfile, deleteChildProfile } from '@/lib/actions';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  Ticket,
  Star,
  User,
  Plus,
  ShieldCheck,
  CalendarCheck,
  Trophy,
  DownloadSimple,
  Sparkle,
  Lock,
  Trash,
  X,
  Spinner,
} from '@phosphor-icons/react';

export default function ParentBookingsPage() {
  const { showToast } = usePersona();
  const { user, session } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'trial' | 'batch' | 'tournament'>('all');
  const [parentData, setParentData] = useState<any>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);

  // Add child modal state
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('');
  const [newChildInterests, setNewChildInterests] = useState('');

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getParentDashboardData(userEmail);
      if (res.success) {
        setParentData(res.parent);
        setChildrenList(res.children || []);
        setBookingsList(res.bookings || []);
      }
    } catch (err) {
      console.warn("Could not load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const onFocus = () => {
      if (!userEmail) return;
      getParentDashboardData(userEmail)
        .then((res) => {
          if (res.success) {
            setParentData(res.parent);
            setChildrenList(res.children || []);
            setBookingsList(res.bookings || []);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('focus', onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [userEmail]);

  // Map real database bookings to BookingPassData
  const passes: BookingPassData[] = bookingsList.map((bk: any) => {
    const type: 'trial' | 'batch' | 'tournament' =
      bk.passType === 'FREE_TRIAL'
        ? 'trial'
        : bk.passType === 'MONTHLY_BATCH'
        ? 'batch'
        : 'tournament';

    const attendedCount = bk.attendances ? bk.attendances.filter((a: any) => a.isPresent).length : 0;
    const totalClasses = bk.batch ? 12 : 1;
    const pct = Math.round((attendedCount / totalClasses) * 100);

    const rawPass = bk.passId || `REF-${bk.id.slice(-6)}`;
    const passId = rawPass.startsWith('REF-') ? rawPass : rawPass.replace('KUC-PASS-', 'REF-');

    // Dynamic batch monthly fee priority over centre default
    const dynamicBatchFee = bk.batch?.monthlyFee
      ? Number(bk.batch.monthlyFee)
      : (Number(bk.netAmountPaid) > 0 ? Number(bk.netAmountPaid) : (Number(bk.centre?.monthlyTuitionFee) || 0));

    const coachName = bk.batch?.coachName || bk.centre?.headCoachName || 'Assigned Head Coach';
    const childFullName = bk.child ? `${bk.child.fullName}${bk.child.age ? ` (Age ${bk.child.age})` : ''}` : 'Student';

    return {
      id: bk.id,
      type,
      title: bk.centre?.name || bk.competition?.title || 'Session Pass',
      subtitle: bk.centre
        ? `${bk.centre.category} • ${bk.centre.locality}${bk.centre.city ? `, ${bk.centre.city}` : ''}`
        : bk.competition?.venue || 'Premier Sports Venue',
      studentName: childFullName,
      schedule:
        bk.batch?.schedule ||
        (bk.scheduledAt ? new Date(bk.scheduledAt).toLocaleDateString() : 'Scheduled Class'),
      courtOrVenue: bk.batch ? `${bk.batch.name}` : bk.competition?.venue || 'Main Court',
      passId,
      feeInfo: type === 'trial' ? 'Free Trial' : (dynamicBatchFee > 0 ? `Tuition: ₹${dynamicBatchFee.toLocaleString('en-IN')}/mo` : 'Tuition: Fee on Inquiry'),
      phone: bk.centre?.phone || bk.centre?.owner?.phone || '9897012345',
      coachName,
      attendances: bk.attendances || [],
      attendanceProgress:
        type === 'batch'
          ? { attended: attendedCount, total: totalClasses, percentage: pct }
          : undefined,
      tournamentDetails:
        type === 'tournament'
          ? {
              category: bk.competition?.category || 'Singles',
              dates: bk.competition?.dates || 'TBD',
              reportingTime: '8:30 AM Sharp',
            }
          : undefined,
    };
  });

  const filteredPasses = passes.filter((pass) => {
    if (activeFilter === 'all') return true;
    return pass.type === activeFilter;
  });

  const trialCount = passes.filter((p) => p.type === 'trial').length;
  const batchCount = passes.filter((p) => p.type === 'batch').length;
  const tournamentCount = passes.filter((p) => p.type === 'tournament').length;

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildAge.trim()) {
      showToast('⚠️ Please enter child name and age');
      return;
    }

    startTransition(async () => {
      try {
        const interestsArr = newChildInterests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await addChildProfile(userEmail, {
          fullName: newChildName.trim(),
          age: parseInt(newChildAge, 10),
          grade: newChildGrade.trim() || undefined,
          interests: interestsArr,
        });

        if (res.success && res.child) {
          setChildrenList((prev) => [...prev, res.child]);
          setIsAddChildModalOpen(false);
          setNewChildName('');
          setNewChildAge('');
          setNewChildGrade('');
          setNewChildInterests('');
          showToast(`✅ Added ${res.child.fullName} to your account!`);
        } else {
          showToast(res.message || 'Failed to add child profile');
        }
      } catch (err) {
        showToast('Error saving child profile');
      }
    });
  };

  const handleDeleteChild = (childId: string, name: string) => {
    if (!confirm(`Remove profile for ${name}?`)) return;
    startTransition(async () => {
      try {
        const res = await deleteChildProfile(childId);
        if (res.success) {
          setChildrenList((prev) => prev.filter((c) => c.id !== childId));
          showToast(`Removed profile for ${name}`);
        }
      } catch {
        showToast('Failed to delete child profile');
      }
    });
  };

  const displayName = parentData?.fullName || user?.name || 'Parent Account';
  const displayPhone = (user as any)?.phone || 'Registered Account';

  if (loading) {
    return <ParentBookingsSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
              <Ticket size={14} weight="fill" className="text-yellow-400" />
              Confirmed Admissions &amp; Bookings
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              My Bookings &amp; Enrolled Admissions
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
              Parent: <strong className="text-white">{displayName}</strong> •{' '}
              {passes.length === 0
                ? 'No active admissions yet. Browse academies to book a free trial!'
                : `Showing ${passes.length} confirmed admissions, trial bookings & tournament registrations.`}
            </p>
          </div>

          {/* Quick Counter Grid on Banner */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center shrink-0 w-full sm:w-auto">
            <div
              onClick={() => setActiveFilter('trial')}
              className="cursor-pointer hover:bg-white/10 px-3 py-1 rounded-xl transition-all"
            >
              <div className="text-xl font-black text-yellow-400">{trialCount}</div>
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Free Trials</div>
            </div>
            <div
              onClick={() => setActiveFilter('batch')}
              className="cursor-pointer hover:bg-white/10 px-3 py-1 rounded-xl transition-all border-x border-white/10"
            >
              <div className="text-xl font-black text-emerald-400">{batchCount}</div>
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Batches</div>
            </div>
            <div
              onClick={() => setActiveFilter('tournament')}
              className="cursor-pointer hover:bg-white/10 px-3 py-1 rounded-xl transition-all"
            >
              <div className="text-xl font-black text-orange-400">{tournamentCount}</div>
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Tournaments</div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ========================================================
              LEFT SIDEBAR: Real Parent Profile & Enrolled Children
             ======================================================== */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            {/* Parent Account Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-black text-lg flex items-center justify-center border border-blue-200 shrink-0">
                  {displayName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">{displayName}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate">{displayPhone}</p>
                  <span className="inline-block mt-1 bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-100">
                    Verified Parent ✓
                  </span>
                </div>
              </div>

              {/* Children Profiles */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    Enrolled Children ({childrenList.length})
                  </span>
                  <button
                    onClick={() => setIsAddChildModalOpen(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} weight="bold" /> Add Child
                  </button>
                </div>

                {childrenList.length > 0 ? (
                  childrenList.map((ch) => {
                    const childPassesCount = passes.filter((p) =>
                      p.studentName.toLowerCase().includes(ch.fullName.toLowerCase())
                    ).length;

                    return (
                      <div
                        key={ch.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 truncate">{ch.fullName}</div>
                          <div className="text-[10px] text-slate-500">
                            Age {ch.age} {ch.grade ? `• Grade ${ch.grade}` : ''}{' '}
                            {ch.interests?.length > 0 ? `• ${ch.interests.join(', ')}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {childPassesCount} {childPassesCount === 1 ? 'Booking' : 'Bookings'}
                          </span>
                          <button
                            onClick={() => handleDeleteChild(ch.id, ch.fullName)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove child profile"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                    <p className="text-xs text-slate-500 font-medium">No child profiles registered yet</p>
                    <button
                      onClick={() => setIsAddChildModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      + Add your child's profile
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Academy Admission Guarantee */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck size={15} weight="fill" className="text-blue-600" />
                  Direct Academy Enrollment
                </div>
                <p className="text-[11px] text-blue-800 leading-tight">
                  Your child's seat is reserved. Tuition fees are settled directly with the academy or coach. Zero platform charges.
                </p>
              </div>

              {passes.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      const firstPass = passes[0];
                      if (firstPass) {
                        downloadBookingSlip({
                          bookingId: firstPass.passId,
                          referenceNo: firstPass.passId,
                          type: firstPass.type,
                          academyName: firstPass.title,
                          locality: firstPass.subtitle,
                          studentName: firstPass.studentName,
                          schedule: firstPass.schedule,
                          courtOrVenue: firstPass.courtOrVenue,
                          feeInfo: firstPass.feeInfo,
                          contactPhone: firstPass.phone,
                        });
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DownloadSimple size={15} weight="bold" />
                    Download Booking Slips (PDF)
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ========================================================
              RIGHT MAIN AREA: Filterable Passes Grid
             ======================================================== */}
          <div className="lg:col-span-2 space-y-5">
            {/* Filter Pills */}
            <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-[#0066ff] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Admissions ({passes.length})
              </button>
              <button
                onClick={() => setActiveFilter('trial')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'trial'
                    ? 'bg-yellow-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Free Trials ({trialCount})
              </button>
              <button
                onClick={() => setActiveFilter('batch')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'batch'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Enrolled Batches ({batchCount})
              </button>
              <button
                onClick={() => setActiveFilter('tournament')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'tournament'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tournaments ({tournamentCount})
              </button>
            </div>

            {/* Passes Cards List or Clean Empty State */}
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-500">Loading your admissions and bookings...</p>
              </div>
            ) : filteredPasses.length > 0 ? (
              <div className="space-y-4">
                {filteredPasses.map((pass) => (
                  <BookingPassCard key={pass.id} pass={pass} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <Ticket size={32} weight="duotone" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {activeFilter === 'all'
                      ? 'No Bookings or Enrolled Admissions Yet'
                      : `No active admissions in category: ${activeFilter}`}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Explore verified sports academies, martial arts centers, and skill classes across
                    India. Claim a free trial or enroll directly with verified centers!
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/activities"
                    className="inline-flex items-center gap-2 bg-[#0066ff] text-white text-xs font-extrabold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Sparkle size={16} weight="fill" />
                    Discover Academies
                  </Link>
                  {childrenList.length === 0 && (
                    <button
                      onClick={() => setIsAddChildModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold px-5 py-3 rounded-xl transition-colors"
                    >
                      <Plus size={15} weight="bold" />
                      Add Child Profile
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Profile Modal */}
      {isAddChildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Add Child Profile</h3>
              </div>
              <button
                onClick={() => setIsAddChildModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleAddChildSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    placeholder="e.g. 9"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    School Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 4"
                    value={newChildGrade}
                    onChange={(e) => setNewChildGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Interests / Sports
                </label>
                <input
                  type="text"
                  placeholder="e.g. Badminton, Swimming, Chess (comma separated)"
                  value={newChildInterests}
                  onChange={(e) => setNewChildInterests(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChildModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
