"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllClassModesAdmin,
  createClassMode,
  updateClassMode,
  deleteClassMode,
  toggleActiveClassMode,
  seedDefaultClassModesAction,
} from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  ClassModeItem,
  BADGE_COLOR_PALETTES,
  resolveClassModeInfo,
  getClassModeBadgeStyles,
} from '@/lib/class-modes';
import { getClassModeIconComponent } from '@/lib/class-modes-icons';
import {
  Laptop,
  Buildings,
  ArrowsClockwise,
  VideoCamera,
  ChalkboardTeacher,
  Globe,
  GraduationCap,
  Users,
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowCounterClockwise,
  Sparkle,
  Eye,
  Tag,
  Check,
  X,
  ArrowLeft,
  CaretRight,
} from '@phosphor-icons/react';

const AVAILABLE_ICONS = [
  { name: 'Buildings', label: 'In-Person / Campus', Icon: Buildings },
  { name: 'Laptop', label: 'Online / Virtual', Icon: Laptop },
  { name: 'ArrowsClockwise', label: 'Hybrid / Mixed', Icon: ArrowsClockwise },
  { name: 'VideoCamera', label: 'Live Video Call', Icon: VideoCamera },
  { name: 'ChalkboardTeacher', label: 'Instructor Led', Icon: ChalkboardTeacher },
  { name: 'Globe', label: 'Worldwide / Remote', Icon: Globe },
  { name: 'GraduationCap', label: 'Academic / Tutoring', Icon: GraduationCap },
  { name: 'Users', label: 'Group / Classroom', Icon: Users },
];

const AVAILABLE_COLORS: Array<{ key: string; label: string; swatch: string }> = [
  { key: 'slate', label: 'Slate Gray', swatch: 'bg-slate-700' },
  { key: 'emerald', label: 'Emerald Green', swatch: 'bg-emerald-600' },
  { key: 'blue', label: 'Royal Blue', swatch: 'bg-blue-600' },
  { key: 'indigo', label: 'Indigo Purple', swatch: 'bg-indigo-600' },
  { key: 'violet', label: 'Violet', swatch: 'bg-violet-600' },
  { key: 'amber', label: 'Amber Orange', swatch: 'bg-amber-500' },
  { key: 'rose', label: 'Rose Red', swatch: 'bg-rose-600' },
  { key: 'cyan', label: 'Cyan Sky', swatch: 'bg-cyan-600' },
];

