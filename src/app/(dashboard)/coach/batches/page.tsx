"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachBatchesData, saveCoachBatch, deleteCoachBatch } from '@/lib/actions';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import {
  CalendarCheck,
  Plus,
  Clock,
  CurrencyInr,
  Users,
  Trash,
  PencilSimple,
  ArrowLeft,
  Spinner,
  X,
} from '@phosphor-icons/react';

export default function CoachBatchesPage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [centreData, setCentreData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [coachName, setCoachName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [ageGroup, setAgeGroup] = useState('6 - 14 Years');
  const [totalSeats, setTotalSeats] = useState('15');
  const [monthlyFee, setMonthlyFee] = useState('1800');

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = React.useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setDbError(null);
    try {
      const res = await getCoachBatchesData(userEmail);
      if (res.success) {
        setCentreData(res.centre);
        setBatches(res.batches || []);
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to load coach batches in CoachBatchesPage:', err);
      setDbError(err?.message || 'Unable to load batches. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    const defaultCat = (centreData?.categories && centreData.categories[0]) ||
      (centreData?.category ? centreData.category.split(',')[0].trim().toLowerCase() : 'badminton');
    setEditingBatchId(null);
    setName('');
    setCategory(defaultCat);
    setCoachName(centreData?.headCoachName || '');
    setSchedule('Mon, Wed, Fri • 4:00 PM - 5:15 PM');
    setAgeGroup('6 - 14 Years');
    setTotalSeats('15');
    setMonthlyFee('1800');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (batch: any) => {
    setEditingBatchId(batch.id);
    setName(batch.name);
    setCategory(batch.category || (centreData?.category ? centreData.category.split(',')[0].trim().toLowerCase() : 'badminton'));
    setCoachName(batch.coachName || '');
    setSchedule(batch.pureSchedule || batch.schedule);
    setAgeGroup(batch.ageGroup);
    setTotalSeats(String(batch.totalSeats));
    setMonthlyFee(String(batch.monthlyFee));
    setIsModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreData?.id) {
      showToast('⚠️ Please setup your academy profile first.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveCoachBatch(centreData.id, {
          id: editingBatchId || undefined,
          name: name.trim(),
          category: category.trim().toLowerCase(),
          coachName: coachName.trim() || undefined,
          schedule: schedule.trim(),
          ageGroup: ageGroup.trim(),
          totalSeats: parseInt(totalSeats, 10) || 15,
          monthlyFee: parseFloat(monthlyFee) || 0,
        });

        if (res.success && res.batch) {
          if (editingBatchId) {
            setBatches((prev) =>
              prev.map((b) => (b.id === editingBatchId ? res.batch : b))
            );
            showToast(`Updated batch ${res.batch.name}!`);
          } else {
            setBatches((prev) => [...prev, res.batch]);
            showToast(`✅ Created batch ${res.batch.name}!`);
          }
          setIsModalOpen(false);
        } else {
          showToast(res.message || 'Could not save batch');
        }
      } catch {
        showToast('Error saving batch');
      }
    });
  };

  const handleDeleteBatch = (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete batch: ${batchName}?`)) return;

    startTransition(async () => {
      try {
        const res = await deleteCoachBatch(batchId);
        if (res.success) {
          setBatches((prev) => prev.filter((b) => b.id !== batchId));
          showToast(`Deleted batch ${batchName}`);
        }
      } catch {
        showToast('Failed to delete batch');
      }
    });
  };

  const academyName =
    centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');

  if (loading) {
    return <GeneralCoachPageSkeleton title="Batch & Timings Management" />;
  }

  if (dbError) {
    return (
      <div className="w-full bg-slate-50 min-h-screen py-12 px-4 flex items-center justify-center">
        <DatabaseErrorView
          title="Unable to Load Batches"
          message="We are having trouble loading your coaching batches right now. Please try again."
          error={dbError}
          onRetry={loadData}
        />
      </div>
    );
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
                Batch &amp; Timings Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Schedules, Age Groups &amp; Monthly Fees • {academyName}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Create New Batch</span>
          </button>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Spinner size={32} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading coaching batches...</p>
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => {
              const enrolled = batch.bookings?.length || batch.seatsFilled || 0;
              const seats = batch.totalSeats || 15;
              const pct = Math.min(100, Math.round((enrolled / seats) * 100));

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base">{batch.name}</h3>
                          {batch.category && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              <span>{getCategoryEmoji(batch.category)}</span>
                              <span>{getCategoryDisplayName(batch.category)}</span>
                            </span>
                          )}
                        </div>
                        {batch.coachName && (
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            Assigned Coach: <strong className="text-slate-800">{batch.coachName}</strong>
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <Clock size={14} weight="bold" className="text-emerald-600" />
                          <span>{batch.pureSchedule || batch.schedule}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(batch)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100"
                          title="Edit Batch"
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch.id, batch.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-100"
                          title="Delete Batch"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-bold">AGE GROUP</span>
                        <span className="font-extrabold text-slate-800">{batch.ageGroup}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-bold">MONTHLY FEE</span>
                        <span className="font-extrabold text-slate-800">₹{Number(batch.monthlyFee)}/mo</span>
                      </div>
                    </div>

                    {/* Capacity Progress */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-600">Seats Occupied</span>
                        <span className="text-slate-900">
                          {enrolled} / {seats} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/coach/attendance"
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <CalendarCheck size={14} weight="bold" />
                      <span>Take Attendance</span>
                    </Link>

                    <span className="text-[10px] font-bold text-slate-400">
                      Admissions Open ✓
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CalendarCheck size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Batches Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Add your coaching batches so Agra parents can view your schedules, select time slots, and register for trial passes.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>Create Your First Batch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarCheck size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingBatchId ? 'Edit Coaching Batch' : 'Create Coaching Batch'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
              {/* Category Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sport / Activity Discipline *
                </label>
                {(() => {
                  const offered = centreData?.category
                    ? centreData.category.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
                    : ['badminton'];
                  return (
                    <select
                      value={category || offered[0] || 'badminton'}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 cursor-pointer"
                    >
                      {offered.map((cat: string) => (
                        <option key={cat} value={cat}>
                          {getCategoryEmoji(cat)} {getCategoryDisplayName(cat)}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Tennis (Evening)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Assigned Coach (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coach Rajesh Sharma"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Schedule &amp; Timings *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon, Wed, Fri • 4:00 PM - 5:15 PM"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Age Group *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6 - 14 Years"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    placeholder="e.g. 15"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Monthly Tuition Fee (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="e.g. 1800"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : editingBatchId ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
