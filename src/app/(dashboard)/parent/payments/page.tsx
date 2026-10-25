"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getParentDashboardData } from '@/lib/actions';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import { ParentBookingsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  CurrencyInr,
  ShieldCheck,
  CheckCircle,
  Clock,
  Spinner,
  DownloadSimple,
  Ticket,
  SealCheck,
  Sparkle,
} from '@phosphor-icons/react';

export default function ParentPaymentsPage() {
  const { user, session } = useAuth();
  const { showToast } = usePersona();

  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getParentDashboardData(userEmail);
        if (res.success) {
          setParentData(res.parent);
          setBookings(res.bookings || []);
        }
      } catch (err) {
        console.warn("Could not load payment data:", err);
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
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              <SealCheck size={14} weight="fill" className="text-blue-400" />
              Direct Academy Settlement Policy
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tuition &amp; Payment Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              KnowUrCoach does not collect or hold parental tuition fees. All tuition payments are made directly to the academy or head coach. Platform charges are 100% free for parents.
            </p>
          </div>

          {/* Zero Platform Fee Card */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 shrink-0 space-y-1 min-w-[200px]">
            <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={13} weight="fill" />
              Parent Guarantee
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              Zero Platform Fee
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              Direct Academy Settlement Only
            </div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transaction List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">Direct Tuition Records</h2>
                <span className="text-xs text-slate-500 font-medium">
                  {bookings.length} {bookings.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Loading records...</p>
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((bk) => {
                    const gross = Number(bk.grossAmount) || 0;
                    const paid = Number(bk.netAmountPaid) || 0;
                    const isTrial = bk.passType === 'FREE_TRIAL' || paid === 0;
                    const rawPass = bk.passId || `REF-${bk.id.slice(-6)}`;
                    const cleanRef = rawPass.startsWith('REF-') ? rawPass : rawPass.replace('KUC-PASS-', 'REF-');
                    const acadName = bk.centre?.name || bk.competition?.title || 'Coaching Academy';
                    const childName = bk.child?.fullName || 'Student';

                    const batchFee = bk.batch?.monthlyFee
                      ? Number(bk.batch.monthlyFee)
                      : (paid > 0 ? paid : (Number(bk.centre?.monthlyTuitionFee) || 0));

                    return (
                      <div
                        key={bk.id}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {acadName}
                            </span>
                            {isTrial ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle size={12} weight="fill" /> Free Trial • ₹0 Due
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck size={12} weight="fill" /> Direct Academy Settlement
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            Student: <strong className="text-slate-800">{childName}</strong> • Ref No: <strong className="font-mono text-blue-900">{cleanRef}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Booked on {new Date(bk.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right space-y-0.5">
                            <div className="font-black text-slate-900 text-base">
                              {isTrial ? 'Free Trial' : `₹${batchFee.toLocaleString('en-IN')}/mo`}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {isTrial ? 'No charges applied' : 'Payable directly to Academy'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              downloadBookingSlip({
                                bookingId: cleanRef,
                                referenceNo: cleanRef,
                                type: isTrial ? 'trial' : 'batch',
                                academyName: acadName,
                                locality: bk.centre?.locality,
                                studentName: childName,
                                schedule: bk.batch?.schedule,
                                courtOrVenue: bk.batch?.name,
                                feeInfo: isTrial ? 'Free Trial' : `₹${batchFee.toLocaleString('en-IN')}/month`,
                                contactPhone: bk.centre?.phone,
                              })
                            }
                            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Download Booking Slip"
                          >
                            <DownloadSimple size={15} weight="bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CurrencyInr size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Records Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you book free trials or enroll in monthly coaching batches, all booking slips and direct academy tuition records will be cataloged here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Transparency Info Card */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <SealCheck size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Direct Tuition Settlement</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  KnowUrCoach is a direct discovery and verification platform. We do not charge convenience fees, booking fees, or parental commissions.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>Free trial sessions require ₹0 payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>Pay coaching fees directly at academy desk / UPI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>Verified reference numbers for seat protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>Zero hidden platform charges for parents</span>
                </div>
              </div>

              <button
                onClick={() => showToast('All parental services on KnowUrCoach are 100% free with zero commission.')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Learn More About Parent Terms
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
