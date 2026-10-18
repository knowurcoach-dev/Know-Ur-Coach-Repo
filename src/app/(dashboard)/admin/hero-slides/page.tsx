"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  seedDefaultHeroSlides,
  getHeroCarouselThemeAction,
} from '@/lib/actions';
import { HeroSlideData, DEFAULT_HERO_SLIDES } from '@/lib/hero-slides';
import {
  HeroCarouselTheme,
  DEFAULT_HERO_CAROUSEL_THEME,
  getHeroOverlayGradient,
  hexToRgba,
} from '@/lib/hero-theme';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import {
  Sparkle,
  Plus,
  PencilSimple,
  Trash,
  ArrowsClockwise,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  CheckCircle,
  X,
  FloppyDisk,
  Image as ImageIcon,
  LinkSimple,
  Megaphone,
  Slideshow,
  ArrowRight,
  TextT,
  CursorClick,
  Tag,
  MagnifyingGlass,
  Check,
  Palette,
  FileArrowUp,
} from '@phosphor-icons/react';

const IMAGE_PRESETS = [
  { label: '🏃 Kids Sports & Track', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1400&auto=format&fit=crop' },
  { label: '🤖 STEM & Robotics Lab', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1400&auto=format&fit=crop' },
  { label: '💃 Classical & Western Dance', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1400&auto=format&fit=crop' },
  { label: '🎾 Tennis & Racquet Arena', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop' },
  { label: '🏊 Olympic Swimming Pool', url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1400&auto=format&fit=crop' },
  { label: '🥋 Martial Arts & Taekwondo', url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1400&auto=format&fit=crop' },
  { label: '🎨 Fine Arts & Sketching', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1400&auto=format&fit=crop' },
  { label: '🏸 Badminton Wooden Court', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1400&auto=format&fit=crop' },
];

const GRADIENT_PRESETS = [
  { label: 'Ocean Emerald', value: 'from-blue-600 via-indigo-600 to-emerald-600' },
  { label: 'Cosmic Violet', value: 'from-purple-600 via-pink-600 to-amber-500' },
  { label: 'Sunset Glow', value: 'from-rose-500 via-orange-500 to-amber-500' },
  { label: 'Forest Mint', value: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { label: 'Midnight Indigo', value: 'from-indigo-600 via-blue-600 to-violet-600' },
];

export default function AdminHeroSlidesPage() {
  const { showToast } = usePersona();
  const [slides, setSlides] = useState<HeroSlideData[]>([]);
  const [carouselTheme, setCarouselTheme] = useState<HeroCarouselTheme>(DEFAULT_HERO_CAROUSEL_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideData | null>(null);

  // Form Fields with element texts & visibility toggles
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: '',
    imageUrl: '',
    ctaText: 'Explore Activities',
    ctaLink: '/activities',
    secondaryCtaText: 'Book Free Trial',
    secondaryCtaLink: '/activities',
    accentGradient: 'from-blue-600 via-indigo-600 to-emerald-600',
    order: 1,
    isActive: true,
    showBadge: true,
    showTitle: true,
    showSubtitle: true,
    showPrimaryCta: true,
    showSecondaryCta: true,
  });

  // Image Upload & Source States
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const [dbError, setDbError] = useState<string | null>(null);

  // Client-side high-resolution image compression for crisp hero banners
  const compressImageFile = (file: File, maxDim = 1920, quality = 0.85): Promise<string> => {
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

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please upload a valid image file (PNG, JPG, WebP, AVIF)');
      return;
    }
    setIsCompressingImage(true);
    try {
      const dataUrl = await compressImageFile(file, 1920, 0.85);
      if (dataUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        setUploadedFileName(file.name);
        showToast(`📸 Attached: ${file.name}`);
      } else {
        showToast('⚠️ Could not process image file.');
      }
    } catch {
      showToast('⚠️ Failed to load image file.');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const loadSlides = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [res, themeRes] = await Promise.all([
        getAdminHeroSlides(),
        getHeroCarouselThemeAction(),
      ]);
      if (res.success && res.slides) {
        setSlides(res.slides);
      } else {
        setSlides([]);
      }
      if (themeRes.success && themeRes.theme) {
        setCarouselTheme(themeRes.theme);
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to load hero slides in AdminHeroSlidesPage:', err);
      setDbError(err?.message || 'Database connection error: Failed to load hero slides.');
      setSlides([]);
      showToast('Error loading hero slides from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const openCreateModal = () => {
    setEditingSlide(null);
    setUploadedFileName('');
    setImageInputMode('upload');
    setFormData({
      title: '',
      subtitle: '',
      badge: "India's Verified Kids Coaching Network",
      imageUrl: '',
      ctaText: 'Explore Activities',
      ctaLink: '/activities',
      secondaryCtaText: 'Book Free Trial',
      secondaryCtaLink: '/activities',
      accentGradient: GRADIENT_PRESETS[0].value,
      order: slides.length + 1,
      isActive: true,
      showBadge: true,
      showTitle: true,
      showSubtitle: true,
      showPrimaryCta: true,
      showSecondaryCta: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlideData) => {
    setEditingSlide(slide);
    if (slide.imageUrl?.startsWith('data:image')) {
      setImageInputMode('upload');
      setUploadedFileName('Custom Uploaded Image');
    } else {
      setImageInputMode('url');
      setUploadedFileName('');
    }
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      badge: slide.badge || '',
      imageUrl: slide.imageUrl,
      ctaText: slide.ctaText || 'Explore Activities',
      ctaLink: slide.ctaLink || '/activities',
      secondaryCtaText: slide.secondaryCtaText || 'Book Free Trial',
      secondaryCtaLink: slide.secondaryCtaLink || '/activities',
      accentGradient: slide.accentGradient || GRADIENT_PRESETS[0].value,
      order: slide.order,
      isActive: slide.isActive,
      showBadge: slide.showBadge !== false,
      showTitle: slide.showTitle !== false,
      showSubtitle: slide.showSubtitle !== false,
      showPrimaryCta: slide.showPrimaryCta !== false,
      showSecondaryCta: slide.showSecondaryCta !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.showTitle && !formData.title.trim()) {
      showToast('⚠️ Please enter a slide headline/title');
      return;
    }
    if (!formData.imageUrl?.trim()) {
      showToast('⚠️ Please upload an image file or provide an image URL');
      return;
    }

    startTransition(async () => {
      try {
        if (editingSlide?.id) {
          const res = await updateHeroSlide(editingSlide.id, formData);
          if (res.success) {
            showToast('✅ Slide updated successfully!');
            setIsModalOpen(false);
            loadSlides();
          } else {
            showToast(res.message || 'Failed to update slide');
          }
        } else {
          const res = await createHeroSlide(formData);
          if (res.success) {
            showToast('🎉 New hero slide created successfully!');
            setIsModalOpen(false);
            loadSlides();
          } else {
            showToast(res.message || 'Failed to create slide');
          }
        }
      } catch (err: any) {
        showToast(err.message || 'Error saving slide');
      }
    });
  };

  const handleToggleActive = (slide: HeroSlideData) => {
    if (!slide.id) return;
    startTransition(async () => {
      try {
        const res = await updateHeroSlide(slide.id!, { isActive: !slide.isActive });
        if (res.success) {
          setSlides((prev) =>
            prev.map((s) => (s.id === slide.id ? { ...s, isActive: !s.isActive } : s))
          );
          showToast(slide.isActive ? 'Slide deactivated' : 'Slide activated');
        }
      } catch (err) {
        showToast('Error updating slide status');
      }
    });
  };

  const handleToggleField = (
    slide: HeroSlideData,
    field: 'showBadge' | 'showTitle' | 'showSubtitle' | 'showPrimaryCta' | 'showSecondaryCta',
    fieldName: string
  ) => {
    if (!slide.id) return;
    const currentVal = slide[field] !== false;
    const newVal = !currentVal;
    startTransition(async () => {
      try {
        const res = await updateHeroSlide(slide.id!, { [field]: newVal });
        if (res.success) {
          setSlides((prev) =>
            prev.map((s) => (s.id === slide.id ? { ...s, [field]: newVal } : s))
          );
          showToast(`${fieldName}: ${newVal ? 'Visible' : 'Hidden'}`);
        } else {
          showToast(res.message || 'Failed to update visibility');
        }
      } catch (err) {
        showToast('Error updating visibility');
      }
    });
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Reassign order indices
    const updatedOrders = newSlides.map((s, idx) => ({ id: s.id!, order: idx + 1 }));
    setSlides(newSlides.map((s, idx) => ({ ...s, order: idx + 1 })));

    startTransition(async () => {
      try {
        const res = await reorderHeroSlides(updatedOrders);
        if (res.success) {
          showToast('Order updated');
        }
      } catch (err) {
        showToast('Error saving reordered slides');
        loadSlides();
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteModal.id) return;
    startTransition(async () => {
      try {
        const res = await deleteHeroSlide(deleteModal.id);
        if (res.success) {
          showToast('🗑️ Slide deleted successfully');
          setDeleteModal({ isOpen: false, id: '', title: '' });
          loadSlides();
        } else {
          showToast(res.message || 'Failed to delete slide');
        }
      } catch (err) {
        showToast('Error deleting slide');
      }
    });
  };

  const handleResetDefaults = () => {
    startTransition(async () => {
      try {
        const res = await seedDefaultHeroSlides();
        if (res.success) {
          showToast('🔄 Reset to default curated slides');
          loadSlides();
        } else {
          showToast(res.message || 'Failed to reset slides');
        }
      } catch (err) {
        showToast('Error resetting slides');
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Hero Carousel Management" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-extrabold uppercase mb-2">
              <Slideshow size={16} weight="fill" className="text-emerald-400" />
              Homepage Presentation &amp; Marketing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hero Carousel Management
            </h1>
            <p className="text-sm text-blue-200 mt-1 max-w-2xl">
              Control the homepage carousel slides: toggle visibility of badges, titles, subtitles, and buttons. Customize exact text, call-to-actions, and high-resolution imagery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/theme#hero-carousel"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Palette size={16} weight="fill" />
              <span>Theme, Overlay &amp; Font Styling</span>
            </Link>

            <button
              onClick={handleResetDefaults}
              disabled={isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Reset to default curated slides"
            >
              <ArrowsClockwise size={14} className={isPending ? 'animate-spin' : ''} />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Add New Slide</span>
            </button>
          </div>
        </div>

        {/* Carousel Overview & Slide Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Active Slides</span>
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-black">
                {slides.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Click any element toggle (Pill, Title, Subtitle, Buttons) to turn visibility on or off instantly
            </span>
          </div>

          {dbError ? (
            <div className="py-6">
              <DatabaseErrorView
                title="Unable to Load Slides"
                message="We are having trouble loading hero slides right now. Please try again."
                error={dbError}
                onRetry={loadSlides}
              />
            </div>
          ) : slides.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                <Slideshow size={32} weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Hero Slides Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active hero slides found in the database. Add customized slides or click &quot;Reset Defaults&quot; to seed standard slides into PostgreSQL.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                <span>Create First Slide</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {slides.map((slide, index) => {
                const showBadge = slide.showBadge !== false;
                const showTitle = slide.showTitle !== false;
                const showSubtitle = slide.showSubtitle !== false;
                const showPrimaryCta = slide.showPrimaryCta !== false;
                const showSecondaryCta = slide.showSecondaryCta !== false;

                return (
                  <div
                    key={slide.id || index}
                    className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md overflow-hidden ${
                      slide.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-stretch">
                      {/* Visual Slide Image Thumbnail */}
                      <div className="relative w-full md:w-72 h-48 md:h-auto shrink-0 bg-slate-900 overflow-hidden">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="bg-black/70 backdrop-blur-md text-white font-black text-[10px] px-2 py-0.5 rounded-full border border-white/20">
                            #{index + 1}
                          </span>
                          {slide.isActive ? (
                            <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                              Active
                            </span>
                          ) : (
                            <span className="bg-slate-700 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </div>

                        {/* Badge Preview */}
                        {slide.badge && (
                          <div className="absolute bottom-2.5 left-2.5 right-2.5">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md truncate block transition-all ${
                                showBadge
                                  ? 'text-emerald-300 bg-black/70 backdrop-blur-md border border-emerald-500/30'
                                  : 'text-slate-400 bg-black/60 line-through opacity-60'
                              }`}
                            >
                              {showBadge ? slide.badge : `(Hidden: ${slide.badge})`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content & Actions */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3
                              className={`text-base sm:text-lg font-black leading-snug transition-colors ${
                                showTitle ? 'text-slate-900' : 'text-slate-400 italic line-through'
                              }`}
                            >
                              {slide.title}
                              {!showTitle && (
                                <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded not-italic">
                                  Title Hidden
                                </span>
                              )}
                            </h3>

                            {/* Reordering Up/Down controls */}
                            <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl">
                              <button
                                onClick={() => handleMoveOrder(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                title="Move Slide Up"
                              >
                                <ArrowUp size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(index, 'down')}
                                disabled={index === slides.length - 1}
                                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                title="Move Slide Down"
                              >
                                <ArrowDown size={14} weight="bold" />
                              </button>
                            </div>
                          </div>

                          {slide.subtitle && (
                            <p
                              className={`text-xs leading-relaxed line-clamp-2 transition-colors ${
                                showSubtitle ? 'text-slate-600' : 'text-slate-400 italic line-through'
                              }`}
                            >
                              {slide.subtitle}
                              {!showSubtitle && (
                                <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded not-italic">
                                  Subtitle Hidden
                                </span>
                              )}
                            </p>
                          )}

                          {/* Visibility Controls Bar (Quick Toggle Buttons for Every Element) */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <span>Element Visibility Toggles:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Badge Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleField(slide, 'showBadge', 'Badge Pill')}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  showBadge
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 line-through'
                                }`}
                                title="Toggle Badge Pill Visibility"
                              >
                                {showBadge ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                <span>Pill Badge: {showBadge ? 'ON' : 'OFF'}</span>
                              </button>

                              {/* Title Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleField(slide, 'showTitle', 'Headline Title')}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  showTitle
                                    ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 line-through'
                                }`}
                                title="Toggle Title Visibility"
                              >
                                {showTitle ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                <span>Title: {showTitle ? 'ON' : 'OFF'}</span>
                              </button>

                              {/* Subtitle Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleField(slide, 'showSubtitle', 'Subtitle')}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  showSubtitle
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 line-through'
                                }`}
                                title="Toggle Subtitle Visibility"
                              >
                                {showSubtitle ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                <span>Subtitle: {showSubtitle ? 'ON' : 'OFF'}</span>
                              </button>

                              {/* Primary Button Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleField(slide, 'showPrimaryCta', 'Primary Button')}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  showPrimaryCta
                                    ? 'bg-violet-50 text-violet-800 border-violet-300 hover:bg-violet-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 line-through'
                                }`}
                                title="Toggle Primary Button Visibility"
                              >
                                {showPrimaryCta ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                <span>Button 1: {showPrimaryCta ? 'ON' : 'OFF'}</span>
                              </button>

                              {/* Secondary Button Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleField(slide, 'showSecondaryCta', 'Secondary Button')}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  showSecondaryCta
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 line-through'
                                }`}
                                title="Toggle Secondary Button Visibility"
                              >
                                {showSecondaryCta ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                <span>Button 2: {showSecondaryCta ? 'ON' : 'OFF'}</span>
                              </button>
                            </div>
                          </div>

                          {/* CTA Pills preview */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {slide.ctaText && (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  showPrimaryCta
                                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                                    : 'text-slate-400 bg-slate-100 border-slate-200 line-through'
                                }`}
                              >
                                <span>Primary: {slide.ctaText}</span>
                                <span className="text-slate-400">({slide.ctaLink || '/activities'})</span>
                              </span>
                            )}
                            {slide.secondaryCtaText && (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                  showSecondaryCta
                                    ? 'text-slate-700 bg-slate-100 border-slate-200'
                                    : 'text-slate-400 bg-slate-100 border-slate-200 line-through'
                                }`}
                              >
                                <span>Secondary: {slide.secondaryCtaText}</span>
                                <span className="text-slate-400">({slide.secondaryCtaLink || '/activities'})</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom action row */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(slide)}
                            className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              slide.isActive
                                ? 'text-emerald-700 hover:text-emerald-800'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {slide.isActive ? (
                              <>
                                <Eye size={15} weight="fill" className="text-emerald-600" />
                                <span>Live on Homepage</span>
                              </>
                            ) : (
                              <>
                                <EyeSlash size={15} />
                                <span>Hidden from Homepage</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(slide)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <PencilSimple size={14} weight="bold" />
                              <span>Edit &amp; Configure</span>
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  id: slide.id!,
                                  title: slide.title,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash size={14} weight="bold" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT SLIDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 sm:p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-black">
                  {editingSlide ? 'Edit Hero Slide & Visibility Settings' : 'Create New Hero Slide'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Customize texts, button labels, links, and toggle visibility on or off for each element
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
              {/* LIVE PREVIEW BANNER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-amber-500" />
                    <span>Real-Time Live Preview</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Updates instantly as you edit text and toggles below
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-950 border border-slate-200 h-64 sm:h-72 flex items-center p-6 sm:p-8 text-left">
                  {/* Background Image */}
                  <img
                    src={formData.imageUrl || IMAGE_PRESETS[0].url}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover transition-all"
                    style={{ filter: `brightness(${carouselTheme.imageBrightness ?? 100}%)` }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  {/* Gradient Overlay using active theme */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-all"
                    style={{ background: getHeroOverlayGradient(carouselTheme, true) }}
                  />

                  {/* Content Container */}
                  <div className="relative z-10 max-w-xl space-y-2.5">
                    {/* Badge Pill Preview */}
                    {formData.showBadge ? (
                      <div
                        className="inline-flex items-center gap-1.5 backdrop-blur-md border border-white/20 px-3 py-0.5 rounded-full text-xs font-black shadow-md transition-all"
                        style={{
                          backgroundColor: hexToRgba(carouselTheme.badgeBgColor || '#000000', (carouselTheme.badgeBgOpacity ?? 50) / 100),
                          color: carouselTheme.badgeTextColor || '#ffffff',
                        }}
                      >
                        <Sparkle size={12} weight="fill" style={{ color: carouselTheme.badgeAccentColor || '#34d399' }} />
                        <span>{formData.badge || "India's Verified Kids Coaching Network"}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-black/40 border border-dashed border-white/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-400">
                        <EyeSlash size={11} />
                        <span>Badge Pill Hidden</span>
                      </div>
                    )}

                    {/* Title Preview */}
                    {formData.showTitle ? (
                      <h4
                        className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md transition-all"
                        style={{ color: carouselTheme.titleColor || '#ffffff' }}
                      >
                        {formData.title || 'Slide Title Headline Goes Here'}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                          Across India
                        </span>
                      </h4>
                    ) : (
                      <div className="p-1.5 rounded border border-dashed border-white/30 text-[11px] font-bold text-slate-400 inline-flex items-center gap-1">
                        <EyeSlash size={12} />
                        <span>Headline Title Hidden</span>
                      </div>
                    )}

                    {/* Subtitle Preview */}
                    {formData.showSubtitle ? (
                      <p
                        className="text-xs line-clamp-2 leading-relaxed transition-all"
                        style={{ color: carouselTheme.subtitleColor || '#e2e8f0' }}
                      >
                        {formData.subtitle || 'Discover verified sports academies, dance studios, and STEM robotics labs with 100% free trial sessions.'}
                      </p>
                    ) : (
                      <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <EyeSlash size={11} />
                        <span>Subtitle Text Hidden</span>
                      </div>
                    )}

                    {/* Buttons Preview */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {formData.showPrimaryCta ? (
                        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md">
                          <span>{formData.ctaText || 'Explore Academies'}</span>
                          <ArrowRight size={13} weight="bold" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 border border-dashed border-white/30 px-2 py-1 rounded-lg flex items-center gap-1">
                          <EyeSlash size={10} /> Button 1 Hidden
                        </span>
                      )}

                      {formData.showSecondaryCta ? (
                        <div className="inline-flex items-center gap-1.5 bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-white/30 backdrop-blur-md">
                          <MagnifyingGlass size={12} weight="bold" className="text-blue-300" />
                          <span>{formData.secondaryCtaText || 'Search Below'}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 border border-dashed border-white/30 px-2 py-1 rounded-lg flex items-center gap-1">
                          <EyeSlash size={10} /> Button 2 Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: TOP HIGHLIGHT BADGE PILL */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={18} weight="bold" className="text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        1. Top Highlight Badge Pill
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Small rounded pill tag rendered above the main headline
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button for Badge Pill */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showBadge}
                      onChange={(e) => setFormData({ ...formData, showBadge: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-black text-slate-700 min-w-16">
                      {formData.showBadge ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Eye size={13} weight="bold" /> Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeSlash size={13} /> Hidden
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    What to write on the Badge Pill:
                  </label>
                  <input
                    type="text"
                    disabled={!formData.showBadge}
                    placeholder="e.g. India's Verified Kids Coaching Network"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      formData.showBadge
                        ? 'border-slate-300 bg-white text-slate-900'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* SECTION 2: MAIN HEADLINE / TITLE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TextT size={18} weight="bold" className="text-blue-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        2. Main Headline / Title Text
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Primary large title displayed prominently on the slide
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button for Title */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showTitle}
                      onChange={(e) => setFormData({ ...formData, showTitle: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-black text-slate-700 min-w-16">
                      {formData.showTitle ? (
                        <span className="text-blue-700 flex items-center gap-1">
                          <Eye size={13} weight="bold" /> Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeSlash size={13} /> Hidden
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    What to write on the Headline / Title:
                  </label>
                  <input
                    type="text"
                    required={formData.showTitle}
                    disabled={!formData.showTitle}
                    placeholder="e.g. Where Passion Meets Potential: Kids Sports & Athletics"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      formData.showTitle
                        ? 'border-slate-300 bg-white text-slate-900'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* SECTION 3: SUBTITLE / CUSTOM DESCRIPTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TextT size={18} weight="bold" className="text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        3. Subtitle / Description Text
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Supportive descriptive body text under the headline
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button for Subtitle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showSubtitle}
                      onChange={(e) => setFormData({ ...formData, showSubtitle: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-black text-slate-700 min-w-16">
                      {formData.showSubtitle ? (
                        <span className="text-indigo-700 flex items-center gap-1">
                          <Eye size={13} weight="bold" /> Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeSlash size={13} /> Hidden
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    What to write on the Subtitle:
                  </label>
                  <textarea
                    rows={2}
                    disabled={!formData.showSubtitle}
                    placeholder="Discover verified sports academies, Olympic pools, and badminton arenas with 100% free trial sessions."
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      formData.showSubtitle
                        ? 'border-slate-300 bg-white text-slate-900'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* SECTION 4: PRIMARY ACTION BUTTON (CTA) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CursorClick size={18} weight="bold" className="text-violet-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        4. Primary Action Button
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        High-contrast gradient action button (e.g. Explore Sports)
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button for Primary CTA */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showPrimaryCta}
                      onChange={(e) => setFormData({ ...formData, showPrimaryCta: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    <span className="ml-2 text-xs font-black text-slate-700 min-w-16">
                      {formData.showPrimaryCta ? (
                        <span className="text-violet-700 flex items-center gap-1">
                          <Eye size={13} weight="bold" /> Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeSlash size={13} /> Hidden
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      What to write on Primary Button:
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showPrimaryCta}
                      placeholder="e.g. Explore Academies"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formData.showPrimaryCta
                          ? 'border-slate-300 bg-white text-slate-900'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Primary Button Link URL:
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showPrimaryCta}
                      placeholder="/activities?activity=sports"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formData.showPrimaryCta
                          ? 'border-slate-300 bg-white text-slate-900'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: SECONDARY ACTION BUTTON (CTA) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CursorClick size={18} weight="bold" className="text-amber-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        5. Secondary Action Button
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Frosted glass button (e.g. Search Below or Book Free Trial)
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button for Secondary CTA */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showSecondaryCta}
                      onChange={(e) => setFormData({ ...formData, showSecondaryCta: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    <span className="ml-2 text-xs font-black text-slate-700 min-w-16">
                      {formData.showSecondaryCta ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Eye size={13} weight="bold" /> Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeSlash size={13} /> Hidden
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      What to write on Secondary Button:
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showSecondaryCta}
                      placeholder="e.g. Book Free Trial or Search Below"
                      value={formData.secondaryCtaText}
                      onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formData.showSecondaryCta
                          ? 'border-slate-300 bg-white text-slate-900'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Secondary Button Link URL:
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showSecondaryCta}
                      placeholder="#search or /activities?trial=free"
                      value={formData.secondaryCtaLink}
                      onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formData.showSecondaryCta
                          ? 'border-slate-300 bg-white text-slate-900'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: SLIDE IMAGE & APPEARANCE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} weight="bold" className="text-blue-600" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        6. Slide Background Image *
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Upload a local photo or paste an optional web image URL
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageInputMode === 'upload'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileArrowUp size={13} weight="bold" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageInputMode === 'url'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LinkSimple size={13} weight="bold" />
                      <span>Web URL (Optional)</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: UPLOAD LOCAL IMAGE */}
                {imageInputMode === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileUpload(file);
                        e.target.value = '';
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageFileUpload(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                        isDraggingFile
                          ? 'border-blue-500 bg-blue-50/70 shadow-inner'
                          : formData.imageUrl && formData.imageUrl.startsWith('data:image')
                          ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60'
                          : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-400'
                      }`}
                    >
                      {isCompressingImage ? (
                        <div className="py-2 flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-bold text-blue-600">Compressing &amp; attaching image...</p>
                        </div>
                      ) : formData.imageUrl && formData.imageUrl.startsWith('data:image') ? (
                        <div className="flex items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 shadow-xs shrink-0">
                              <img
                                src={formData.imageUrl}
                                alt="Uploaded preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                                {uploadedFileName || 'Image Uploaded & Ready'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Click or drag a new image to replace
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData((prev) => ({ ...prev, imageUrl: '' }));
                              setUploadedFileName('');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove image"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 space-y-1.5">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                            <FileArrowUp size={20} weight="bold" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-800">
                            Click to upload or drag &amp; drop an image file
                          </p>
                          <p className="text-[11px] text-slate-500">
                            PNG, JPG, WebP, AVIF up to 10MB (automatically optimized for fast loading)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: OPTIONAL WEB IMAGE URL & PRESETS */}
                {imageInputMode === 'url' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-... (optional if file uploaded)"
                        value={formData.imageUrl.startsWith('data:image') ? '' : formData.imageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, imageUrl: e.target.value });
                          setUploadedFileName('');
                        }}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      {formData.imageUrl && !formData.imageUrl.startsWith('data:image') && (
                        <div className="w-12 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preset Chips */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        Quick Preset Images:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, imageUrl: preset.url });
                              setUploadedFileName('');
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              formData.imageUrl === preset.url
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Status Bar */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-200/60">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold shrink-0">Selected Image:</span>
                    {formData.imageUrl ? (
                      formData.imageUrl.startsWith('data:image') ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0">
                          <Check size={11} weight="bold" /> Uploaded File ({uploadedFileName || 'Ready'})
                        </span>
                      ) : (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 truncate max-w-[240px] sm:max-w-[340px]">
                          {formData.imageUrl}
                        </span>
                      )
                    ) : (
                      <span className="text-amber-600 font-medium italic">
                        No image chosen yet (upload a file or paste optional URL)
                      </span>
                    )}
                  </span>

                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, imageUrl: '' }));
                        setUploadedFileName('');
                      }}
                      className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold underline cursor-pointer shrink-0 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

                {/* Gradient Theme Preset */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Accent Gradient Color Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GRADIENT_PRESETS.map((grad) => (
                      <button
                        key={grad.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, accentGradient: grad.value })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                          formData.accentGradient === grad.value
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${grad.value}`} />
                        <span>{grad.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overall Slide Active Status */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      Slide Publication Status
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When active, this slide appears in the homepage carousel sequence
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-bold text-slate-700">
                      {formData.isActive ? 'Active (Live)' : 'Draft (Hidden)'}
                    </span>
                  </label>
                </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FloppyDisk size={15} weight="bold" />
                  <span>{editingSlide ? 'Update Slide Settings' : 'Create Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Hero Slide"
        message={`Are you sure you want to delete the slide "${deleteModal.title}"? This cannot be undone.`}
        confirmText="Delete Slide"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
}
