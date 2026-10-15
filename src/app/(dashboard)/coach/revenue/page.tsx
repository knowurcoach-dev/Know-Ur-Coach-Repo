"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachRevenueData } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  CurrencyInr,
  Users,
  TrendUp,
  ChartPieSlice,
  ArrowLeft,
  CalendarCheck,
  Clock,
  Sparkle,
  CheckCircle,
  Plus,
} from '@phosphor-icons/react';

export default function CoachRevenuePage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getCoachRevenueData(userEmail);
        if (res.success) {
          setRevenueData(res);
        }
      } catch (err) {
        console.warn('Could not load revenue data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  const academyName =
    revenueData?.centre?.name ||
    (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');

  const monthlyRevenue = revenueData?.monthlyEstimatedRevenue || 0;
  const annualRevenue = revenueData?.annualProjectedRevenue || 0;
  const totalEnrolled = revenueData?.totalEnrolledStudents || 0;
  const totalCapacity = revenueData?.totalCapacity || 0;
  const utilizationPct = revenueData?.capacityUtilizationPct || 0;
  const batchesSummary = revenueData?.batchesSummary || [];
  const recentAdmissions = revenueData?.recentAdmissions || [];

  if (loading) {
    return <GeneralCoachPageSkeleton title="Estimated Revenue & Admissions Analytics" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with Back button */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/dashboard"
              className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Estimated Revenue &amp; Admissions Analytics
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Student Tuition Projections &amp; Batch Capacity Metrics • {academyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/coach/batches"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Manage Batches</span>
            </Link>
          </div>
        </div>

        {/* Direct Fee Collection Notice Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 rounded-3xl p-5 sm:p-6 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkle size={20} weight="fill" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-blue-950">
              Direct Academy Tuition Settlement
            </h3>
            <p className="text-xs text-blue-800/90 leading-relaxed font-medium">
              KnowUrCoach connects you with parents and delivers verified trial bookings and student admissions. Coaching tuition fees are collected <strong>directly by your academy</strong> from parents (via UPI, Bank Transfer, or Cash) with zero platform commission deductions. Below is your real-time estimated revenue based on enrolled batch capacities.
            </p>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CurrencyInr size={14} weight="bold" />
              <span>Est. Monthly Tuition</span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              ₹{monthlyRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              From {totalEnrolled} currently enrolled students
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <TrendUp size={14} weight="bold" />
              <span>Annual Projection</span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              ₹{annualRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              12-month projected tuition pipeline
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} weight="bold" />
              <span>Active Students</span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {totalEnrolled}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Across {batchesSummary.length} coaching batches
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
              <ChartPieSlice size={14} weight="bold" />
              <span>Capacity Utilization</span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {utilizationPct}%
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {totalEnrolled} / {totalCapacity} total available seats
            </div>
          </div>
        </div>

        {/* Batch-Wise Capacity & Revenue Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Batch Capacity &amp; Revenue Projection
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Breakdown of active batches, enrolled students, and monthly tuition earnings
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {batchesSummary.length} Total Batches
            </span>
          </div>

          {batchesSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Batch Name</th>
                    <th className="py-3 px-3">Schedule</th>
                    <th className="py-3 px-3">Monthly Fee</th>
                    <th className="py-3 px-3">Enrolled Seats</th>
                    <th className="py-3 px-3">Est. Monthly Revenue</th>
                    <th className="py-3 px-3">Full Capacity Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {batchesSummary.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 text-sm">{b.name}</div>
                        <div className="text-[11px] text-slate-400">{b.ageGroup || 'All Ages'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-semibold">
                        {b.schedule}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        ₹{b.monthlyFee.toLocaleString('en-IN')}/mo
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {b.enrolledCount} / {b.capacity}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              b.enrolledCount > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {b.utilizationPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-emerald-700 text-sm">
                        ₹{b.estimatedRevenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">
                        ₹{b.maxPossibleRevenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <CalendarCheck size={32} className="mx-auto text-slate-400" />
              <p className="text-xs text-slate-500 font-bold">No batches created yet.</p>
              <Link
                href="/coach/batches"
                className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:underline"
              >
                <Plus size={14} weight="bold" /> Create Your First Batch
              </Link>
            </div>
          )}
        </div>

        {/* Recent Admissions & Student Enrollment Ledger */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Recent Student Admissions
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Confirmed student bookings and active admission passes
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {recentAdmissions.length} Total Admissions
            </span>
          </div>

          {recentAdmissions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentAdmissions.map((adm: any) => {
                const isTrial = adm.passType === 'FREE_TRIAL';
                return (
                  <div
                    key={adm.id}
                    className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                        {adm.studentName[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {adm.studentName}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              isTrial
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isTrial ? 'Free Trial' : 'Enrolled'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Parent: {adm.parentName} • Batch: {adm.batchName} • Pass ID:{' '}
                          <strong className="text-slate-700 font-mono">{adm.passId}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {isTrial ? 'Free Trial' : `₹${adm.monthlyFee.toLocaleString('en-IN')}/mo`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(adm.enrolledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="text-xs text-slate-500 font-medium">
                No student admissions logged yet.
              </p>
              <p className="text-[11px] text-slate-400">
                When parents enroll their children into your monthly batches, admission details and projected fees will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
