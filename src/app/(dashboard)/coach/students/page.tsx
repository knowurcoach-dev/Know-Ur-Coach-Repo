"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachAttendanceData } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  ClipboardText,
  WhatsappLogo,
  Phone,
  User,
  ArrowLeft,
  Spinner,
  CalendarBlank,
  Users,
} from '@phosphor-icons/react';

export default function CoachStudentsPage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();

  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'enrolled' | 'trials'>('all');

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getCoachAttendanceData(userEmail);
        if (res.success) {
          setCentreData(res.centre);
          setBatches(res.batches || []);
        }
      } catch (err) {
        console.warn('Could not load students directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  // Aggregate all unique students across all batches
  const allStudents: any[] = [];
  const seenBookingIds = new Set<string>();

  for (const b of batches) {
    if (b.bookings) {
      for (const bk of b.bookings) {
        if (!seenBookingIds.has(bk.id)) {
          seenBookingIds.add(bk.id);
          allStudents.push({
            ...bk,
            batchName: b.name,
            batchSchedule: b.schedule,
          });
        }
      }
    }
  }

  const enrolledCount = allStudents.filter((st) => st.passType === 'MONTHLY_BATCH').length;
  const trialCount = allStudents.filter((st) => st.passType === 'FREE_TRIAL').length;

  const filteredStudents = allStudents.filter((st) => {
    if (batchFilter !== 'all' && st.batchId !== batchFilter) return false;
    if (typeFilter === 'enrolled' && st.passType !== 'MONTHLY_BATCH') return false;
    if (typeFilter === 'trials' && st.passType !== 'FREE_TRIAL') return false;
    return true;
  });

  const academyName =
    centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');

  if (loading) {
    return <GeneralCoachPageSkeleton title="Student & Trial Directory" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
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
                Student &amp; Trial Directory
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Active Student Roster &amp; Parent Emergency Contacts • {academyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1.5 rounded-2xl">
              {enrolledCount} Enrolled
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1.5 rounded-2xl">
              ⚡ {trialCount} Free Trials
            </span>
          </div>
        </div>

        {/* Filter Toolbar: Type Filter + Batch Filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Students ({allStudents.length})
              </button>
              <button
                onClick={() => setTypeFilter('enrolled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  typeFilter === 'enrolled'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-emerald-800'
                }`}
              >
                Enrolled ({enrolledCount})
              </button>
              <button
                onClick={() => setTypeFilter('trials')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  typeFilter === 'trials'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-amber-900'
                }`}
              >
                Free Trials ({trialCount})
              </button>
            </div>

            {/* Batch Filter Pills */}
            {batches.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setBatchFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    batchFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Batches
                </button>
                {batches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBatchFilter(b.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      batchFilter === b.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Students List or Clean Empty State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading student directory...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((st) => {
              const childName = st.child?.fullName || 'Student';
              const parentName = st.parent?.fullName || 'Parent';
              const parentPhone = (st.parent as any)?.phone || '9837000000';
              const cleanPhone = parentPhone.replace(/\D/g, '');
              const isTrial = st.passType === 'FREE_TRIAL';

              return (
                <div
                  key={st.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${isTrial ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'} text-white font-black text-lg flex items-center justify-center shadow-xs`}>
                        {childName[0]?.toUpperCase() || 'S'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-base truncate">{childName}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {st.child?.age ? `Age ${st.child.age}` : 'Student'} • {st.batchName}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <div className="text-slate-500 text-[11px] font-medium">Parent / Guardian:</div>
                      <div className="font-extrabold text-slate-800">{parentName}</div>
                      <div className="text-slate-500 font-medium">{parentPhone}</div>
                      <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60 font-mono">
                        Pass ID: <strong className="text-slate-800">{st.passId || (isTrial ? 'TRL-' : 'KUC-') + st.id.slice(-6)}</strong>
                        {isTrial && <span className="text-amber-700 font-sans ml-1 font-semibold">(1-Day Trial)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isTrial ? (
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        FREE TRIAL PASS
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ACTIVE ENROLLMENT
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(
                          parentName
                        )},%20this%20is%20${encodeURIComponent(
                          academyName
                        )}%20${isTrial ? 'following up on your Free Trial Pass for' : 'updating you on'}${encodeURIComponent(' ' + childName)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Message Parent on WhatsApp"
                      >
                        <WhatsappLogo size={16} weight="fill" />
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Call Parent"
                      >
                        <Phone size={15} weight="bold" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <ClipboardText size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Enrolled Students Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When students enroll in your academy batches through trial passes or direct admissions, their profiles and emergency contact info will be organized here.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/coach/leads"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <span>View Trial Inquiries</span>
              </Link>
              <Link
                href="/coach/batches"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                <span>Manage Batches</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
