"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import {
  getAdminDashboardData,
  suspendParent,
  unsuspendParent,
  deleteParent,
} from '@/lib/actions';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Users,
  MagnifyingGlass,
  ArrowClockwise as ArrowsClockwise,
  Trash,
  MapPin,
  CheckCircle,
  WarningCircle,
  X,
  Prohibit,
  Baby,
} from '@phosphor-icons/react';

export default function AdminParentsRegistryPage() {
  const { showToast } = usePersona();
  const [parents, setParents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [filterSuspended, setFilterSuspended] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    parent: any | null;
  }>({
    isOpen: false,
    parent: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      setParents(res.parents || []);
    } catch (err) {
      console.error("Failed to load parents:", err);
      showToast("Error loading parent registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspend = (parent: any) => {
    startTransition(async () => {
      try {
        if (parent.isSuspended) {
          await unsuspendParent(parent.id);
          showToast(`Reactivated parent account: ${parent.fullName}`);
        } else {
          await suspendParent(parent.id, "Suspended by Admin");
          showToast(`Suspended parent account: ${parent.fullName}`);
        }
        loadData();
      } catch (err) {
        showToast("Failed to change suspension state");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.parent) return;
    const parentId = deleteModal.parent.id;
    const parentName = deleteModal.parent.fullName;

    startTransition(async () => {
      try {
        const res = await deleteParent(parentId);
        if (res.success) {
          showToast(`Deleted parent account: ${parentName}`);
          setDeleteModal({ isOpen: false, parent: null });
          loadData();
        } else {
          showToast("Failed to delete parent account");
        }
      } catch (err) {
        showToast("Error deleting parent profile");
      }
    });
  };

  const filtered = parents.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.locality.toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.phone && p.user.phone.includes(search));

    if (!matchesSearch) return false;
    if (filterSuspended === 'ACTIVE' && p.isSuspended) return false;
    if (filterSuspended === 'SUSPENDED' && !p.isSuspended) return false;

    return true;
  });

  const totalChildren = parents.reduce(
    (sum, p) => sum + (p.children?.length || 0),
    0
  );

  if (isLoading) {
    return <AdminTableSkeleton title="Parent & Student Registry" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <Users size={16} weight="fill" className="text-emerald-400" />
              Parent &amp; Student Registry
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Parent &amp; Family Profiles
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Inspect registered parents, enrolled children, free trial passes, and account statuses.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading || isPending}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh Parents</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Families
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{parents.length}</div>
            <span className="text-[11px] text-slate-500 font-medium">Registered Accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Enrolled Children
            </span>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {totalChildren}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Active youth profiles</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Active Parents
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {parents.filter((p) => !p.isSuspended).length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">In good standing</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Suspended Accounts
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {parents.filter((p) => p.isSuspended).length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Requires review</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search parent name, phone, locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterSuspended(tab)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  filterSuspended === tab
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All Profiles' : tab === 'ACTIVE' ? 'Active' : 'Suspended'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                  <th className="py-3.5 px-5">Parent &amp; Locality</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Children Profiles</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((parent) => (
                  <tr
                    key={parent.id}
                    className={`hover:bg-purple-50/20 transition-colors ${
                      parent.isSuspended ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center shrink-0">
                          {parent.fullName?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            {parent.fullName}
                            {parent.isSuspended && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
                                Suspended
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin size={11} className="text-red-500" />
                            <span>{parent.locality || parent.city || 'Verified Member'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-slate-600">
                      {parent.user?.phone || parent.emergencyContactPhone || 'Not provided'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(parent.children || []).map((ch: any) => (
                          <span
                            key={ch.id}
                            className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200"
                          >
                            {ch.fullName} ({ch.age}y)
                          </span>
                        ))}
                        {(!parent.children || parent.children.length === 0) && (
                          <span className="text-slate-400 text-[11px] italic">No children added</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(parent)}
                          disabled={isPending}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            parent.isSuspended
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={parent.isSuspended ? "Reactivate Account" : "Suspend Account"}
                        >
                          {parent.isSuspended ? (
                            <CheckCircle size={15} weight="bold" />
                          ) : (
                            <Prohibit size={15} weight="bold" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, parent })}
                          disabled={isPending}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer"
                          title="Delete Parent Account"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="font-bold">No parent profiles matched your search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Parent Profile"
          itemName={deleteModal.parent?.fullName}
          message="Are you sure you want to delete this parent account? All registered child profiles and booking history will be deleted."
          confirmText="Yes, Delete Parent"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, parent: null })}
        />
      </div>
    </div>
  );
}