export default function AdminClassModesPage() {
  const { showToast } = usePersona();
  const [modes, setModes] = useState<any[]>([]);
  const [totalCentres, setTotalCentres] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    item: any | null;
    label: string;
    slug: string;
    description: string;
    badgeColor: string;
    icon: string;
    order: number;
    isActive: boolean;
  }>({
    isOpen: false,
    mode: 'create',
    item: null,
    label: '',
    slug: '',
    description: '',
    badgeColor: 'blue',
    icon: 'Buildings',
    order: 1,
    isActive: true,
  });

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: any | null;
  }>({
    isOpen: false,
    item: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAllClassModesAdmin();
      if (res.success && res.modes) {
        setModes(res.modes);
        setTotalCentres(res.totalCentres || 0);
      } else {
        showToast(res.message || 'Failed to load class modes.');
      }
    } catch (err: any) {
      console.error('Failed to load class modes in admin:', err);
      showToast('Error loading delivery modes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      item: null,
      label: '',
      slug: '',
      description: '',
      badgeColor: 'emerald',
      icon: 'Laptop',
      order: modes.length + 1,
      isActive: true,
    });
  };

  const openEditModal = (item: any) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      item,
      label: item.label,
      slug: item.slug,
      description: item.description || '',
      badgeColor: item.badgeColor || 'blue',
      icon: item.icon || 'Buildings',
      order: item.order ?? 1,
      isActive: item.isActive !== false,
    });
  };

  const handleSaveMode = () => {
    if (!modalState.label.trim()) {
      showToast('⚠️ Please enter a label name for the delivery mode.');
      return;
    }

    startTransition(async () => {
      try {
        if (modalState.mode === 'create') {
          const res = await createClassMode({
            label: modalState.label.trim(),
            slug: modalState.slug.trim() || undefined,
            badgeColor: modalState.badgeColor,
            icon: modalState.icon,
            description: modalState.description.trim() || undefined,
            order: Number(modalState.order) || 1,
            isActive: modalState.isActive,
          });

          if (res.success) {
            showToast('✅ New delivery mode created successfully!');
            setModalState((prev) => ({ ...prev, isOpen: false }));
            loadData();
          } else {
            showToast(res.message || 'Could not create delivery mode.');
          }
        } else {
          if (!modalState.item?.id) return;
          const res = await updateClassMode(modalState.item.id, {
            label: modalState.label.trim(),
            slug: modalState.slug.trim(),
            badgeColor: modalState.badgeColor,
            icon: modalState.icon,
            description: modalState.description.trim(),
            order: Number(modalState.order) || 1,
            isActive: modalState.isActive,
          });

          if (res.success) {
            showToast('✅ Delivery mode updated successfully!');
            setModalState((prev) => ({ ...prev, isOpen: false }));
            loadData();
          } else {
            showToast(res.message || 'Could not update delivery mode.');
          }
        }
      } catch (err: any) {
        showToast('Error saving delivery mode.');
      }
    });
  };

  const handleToggleStatus = (item: any) => {
    startTransition(async () => {
      try {
        const nextStatus = !item.isActive;
        const res = await toggleActiveClassMode(item.id, nextStatus);
        if (res.success) {
          showToast(`✅ Mode "${item.label}" ${nextStatus ? 'activated' : 'deactivated'}.`);
          loadData();
        } else {
          showToast(res.message || 'Could not update status.');
        }
      } catch {
        showToast('Error toggling status.');
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteModal.item?.id) return;

    startTransition(async () => {
      try {
        const res = await deleteClassMode(deleteModal.item.id);
        if (res.success) {
          showToast(`🗑️ Delivery mode "${deleteModal.item.label}" deleted.`);
          setDeleteModal({ isOpen: false, item: null });
          loadData();
        } else {
          showToast(res.message || 'Could not delete delivery mode.');
        }
      } catch {
        showToast('Error deleting delivery mode.');
      }
    });
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset delivery modes to system defaults (Offline, Online, Hybrid)? Existing custom modes will not be destroyed.')) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await seedDefaultClassModesAction();
        if (res.success) {
          showToast('✅ Default delivery modes restored successfully!');
          loadData();
        } else {
          showToast(res.message || 'Failed to restore defaults.');
        }
      } catch {
        showToast('Error restoring default delivery modes.');
      }
    });
  };

  // Filtered list
  const filteredModes = useMemo(() => {
    return modes.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || m.label.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && m.isActive) ||
        (filterStatus === 'inactive' && !m.isActive);
      return matchSearch && matchStatus;
    });
  }, [modes, searchQuery, filterStatus]);

  const activeCount = modes.filter((m) => m.isActive).length;
  const inactiveCount = modes.length - activeCount;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 text-slate-900">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/admin" className="hover:text-emerald-600 transition-colors">
                Admin Dashboard
              </Link>
              <CaretRight size={12} weight="bold" className="text-slate-400" />
              <span>Platform</span>
              <CaretRight size={12} weight="bold" className="text-slate-400" />
              <span className="text-slate-900 font-bold">Class Delivery Modes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Laptop size={20} weight="bold" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Class Delivery Modes &amp; Badges
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Dynamically manage options available during coach registration (e.g. Offline, Online, Hybrid).
              These render as public verified badges across cards, homepage activities, and explore filters.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isPending}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Ensure default offline, online, hybrid modes exist"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>Restore Defaults</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus size={16} weight="bold" />
              <span>Add Delivery Mode</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Configured Modes
            </span>
            <div className="text-2xl font-black text-slate-900">{modes.length}</div>
            <p className="text-[10px] text-slate-500">Configured in database</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Active in Dropdowns
            </span>
            <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
            <p className="text-[10px] text-slate-500">Live for coaches &amp; public filters</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inactive / Hidden
            </span>
            <div className="text-2xl font-black text-slate-600">{inactiveCount}</div>
            <p className="text-[10px] text-slate-500">Excluded from registration form</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Academies Enrolled
            </span>
            <div className="text-2xl font-black text-blue-700">{totalCentres}</div>
            <p className="text-[10px] text-slate-500">Across verified institutes</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search mode name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer shrink-0 ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status} ({status === 'all' ? modes.length : status === 'active' ? activeCount : inactiveCount})
              </button>
            ))}
          </div>
        </div>

        {/* Content Table / Card Matrix */}
        {isLoading ? (
          <AdminTableSkeleton />
        ) : filteredModes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Laptop size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No delivery modes found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all'
                ? 'No options match your current search or filter query.'
                : 'No delivery modes configured yet. Click "Restore Defaults" to populate standard Offline, Online, and Hybrid modes.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
              >
                + Add First Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Mode / Display Name</th>
                    <th className="py-3.5 px-4">Public Badge Preview</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Academies</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredModes.map((item) => {
                    const Icon = getClassModeIconComponent(item.icon);
                    const styles = getClassModeBadgeStyles(item.badgeColor);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-400 text-xs">
                          #{item.order ?? 0}
                        </td>

                        {/* Mode Name & Slug */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.bg} ${styles.text}`}>
                              <Icon size={16} weight="bold" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm">{item.label}</div>
                              <div className="font-mono text-[10px] text-slate-400">slug: {item.slug}</div>
                            </div>
                          </div>
                        </td>

                        {/* Badge Preview */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs ${styles.bg} ${styles.text} ${styles.border}`}
                          >
                            <Icon size={13} weight="bold" />
                            <span>{item.label}</span>
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                          {item.description || <span className="text-slate-300 italic">No description</span>}
                        </td>

                        {/* Academies tagged */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full text-[11px]">
                            {item.academyCount ?? 0} academies
                          </span>
                        </td>

                        {/* Active toggle */}
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle active state in registration dropdown and filters"
                          >
                            {item.isActive ? (
                              <>
                                <Check size={12} weight="bold" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <X size={12} weight="bold" />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Edit Delivery Mode"
                            >
                              <PencilSimple size={15} weight="bold" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, item })}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                              title="Delete Mode"
                            >
                              <Trash size={15} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Delivery Mode Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Laptop size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {modalState.mode === 'create' ? 'Create New Delivery Mode' : 'Edit Delivery Mode'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Configure registration dropdown option, card badges &amp; search filters
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Live Badge Preview Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Live Public Badge Preview
              </span>
              <div className="flex items-center gap-3">
                {(() => {
                  const PreviewIcon = getClassModeIconComponent(modalState.icon);
                  const previewStyles = getClassModeBadgeStyles(modalState.badgeColor);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs ${previewStyles.bg} ${previewStyles.text} ${previewStyles.border}`}
                    >
                      <PreviewIcon size={14} weight="bold" />
                      <span>{modalState.label || 'Preview Label'}</span>
                    </span>
                  );
                })()}
                <span className="text-[11px] text-slate-400">
                  Visible on cards and exploration filters
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Mode Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Offline / Academy Premises, Online / Virtual, Hybrid"
                  value={modalState.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setModalState((prev) => ({
                      ...prev,
                      label: val,
                      slug: prev.mode === 'create' ? autoSlug : prev.slug,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Slug Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identifier Slug (URL / Database Key) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. offline, online, hybrid"
                  value={modalState.slug}
                  onChange={(e) =>
                    setModalState((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique identifier used in URLs, queries, and filters (e.g. ?mode=online)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Help Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical classroom or academy court training"
                  value={modalState.description}
                  onChange={(e) => setModalState((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Badge Color Swatch Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Badge Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = modalState.badgeColor === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setModalState((prev) => ({ ...prev, badgeColor: c.key }))}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.swatch}`} />
                        <span className="text-[11px] font-bold text-slate-700 truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Badge Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IconComp = ic.Icon;
                    const isSelected = modalState.icon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setModalState((prev) => ({ ...prev, icon: ic.name }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all gap-1 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                        title={ic.label}
                      >
                        <IconComp size={18} weight="bold" />
                        <span className="text-[10px] truncate max-w-full">{ic.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order & Active Switch */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={modalState.order}
                    onChange={(e) =>
                      setModalState((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalState((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      modalState.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {modalState.isActive ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}
                    <span>{modalState.isActive ? 'Active (Live)' : 'Inactive (Hidden)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMode}
                disabled={isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Saving...' : modalState.mode === 'create' ? 'Create Mode' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Delivery Mode"
          message={`Are you sure you want to delete the delivery mode "${deleteModal.item?.label}"? Any academies currently tagged with this format will automatically fallback to "offline".`}
          confirmText={isPending ? 'Deleting...' : 'Delete Mode'}
          variant="danger"
          isPending={isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal({ isOpen: false, item: null })}
        />
      )}
    </div>
  );
}
