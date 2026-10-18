"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import {
  getAdminDashboardData,
  createActivity,
  updateActivity,
  deleteActivity,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultActivitiesAndCategories,
} from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Palette,
  Plus,
  PencilSimple,
  Trash,
  Trophy,
  CheckCircle,
  ArrowsClockwise,
  X,
  FloppyDisk,
  Tag,
  Brain,
  Sparkle,
  Image as ImageIcon,
  MagnifyingGlass,
  Funnel,
  SquaresFour,
  Check,
  Lightning,
  FileArrowUp,
  LinkSimple,
} from '@phosphor-icons/react';

type AdminTab = 'activities' | 'categories';

export default function AdminCategoriesPage() {
  const { showToast } = usePersona();
  const [activeTab, setActiveTab] = useState<AdminTab>('activities');
  const [activities, setActivities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filter & Search states
  const [searchCategory, setSearchCategory] = useState('');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('all');

  // Activity Modal State
  const [activityModal, setActivityModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    item: any | null;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    icon: string;
    accentColor: string;
    order: number;
    isActive: boolean;
  }>({
    isOpen: false,
    mode: 'create',
    item: null,
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    icon: 'Trophy',
    accentColor: '#10B981',
    order: 0,
    isActive: true,
  });

  // Category Modal State
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    item: any | null;
    activityId: string;
    name: string;
    slug: string;
    shortDesc: string;
    imageUrl: string;
    icon: string;
    badge: string;
    order: number;
    isActive: boolean;
  }>({
    isOpen: false,
    mode: 'create',
    item: null,
    activityId: '',
    name: '',
    slug: '',
    shortDesc: '',
    imageUrl: '',
    icon: 'Sparkle',
    badge: 'Free Trial',
    order: 0,
    isActive: true,
  });

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'activity' | 'category';
    item: any | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'activity',
    item: null,
    title: '',
    message: '',
  });

  // Category Image Upload States
  const [catImageInputMode, setCatImageInputMode] = useState<'upload' | 'url'>('upload');
  const [catUploadedFileName, setCatUploadedFileName] = useState<string>('');
  const [isCompressingCatImage, setIsCompressingCatImage] = useState(false);
  const [isDraggingCatFile, setIsDraggingCatFile] = useState(false);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // Client-side high-resolution image compression
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((event.target?.result as string) || '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = (event.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCategoryImageFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    setCatUploadedFileName(file.name);
    setIsCompressingCatImage(true);
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.85);
      if (dataUrl) {
        setCategoryModal((prev) => ({ ...prev, imageUrl: dataUrl }));
        showToast(`Image "${file.name}" compressed and attached!`);
      } else {
        showToast('Failed to process image.');
      }
    } catch {
      showToast('Error processing uploaded image.');
    } finally {
      setIsCompressingCatImage(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      setActivities(res.activities || []);
      setCategories(res.categories || []);
    } catch (err) {
      console.error("Failed to load activities and categories:", err);
      showToast("Error loading taxonomy data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered categories list
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesActivity =
        selectedActivityFilter === 'all' || c.activityId === selectedActivityFilter;
      const q = searchCategory.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q) ||
        c.badge?.toLowerCase().includes(q) ||
        c.activity?.name?.toLowerCase().includes(q);
      return matchesActivity && matchesSearch;
    });
  }, [categories, selectedActivityFilter, searchCategory]);

  const [isSeeding, setIsSeeding] = useState(false);

  // Handlers for Activity
  const openCreateActivityModal = () => {
    setActivityModal({
      isOpen: true,
      mode: 'create',
      item: null,
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
      icon: 'Trophy',
      accentColor: '#10B981',
      order: activities.length + 1,
      isActive: true,
    });
  };

  const openEditActivityModal = (act: any) => {
    setActivityModal({
      isOpen: true,
      mode: 'edit',
      item: act,
      name: act.name || '',
      slug: act.slug || '',
      description: act.description || '',
      imageUrl: act.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
      icon: act.icon || 'Trophy',
      accentColor: act.accentColor || '#10B981',
      order: act.order ?? 0,
      isActive: act.isActive ?? true,
    });
  };

  const handleSaveActivity = () => {
    if (!activityModal.name.trim()) {
      showToast("Please provide Activity name");
      return;
    }
    const slug = activityModal.slug.trim() || activityModal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fallbackImage = "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80";
    const imageUrl = activityModal.imageUrl.trim() || fallbackImage;

    startTransition(async () => {
      try {
        if (activityModal.mode === 'create') {
          const res = await createActivity({
            name: activityModal.name,
            slug,
            description: activityModal.description,
            imageUrl,
            icon: activityModal.icon,
            accentColor: activityModal.accentColor,
            order: activityModal.order,
          });
          if (res.success) {
            showToast(res.message || `✅ Activity "${activityModal.name}" created!`);
            setActivityModal((prev) => ({ ...prev, isOpen: false }));
            await loadData();
          } else {
            showToast(res.message || "Failed to create activity");
          }
        } else if (activityModal.item) {
          const res = await updateActivity(activityModal.item.id, {
            name: activityModal.name,
            slug,
            description: activityModal.description,
            imageUrl,
            icon: activityModal.icon,
            accentColor: activityModal.accentColor,
            isActive: activityModal.isActive,
            order: activityModal.order,
          });
          if (res.success) {
            showToast(res.message || `✅ Activity "${activityModal.name}" updated!`);
            setActivityModal((prev) => ({ ...prev, isOpen: false }));
            await loadData();
          } else {
            showToast(res.message || "Failed to update activity");
          }
        }
      } catch (err: any) {
        showToast(err?.message || "Error processing activity");
      }
    });
  };

  // Handlers for Category
  const openCreateCategoryModal = (presetActivityId?: string) => {
    const defaultActId = presetActivityId || (activities.length > 0 ? activities[0]?.id : '');
    setCatImageInputMode('upload');
    setCatUploadedFileName('');
    setCategoryModal({
      isOpen: true,
      mode: 'create',
      item: null,
      activityId: defaultActId,
      name: '',
      slug: '',
      shortDesc: '',
      imageUrl: '',
      icon: 'Sparkle',
      badge: 'Free Trial',
      order: categories.length + 1,
      isActive: true,
    });
  };

  const openEditCategoryModal = (cat: any) => {
    setCatUploadedFileName('');
    setCatImageInputMode(cat.imageUrl && cat.imageUrl.startsWith('data:image') ? 'upload' : 'url');
    setCategoryModal({
      isOpen: true,
      mode: 'edit',
      item: cat,
      activityId: cat.activityId || (activities.length > 0 ? activities[0]?.id : ''),
      name: cat.name || '',
      slug: cat.slug || '',
      shortDesc: cat.shortDesc || '',
      imageUrl: cat.imageUrl || '',
      icon: cat.icon || 'Sparkle',
      badge: cat.badge || '',
      order: cat.order ?? 0,
      isActive: cat.isActive ?? true,
    });
  };

  const handleSaveCategory = () => {
    if (!categoryModal.name.trim()) {
      showToast("Please provide Category name");
      return;
    }
    const actId = categoryModal.activityId || (activities.length > 0 ? activities[0]?.id : '');
    if (!actId) {
      showToast("Please link to an Activity or create an Activity first");
      return;
    }
    const fallbackImage = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80";
    const imageUrl = categoryModal.imageUrl.trim() || fallbackImage;
    const slug = categoryModal.slug.trim() || categoryModal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    startTransition(async () => {
      try {
        if (categoryModal.mode === 'create') {
          const res = await createCategory({
            activityId: actId,
            name: categoryModal.name,
            slug,
            shortDesc: categoryModal.shortDesc,
            imageUrl,
            icon: categoryModal.icon,
            badge: categoryModal.badge,
            order: categoryModal.order,
          });
          if (res.success) {
            showToast(res.message || `✅ Category "${categoryModal.name}" created!`);
            setCategoryModal((prev) => ({ ...prev, isOpen: false }));
            await loadData();
          } else {
            showToast(res.message || "Failed to create category");
          }
        } else if (categoryModal.item) {
          const res = await updateCategory(categoryModal.item.id, {
            activityId: actId,
            name: categoryModal.name,
            slug,
            shortDesc: categoryModal.shortDesc,
            imageUrl,
            icon: categoryModal.icon,
            badge: categoryModal.badge,
            isActive: categoryModal.isActive,
            order: categoryModal.order,
          });
          if (res.success) {
            showToast(res.message || `✅ Category "${categoryModal.name}" updated!`);
            setCategoryModal((prev) => ({ ...prev, isOpen: false }));
            await loadData();
          } else {
            showToast(res.message || "Failed to update category");
          }
        }
      } catch (err: any) {
        showToast(err?.message || "Error processing category");
      }
    });
  };

  const handleSeedTaxonomy = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDefaultActivitiesAndCategories();
      if (res.success) {
        showToast(res.message);
        await loadData();
      } else {
        showToast(res.message || "Failed to seed default taxonomy");
      }
    } catch (err: any) {
      showToast(err?.message || "Error during seed operation");
    } finally {
      setIsSeeding(false);
    }
  };

  // Handlers for Delete
  const handleConfirmDelete = () => {
    if (!deleteModal.item) return;
    const item = deleteModal.item;

    startTransition(async () => {
      try {
        if (deleteModal.type === 'activity') {
          const res = await deleteActivity(item.id);
          if (res.success) {
            showToast(`Deleted activity "${item.name}"`);
            setDeleteModal((prev) => ({ ...prev, isOpen: false, item: null }));
            loadData();
          } else {
            showToast(res.message || "Failed to delete activity");
          }
        } else if (deleteModal.type === 'category') {
          const res = await deleteCategory(item.id);
          if (res.success) {
            showToast(`Deleted category "${item.name}"`);
            setDeleteModal((prev) => ({ ...prev, isOpen: false, item: null }));
            loadData();
          } else {
            showToast(res.message || "Failed to delete category");
          }
        }
      } catch (err) {
        showToast("Error deleting item");
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Activities & Categories Taxonomy" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0a1128] via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-extrabold uppercase mb-2">
              <Palette size={16} weight="fill" className="text-emerald-400" />
              Taxonomy Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Activities &amp; Categories
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Configure top-level Activities (Sports &amp; Athletics, Brain Booster &amp; STEM, Cultural &amp; Fine Arts) and link nested Categories with card images, badges, and display orders.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSeedTaxonomy}
              disabled={isSeeding || isLoading}
              className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-indigo-400/30 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Populate Supabase with Sports & Athletics, Brain Booster & STEM, Cultural & Fine Arts and 18 categories"
            >
              <Lightning size={16} weight="fill" className={isSeeding ? "animate-spin text-amber-300" : "text-amber-400"} />
              <span>{isSeeding ? "Seeding Taxonomy…" : "Seed 3 Major Activities & Categories"}</span>
            </button>

            {activeTab === 'activities' && (
              <button
                onClick={openCreateActivityModal}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={16} weight="bold" />
                <span>Add Activity</span>
              </button>
            )}

            {activeTab === 'categories' && (
              <button
                onClick={() => openCreateCategoryModal()}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={16} weight="bold" />
                <span>Add Category</span>
              </button>
            )}

            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh taxonomy"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'activities'
                  ? 'bg-[#0a1128] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Trophy size={16} weight="bold" />
              <span>Activities</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'activities'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-[#0a1128] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <SquaresFour size={16} weight="bold" />
              <span>Categories</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'categories'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {categories.length}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: ACTIVITIES MANAGEMENT
           ======================================================== */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Top-Level Activities ({activities.length})</span>
              <span>Changes reflect immediately in parent discovery filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((act) => {
                const linkedCount =
                  act.categories?.length ||
                  categories.filter((c) => c.activityId === act.id).length;
                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    {/* Activity Cover Image & Accent Header */}
                    <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                      {act.imageUrl ? (
                        <img
                          src={act.imageUrl}
                          alt={act.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white/50"
                          style={{ backgroundColor: act.accentColor || '#10B981' }}
                        >
                          <Trophy size={48} weight="duotone" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Floating Badge & Accent Pill */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border-2 border-white shadow-xs"
                          style={{ backgroundColor: act.accentColor || '#10B981' }}
                        />
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                          Order #{act.order}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                            act.isActive
                              ? 'bg-emerald-500/90 text-slate-950'
                              : 'bg-red-500/90 text-white'
                          }`}
                        >
                          {act.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Title on Image */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-extrabold text-white text-lg drop-shadow-sm">
                          {act.name}
                        </h3>
                        <p className="text-[11px] font-mono text-emerald-300">
                          slug: /{act.slug}
                        </p>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {act.description || 'No description provided.'}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <SquaresFour size={16} className="text-indigo-600" /> Linked Categories
                          </span>
                          <span className="font-extrabold text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                            {linkedCount} items
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedActivityFilter(act.id);
                            setActiveTab('categories');
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Manage Categories</span> →
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditActivityModal(act)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Activity"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'activity',
                                item: act,
                                title: `Delete "${act.name}"?`,
                                message: `Are you sure you want to delete this activity? All ${linkedCount} linked categories under it will also be deleted.`,
                              })
                            }
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Activity"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {activities.length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Trophy size={40} className="mx-auto text-slate-300" />
                <h4 className="font-extrabold text-slate-800 text-base">No Activities Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Add Activity" to configure your first activity pillar.
                </p>
                <button
                  onClick={openCreateActivityModal}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={14} weight="bold" />
                  <span>Create Activity</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CATEGORIES MANAGEMENT
           ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Categories Toolbar: Filter by Activity + Search */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 mr-2">
                  <Funnel size={14} /> Filter Activity:
                </span>
                <button
                  onClick={() => setSelectedActivityFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedActivityFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({categories.length})
                </button>
                {activities.map((act) => {
                  const count = categories.filter((c) => c.activityId === act.id).length;
                  return (
                    <button
                      key={act.id}
                      onClick={() => setSelectedActivityFilter(act.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedActivityFilter === act.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: act.accentColor || '#10B981' }}
                      />
                      <span>{act.name}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredCategories.map((cat) => {
                const parentAct =
                  activities.find((a) => a.id === cat.activityId) || cat.activity;
                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => ((e.target as any).src = 'https://placehold.co/400x300?text=No+Image')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Parent Activity Badge */}
                      {parentAct && (
                        <div className="absolute top-2 left-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md"
                            style={{ backgroundColor: parentAct.accentColor || '#10B981' }}
                          >
                            {parentAct.name}
                          </span>
                        </div>
                      )}

                      {/* Badge (e.g. Free Trial) */}
                      {cat.badge && (
                        <div className="absolute top-2 right-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-white text-slate-900 border border-white/60 shadow-2xs">
                            {cat.badge}
                          </span>
                        </div>
                      )}

                      {/* Title on lower edge */}
                      <div className="absolute bottom-1.5 left-2 right-2">
                        <h4 className="font-extrabold text-white text-xs drop-shadow-sm leading-tight line-clamp-1">
                          {cat.name}
                        </h4>
                      </div>
                    </div>

                    {/* Card Meta & Actions */}
                    <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="text-[10px] text-slate-500 font-mono">
                        /{cat.slug}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-bold">
                          Order #{cat.order}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                type: 'category',
                                item: cat,
                                title: `Delete "${cat.name}"?`,
                                message: `Are you sure you want to delete this category?`,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <SquaresFour size={40} className="mx-auto text-slate-300" />
                <h4 className="font-extrabold text-slate-800 text-base">No Categories Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No categories match your active filter. Click "Add Category" to create one.
                </p>
                <button
                  onClick={() => openCreateCategoryModal(selectedActivityFilter !== 'all' ? selectedActivityFilter : undefined)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={14} weight="bold" />
                  <span>Add First Category</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            MODAL 1: ADD / EDIT ACTIVITY
           ======================================================== */}
        {activityModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/60 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setActivityModal((prev) => ({ ...prev, isOpen: false }));
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Trophy size={18} className="text-emerald-600" />
                  <span>{activityModal.mode === 'create' ? 'Add Activity' : `Edit: ${activityModal.name}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActivityModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Activity Name:</label>
                  <input
                    type="text"
                    value={activityModal.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setActivityModal({
                        ...activityModal,
                        name,
                        ...(activityModal.mode === 'create' && {
                          slug: name.toLowerCase().replace(/\s+/g, '-'),
                        }),
                      });
                    }}
                    placeholder="e.g. Sports & Athletics, Brain Booster & STEM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL Slug:</label>
                    <input
                      type="text"
                      value={activityModal.slug}
                      onChange={(e) => setActivityModal({ ...activityModal, slug: e.target.value })}
                      placeholder="sports"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Display Order:</label>
                    <input
                      type="number"
                      value={activityModal.order}
                      onChange={(e) => setActivityModal({ ...activityModal, order: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Accent Color presets */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Accent Theme Color:</label>
                  <div className="flex items-center gap-2">
                    {['#10B981', '#6366F1', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setActivityModal({ ...activityModal, accentColor: color })}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          activityModal.accentColor === color ? 'scale-110 ring-2 ring-slate-800 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {activityModal.accentColor === color && <Check size={14} className="text-white" weight="bold" />}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={activityModal.accentColor}
                      onChange={(e) => setActivityModal({ ...activityModal, accentColor: e.target.value })}
                      className="w-24 p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-center ml-2"
                    />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cover Image URL:</label>
                  <input
                    type="text"
                    value={activityModal.imageUrl}
                    onChange={(e) => setActivityModal({ ...activityModal, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold">Quick Covers:</span>
                    {[
                      { label: 'Sports', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80' },
                      { label: 'STEM & Robotics', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Arts & Culture', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setActivityModal({ ...activityModal, imageUrl: p.url })}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {activityModal.imageUrl && (
                    <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={activityModal.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as any).src = 'https://placehold.co/600x400?text=Invalid+Image+URL')}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description:</label>
                  <textarea
                    rows={2}
                    value={activityModal.description}
                    onChange={(e) => setActivityModal({ ...activityModal, description: e.target.value })}
                    placeholder="Highlight what categories are included..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {activityModal.mode === 'edit' && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={activityModal.isActive}
                      onChange={(e) => setActivityModal({ ...activityModal, isActive: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span>Active in Discovery Directory</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivityModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveActivity}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>{activityModal.mode === 'create' ? 'Create Activity' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: ADD / EDIT CATEGORY (LINK TO ACTIVITY)
           ======================================================== */}
        {categoryModal.isOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xs bg-black/60 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setCategoryModal((prev) => ({ ...prev, isOpen: false }));
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-fade-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <SquaresFour size={18} className="text-indigo-600" />
                  <span>
                    {categoryModal.mode === 'create' ? 'Add New Category' : `Edit: ${categoryModal.name}`}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Parent Activity Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Link to Activity:
                  </label>
                  <select
                    value={categoryModal.activityId}
                    onChange={(e) => setCategoryModal({ ...categoryModal, activityId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="" disabled>Select activity...</option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name} (/{act.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category Name:</label>
                  <input
                    type="text"
                    value={categoryModal.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryModal({
                        ...categoryModal,
                        name,
                        ...(categoryModal.mode === 'create' && {
                          slug: name.toLowerCase().replace(/\s+/g, '-'),
                        }),
                      });
                    }}
                    placeholder="e.g. Badminton, Robotics & AI Lab, Kathak Dance"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Slug:</label>
                    <input
                      type="text"
                      value={categoryModal.slug}
                      onChange={(e) => setCategoryModal({ ...categoryModal, slug: e.target.value })}
                      placeholder="badminton"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Order #:</label>
                    <input
                      type="number"
                      value={categoryModal.order}
                      onChange={(e) => setCategoryModal({ ...categoryModal, order: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Badge / Tag with quick pills */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Card Pill Badge:</label>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {['Free Trial', 'Trending', 'Popular', 'Top Rated', 'Olympic Track'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCategoryModal({ ...categoryModal, badge: preset })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          categoryModal.badge === preset
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={categoryModal.badge}
                    onChange={(e) => setCategoryModal({ ...categoryModal, badge: e.target.value })}
                    placeholder="e.g. Free Trial or custom badge"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Cover Image Upload & URL Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-indigo-600" />
                      <span>Category Cover Image:</span>
                    </label>

                    {/* Mode Selector Tabs */}
                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setCatImageInputMode('upload')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          catImageInputMode === 'upload'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileArrowUp size={12} weight="bold" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatImageInputMode('url')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          catImageInputMode === 'url'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LinkSimple size={12} weight="bold" />
                        <span>Image URL</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: UPLOAD LOCAL IMAGE */}
                  {catImageInputMode === 'upload' && (
                    <div className="space-y-2">
                      <input
                        ref={catFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCategoryImageFileUpload(file);
                          e.target.value = '';
                        }}
                      />

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingCatFile(true);
                        }}
                        onDragLeave={() => setIsDraggingCatFile(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingCatFile(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleCategoryImageFileUpload(file);
                        }}
                        onClick={() => catFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                          isDraggingCatFile
                            ? 'border-indigo-500 bg-indigo-50/70 shadow-inner'
                            : categoryModal.imageUrl && categoryModal.imageUrl.startsWith('data:image')
                            ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60'
                            : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-indigo-400'
                        }`}
                      >
                        {isCompressingCatImage ? (
                          <div className="py-2 flex flex-col items-center gap-2">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-indigo-600">Compressing &amp; attaching image...</p>
                          </div>
                        ) : categoryModal.imageUrl && categoryModal.imageUrl.startsWith('data:image') ? (
                          <div className="flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 shadow-xs shrink-0">
                                <img
                                  src={categoryModal.imageUrl}
                                  alt="Uploaded preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                                  {catUploadedFileName || 'Image Uploaded & Ready'}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Click or drag a new image to replace
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryModal((prev) => ({ ...prev, imageUrl: '' }));
                                setCatUploadedFileName('');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remove image"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="py-2 space-y-1">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                              <FileArrowUp size={16} weight="bold" />
                            </div>
                            <p className="text-xs font-bold text-slate-700">
                              Drag &amp; drop an image here, or <span className="text-indigo-600 underline">browse</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              PNG, JPG, WebP (auto-compressed for fast loading)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: IMAGE URL */}
                  {catImageInputMode === 'url' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={categoryModal.imageUrl}
                        onChange={(e) => setCategoryModal({ ...categoryModal, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-... or /images/categories/..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold">Quick Presets:</span>
                        {[
                          { label: 'Tennis', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Table Tennis', url: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Badminton', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Cricket', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Handball', url: '/images/categories/handball.jpg' },
                          { label: 'Swimming', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Yoga', url: '/images/categories/yoga.jpg' },
                          { label: 'Shooting', url: '/images/categories/shooting.jpg' },
                          { label: 'Dance', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Tabla', url: '/images/categories/tabla.jpg' },
                          { label: 'Flute', url: '/images/categories/flute.jpg' },
                          { label: 'Mehandi', url: '/images/categories/mehandi.jpg' },
                          { label: 'Calligraphy', url: '/images/categories/calligraphy.jpg' },
                          { label: 'Baking', url: '/images/categories/baking.jpg' },
                          { label: 'Brain Gym', url: '/images/categories/brain-gym.jpg' },
                          { label: 'Handwriting', url: '/images/categories/handwriting.jpg' },
                          { label: 'Phonics', url: '/images/categories/phonics.jpg' },
                          { label: 'Matra Gyan', url: '/images/categories/matra-gyan.jpg' },
                          { label: 'Abacus', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80' },
                          { label: 'Robotics', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80' },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setCategoryModal({ ...categoryModal, imageUrl: p.url })}
                            className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200 cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover Image Preview (for non-data URLs) */}
                  {categoryModal.imageUrl && !categoryModal.imageUrl.startsWith('data:image') && (
                    <div className="mt-2 h-20 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                      <img
                        src={categoryModal.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as any).src = 'https://placehold.co/600x400?text=Invalid+Image+URL')}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setCategoryModal((prev) => ({ ...prev, imageUrl: '' }))}
                          className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/40 hover:bg-rose-900 cursor-pointer"
                        >
                          Clear Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Description:</label>
                  <textarea
                    rows={2}
                    value={categoryModal.shortDesc}
                    onChange={(e) => setCategoryModal({ ...categoryModal, shortDesc: e.target.value })}
                    placeholder="Brief description shown on card..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {categoryModal.mode === 'edit' && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={categoryModal.isActive}
                      onChange={(e) => setCategoryModal({ ...categoryModal, isActive: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Active in Discovery Grid</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>{categoryModal.mode === 'create' ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title={deleteModal.title || "Delete Item"}
          itemName={deleteModal.item?.name}
          message={deleteModal.message || "Are you sure you want to delete this item?"}
          confirmText="Yes, Delete"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, type: 'activity', item: null, title: '', message: '' })}
        />
      </div>
    </div>
  );
}
