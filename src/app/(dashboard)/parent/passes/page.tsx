"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { getParentDashboardData } from '@/lib/actions';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import { ParentBookingsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Ticket,
  CalendarBlank,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Sparkle,
  ArrowRight,
  Spinner,
  DownloadSimple,
} from '@phosphor-icons/react';

export default function ParentPassesPage() {
  const { user, session } = useAuth();
  const { openModal } = useModalStore();
  const { showToast } = usePersona();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getParentDashboardData(userEmail);
        if (res.success) {
          setBookings(res.bookings || []);
        }
      } catch (err) {
        console.warn('Could not load passes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  if (loading) {
    return <ParentBookingsSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
              <Ticket size={14} weight="bold" />
              Verified Admission Reference Numbers
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Confirmed Admissions &amp; Slips
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Quote these official booking reference numbers at academy desks for instant check-in. Download confirmation slips anytime.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 flex items-center gap-3">
            <div className="text-3xl font-black text-blue-300">{bookings.length}</div>
            <div className="text-xs text-white/80 font-bold leading-tight">
              Confirmed<br />Admissions
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading your confirmed admissions...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookings.map((bk) => {
              const acadName = bk.centre?.name || bk.competition?.title || 'Verified Sports Centre';
              const childName = bk.child?.fullName || 'Student';
              const passId = bk.passId || `REF-${bk.id.slice(-6)}`;
              const cleanRef = passId.startsWith('#') ? passId : `#${passId}`;
              const schedule = bk.batch?.schedule || (bk.scheduledAt ? new Date(bk.scheduledAt).toLocaleDateString() : 'Scheduled Class');
              const locality = bk.centre?.locality || (bk.centre?.city ? bk.centre.city : 'Verified Facility');
              const courtNumber = bk.batch?.name || 'Main Training Ground';
              const type = bk.passType === 'FREE_TRIAL' ? 'trial' : 'batch';
              const dynamicBatchFee = bk.batch?.monthlyFee
                ? Number(bk.batch.monthlyFee)
                : (Number(bk.netAmountPaid) > 0 ? Number(bk.netAmountPaid) : (Number(bk.centre?.monthlyTuitionFee) || 1800));
              const feeInfo = type === 'trial' ? '₹0 (Free Trial)' : `₹${dynamicBatchFee.toLocaleString('en-IN')}/month`;

              return (
                <div
                  key={bk.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        {bk.passType?.replace('_', ' ') || 'CONFIRMED ADMISSION'}
                      </span>
                      <span className="text-blue-100 font-mono text-[11px] font-bold">
                        {cleanRef}
                      </span>
                    </div>
                    <h3 className="font-black text-base mt-2 line-clamp-1 text-white">
                      {acadName}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5">{locality}{bk.centre?.city ? `, ${bk.centre.city}` : ''}</p>

                    {/* Prominent Student Badge */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 mt-3 flex items-center gap-2 border border-white/10">
                      <div className="w-6 h-6 rounded-lg bg-white text-blue-900 font-black text-xs flex items-center justify-center shrink-0">
                        {childName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-blue-200 font-bold block">Student</span>
                        <span className="text-xs font-black text-white truncate block">{childName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={15} weight="bold" className="text-blue-600 shrink-0" />
                        <span className="font-medium">{schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin size={15} weight="bold" className="text-blue-600 shrink-0" />
                        <span className="font-medium">{courtNumber}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          openModal('session-pass', {
                            title: `${acadName} (${childName})`,
                            acadName,
                            locality,
                            sessionTime: schedule,
                            courtNumber,
                            coachName: bk.batch?.coachName || bk.centre?.headCoachName || 'Assigned Head Coach',
                            bookingId: cleanRef,
                            studentName: childName,
                            type,
                            feeInfo,
                            phone: bk.centre?.phone || '9897012345',
                          })
                        }
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Ticket size={15} weight="bold" />
                        <span>Booking Details</span>
                      </button>
                      <button
                        onClick={() =>
                          downloadBookingSlip({
                            bookingId: cleanRef,
                            referenceNo: cleanRef,
                            type,
                            academyName: acadName,
                            locality,
                            studentName: childName,
                            schedule,
                            courtOrVenue: courtNumber,
                            feeInfo,
                            contactPhone: bk.centre?.phone || '9897012345',
                          })
                        }
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                        title="Download Booking Slip"
                      >
                        <DownloadSimple size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Ticket size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Active Bookings</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you book a free trial or enroll in a sports academy, your booking confirmation and reference number will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 bg-[#0066ff] text-white text-xs font-extrabold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Sparkle size={16} weight="fill" />
                <span>Explore Academies</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
