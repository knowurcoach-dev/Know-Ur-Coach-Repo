"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachAttendanceData, recordBatchAttendance } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  ArrowLeft,
  Spinner,
  Plus,
  Funnel,
  Sparkle,
} from '@phosphor-icons/react';

export default function CoachAttendancePage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'UNMARKED'>>({});

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

          // Initialize attendance states based on real records for today
          const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'UNMARKED'> = {};
          const today = new Date();
          for (const b of res.batches || []) {
            for (const bk of b.bookings || []) {
              const childId = bk.child?.id || bk.childId || bk.id;
              const key = `${b.id}_${childId}`;
              const todayAtt = bk.attendances?.find((a: any) => {
                const d = new Date(a.date);
                return (
                  d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate()
                );
              });
              if (todayAtt) {
                initialMap[key] = todayAtt.isPresent ? 'PRESENT' : 'ABSENT';
              } else {
                initialMap[key] = 'UNMARKED';
              }
            }
          }
          setAttendanceState(initialMap);
        }
      } catch (err) {
        console.warn('Could not load attendance data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  const handleSetAttendance = (
    batchId: string,
    childId: string,
    bookingId: string,
    newStatus: 'PRESENT' | 'ABSENT',
    childName: string
  ) => {
    const key = `${batchId}_${childId}`;
    setAttendanceState((prev) => ({ ...prev, [key]: newStatus }));

    startTransition(async () => {
      try {
        const res = await recordBatchAttendance({
          batchId,
          childId,
          bookingId,
          isPresent: newStatus === 'PRESENT',
        });
        if (res.success) {
          showToast(`✅ Marked ${childName} as ${newStatus}`);
        } else {
          showToast(res.message || 'Error updating attendance');
        }
      } catch {
        showToast('Error recording attendance');
      }
    });
  };

  const academyName =
    centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');

  const visibleBatches =
    selectedBatchId === 'all'
      ? batches
      : batches.filter((b) => b.id === selectedBatchId);

  // Overall aggregates
  const allBookings = batches.flatMap((b) => b.bookings || []);
  const totalEnrolled = allBookings.length;
  const totalCapacity = batches.reduce((acc, b) => acc + (b.totalSeats || 15), 0);

  if (loading) {
    return <GeneralCoachPageSkeleton title="Live Attendance Roster" />;
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
                Live Attendance Roster
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Daily Student Roll Call &amp; Batch Rosters • {academyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/coach/batches"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Manage Batches</span>
            </Link>
          </div>
        </div>

        {/* Global Attendance & Capacity KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Batches
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{batches.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active coaching sessions</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
              Enrolled Students
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">{totalEnrolled}</div>
            <div className="text-[11px] text-slate-500 font-medium">Across all batches</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
              Total Capacity
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalCapacity}</div>
            <div className="text-[11px] text-slate-500 font-medium">Available student seats</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
              Today&apos;s Status
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">Live</div>
            <div className="text-[11px] text-slate-500 font-medium">Roll call active</div>
          </div>
        </div>

        {/* Batch Filter Tabs */}
        {batches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 pl-2 pr-1">
              <Funnel size={14} weight="bold" /> Filter Batch:
            </span>
            <button
              onClick={() => setSelectedBatchId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedBatchId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Batches ({batches.length})
            </button>
            {batches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBatchId(b.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBatchId === b.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{b.name}</span>
                <span className="opacity-75 text-[10px]">({b.bookings?.length || 0})</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {batches.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CalendarCheck size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Batches Configured Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Add your coaching batches (timings, age groups, and seats) to begin logging student attendance rosters.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/coach/batches"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <Plus size={16} weight="bold" />
                <span>Create Academy Batch</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* List all batches matching visibleBatches */}
            {visibleBatches.map((batch) => {
              const enrolled = batch.bookings || [];
              const seatsFilledCount = enrolled.length;
              const totalSeats = batch.totalSeats || 15;

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  {/* Batch Header Bar */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                          <Clock size={14} weight="bold" />
                          <span>{batch.schedule}</span>
                        </span>
                        {batch.category && (
                          <span className="inline-flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <span>{getCategoryEmoji(batch.category)}</span>
                            <span>{getCategoryDisplayName(batch.category)}</span>
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-black">{batch.name}</h2>
                      <p className="text-xs text-slate-300">
                        Age Group: {batch.ageGroup || 'All Ages'} • Fee: ₹{Number(batch.monthlyFee) || 1800}/mo • Capacity:{' '}
                        <strong className="text-emerald-400">{seatsFilledCount}</strong> / {totalSeats} Students Enrolled
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 shrink-0">
                      <div className="text-center px-2">
                        <div className="text-xl font-black text-emerald-400">
                          {
                            enrolled.filter(
                              (b: any) => attendanceState[`${batch.id}_${b.child?.id || b.id}`] === 'PRESENT'
                            ).length
                          }
                        </div>
                        <div className="text-[10px] text-slate-300 font-bold uppercase">Present</div>
                      </div>
                      <div className="h-8 w-px bg-white/20" />
                      <div className="text-center px-2">
                        <div className="text-xl font-black text-rose-400">
                          {
                            enrolled.filter(
                              (b: any) => attendanceState[`${batch.id}_${b.child?.id || b.id}`] === 'ABSENT'
                            ).length
                          }
                        </div>
                        <div className="text-[10px] text-slate-300 font-bold uppercase">Absent</div>
                      </div>
                      <div className="h-8 w-px bg-white/20" />
                      <div className="text-center px-2">
                        <div className="text-xl font-black text-slate-300">
                          {
                            enrolled.filter(
                              (b: any) =>
                                !attendanceState[`${batch.id}_${b.child?.id || b.id}`] ||
                                attendanceState[`${batch.id}_${b.child?.id || b.id}`] === 'UNMARKED'
                            ).length
                          }
                        </div>
                        <div className="text-[10px] text-slate-300 font-bold uppercase">Pending</div>
                      </div>
                    </div>
                  </div>

                  {/* Batch Students Roster */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-900">
                        Enrolled Students ({enrolled.length})
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Roll call updates sync in real-time
                      </span>
                    </div>

                    {enrolled.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {enrolled.map((bk: any) => {
                          const child = bk.child;
                          const childId = child?.id || bk.id;
                          const childName = child?.fullName || 'Student';
                          const key = `${batch.id}_${childId}`;
                          const currentStatus = attendanceState[key] || 'UNMARKED';
                          const isPresent = currentStatus === 'PRESENT';
                          const isAbsent = currentStatus === 'ABSENT';

                          return (
                            <div
                              key={bk.id}
                              className="py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                                  {childName[0]?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                                    <span>{childName}</span>
                                    {child?.age && (
                                      <span className="text-[11px] font-normal text-slate-400">
                                        ({child.age} yrs)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Parent: {bk.parent?.fullName || 'Parent'} • Pass ID:{' '}
                                    <strong className="text-slate-700 font-mono">
                                      {bk.passId || 'KUC-' + bk.id.slice(-6)}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {currentStatus === 'UNMARKED' && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                                    Roll call pending
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetAttendance(batch.id, childId, bk.id, 'PRESENT', childName)
                                  }
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isPresent
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent'
                                  }`}
                                >
                                  <CheckCircle size={15} weight="fill" />
                                  <span>Present</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetAttendance(batch.id, childId, bk.id, 'ABSENT', childName)
                                  }
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isAbsent
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent'
                                  }`}
                                >
                                  <XCircle size={15} weight="fill" />
                                  <span>Absent</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-1.5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users size={28} className="mx-auto text-slate-400" />
                        <p className="text-xs text-slate-600 font-bold">
                          No students currently enrolled in this batch.
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          When parents book monthly sessions for this batch, they will appear here automatically with digital passes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
