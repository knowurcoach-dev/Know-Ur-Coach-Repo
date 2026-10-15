"use client";

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminDashboardData,
  createCompetition,
  deleteCompetition,
} from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Trophy,
  Plus,
  Trash,
  MapPin,
  CalendarBlank,
  CurrencyInr,
  ArrowsClockwise,
  X,
  FloppyDisk,
  Medal,
  Users,
} from '@phosphor-icons/react';

export default function AdminCompetitionsPage() {
  const { showToast } = usePersona();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [createModal, setCreateModal] = useState({
    isOpen: false,
    title: '',
    sport: 'Cricket',
    category: 'sports',
    organizer: 'District Sports Association',
    dates: 'Nov 14 - Nov 18, 2026',
    timing: '8:00 AM - 5:00 PM',
    venue: 'Eklavya Stadium, Sadar Bazar',
    locality: 'Sadar Bazar',
    registrationFee: 500,
    ageDivisions: 'Under-14 & Under-17',
    prizePool: '₹25,000 Cash + Trophies & State Certificates',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    competition: any | null;
  }>({
    isOpen: false,
    competition: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      setCompetitions(res.competitions || []);
    } catch (err) {
      console.error("Failed to load competitions:", err);
      showToast("Error loading tournaments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCompetition = () => {
    if (!createModal.title.trim()) {
      showToast("Please provide tournament title");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCompetition({
          title: createModal.title,
          sport: createModal.sport,
          category: createModal.category,
          organizer: createModal.organizer,
          dates: createModal.dates,
          timing: createModal.timing,
          venue: createModal.venue,
          locality: createModal.locality,
          registrationFee: Number(createModal.registrationFee),
          ageDivisions: createModal.ageDivisions,
          prizePool: createModal.prizePool,
        });

        if (res.success) {
          showToast(`🏆 Created tournament "${createModal.title}"`);
          setCreateModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } else {
          showToast("Failed to create tournament");
        }
      } catch (err) {
        showToast("Error saving tournament");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.competition) return;
    const comp = deleteModal.competition;
    startTransition(async () => {
      try {
        const res = await deleteCompetition(comp.id);
        if (res.success) {
          showToast(`Deleted tournament ${comp.title}`);
          setDeleteModal({ isOpen: false, competition: null });
          loadData();
        } else {
          showToast("Failed to delete tournament");
        }
      } catch (err) {
        showToast("Error deleting tournament");
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Youth Tournaments & Competitions" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <Trophy size={16} weight="fill" className="text-amber-400" />
              Tournament Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Youth Tournaments &amp; Competitions
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Publish and manage inter-academy tournaments, prize pools, age divisions, and tournament passes for youth athletes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: true }))}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Host New Tournament</span>
            </button>
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <Trophy size={48} weight="fill" className="text-amber-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No active tournaments scheduled
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Host a youth competition in cricket, swimming, football, or badminton for aspiring athletes.
              </p>
            </div>
          ) : (
            competitions.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-amber-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900">
                      {comp.sport}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      Entry: ₹{Number(comp.registrationFee)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Org: <strong className="text-slate-700">{comp.organizer}</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-600 space-y-2 border border-slate-100">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <CalendarBlank size={14} weight="bold" className="text-purple-600 shrink-0" />
                      <span>{comp.dates}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} weight="bold" className="text-red-500 shrink-0" />
                      <span className="truncate">{comp.venue}, {comp.locality}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50/80 p-2 rounded-xl">
                      <Medal size={14} weight="fill" className="text-amber-500 shrink-0" />
                      <span className="truncate">{comp.prizePool}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                    <Users size={13} weight="bold" />
                    {comp.ageDivisions}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDeleteModal({ isOpen: true, competition: comp })}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Tournament"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Tournament Modal */}
        {createModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setCreateModal((prev) => ({ ...prev, isOpen: false }));
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={22} weight="fill" className="text-amber-500" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Host New Youth Tournament
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Tournament Title:</label>
                  <input
                    type="text"
                    value={createModal.title}
                    onChange={(e) => setCreateModal({ ...createModal, title: e.target.value })}
                    placeholder="e.g. Taj City Youth Cricket Cup 2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport / Discipline:</label>
                  <input
                    type="text"
                    value={createModal.sport}
                    onChange={(e) => setCreateModal({ ...createModal, sport: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Organizer:</label>
                  <input
                    type="text"
                    value={createModal.organizer}
                    onChange={(e) => setCreateModal({ ...createModal, organizer: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dates:</label>
                  <input
                    type="text"
                    value={createModal.dates}
                    onChange={(e) => setCreateModal({ ...createModal, dates: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration Fee (₹):</label>
                  <input
                    type="number"
                    value={createModal.registrationFee}
                    onChange={(e) => setCreateModal({ ...createModal, registrationFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Venue Location:</label>
                  <input
                    type="text"
                    value={createModal.venue}
                    onChange={(e) => setCreateModal({ ...createModal, venue: e.target.value })}
                    placeholder="e.g. Major Sports Complex, Central Arena"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Prize Pool & Rewards:</label>
                  <input
                    type="text"
                    value={createModal.prizePool}
                    onChange={(e) => setCreateModal({ ...createModal, prizePool: e.target.value })}
                    placeholder="₹25,000 Cash + Certificates & Trophies"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompetition}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>Publish Tournament</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Tournament"
          itemName={deleteModal.competition?.title}
          message="Are you sure you want to delete this tournament fixture? Registered parent passes and slots will be cancelled."
          confirmText="Yes, Delete Tournament"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, competition: null })}
        />
      </div>
    </div>
  );
}
