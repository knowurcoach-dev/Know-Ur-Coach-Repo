"use client";

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  seedDefaultHeroSlides,
} from '@/lib/actions';
import { HeroSlideData, DEFAULT_HERO_SLIDES } from '@/lib/hero-slides';
import { usePersona } from '@/context/PersonaContext';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideData | null>(null);

  // Form Fields
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
  });

  // Deletion Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const loadSlides = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminHeroSlides();
      if (res.success && res.slides) {
        setSlides(res.slides);
      } else {
        setSlides(DEFAULT_HERO_SLIDES);
      }
    } catch (err) {
      console.error('Failed to load slides:', err);
      showToast('Error loading hero slides');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      badge: "India's Verified Kids Coaching Network",
      imageUrl: IMAGE_PRESETS[0].url,
      ctaText: 'Explore Activities',
      ctaLink: '/activities',
      secondaryCtaText: 'Book Free Trial',
      secondaryCtaLink: '/activities',
      accentGradient: GRADIENT_PRESETS[0].value,
      order: slides.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlideData) => {
    setEditingSlide(slide);
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
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('⚠️ Please enter a slide title');
      return;
    }
    if (!formData.imageUrl.trim()) {
      showToast('⚠️ Please enter an image URL');
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
              Control the homepage carousel slides: custom headlines, descriptions, high-resolution imagery, and action callout buttons viewed by parents across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              Drag or use arrows to change carousel display sequence
            </span>
          </div>

          {slides.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                <Slideshow size={32} weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Hero Slides Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your homepage is currently using default fallback slides. Add customized slides or click &quot;Reset Defaults&quot; to populate.
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
              {slides.map((slide, index) => (
                <div
                  key={slide.id || index}
                  className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md overflow-hidden ${
                    slide.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Visual Slide Image Thumbnail */}
                    <div className="relative w-full md:w-72 h-44 md:h-auto shrink-0 bg-slate-900 overflow-hidden">
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
                      {slide.badge && (
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <span className="text-[10px] font-black text-emerald-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30 truncate block">
                            {slide.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content & Actions */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                            {slide.title}
                          </h3>

                          {/* Reordering Up/Down controls */}
                          <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl">
                            <button
                              onClick={() => handleMoveOrder(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title="Move Slide Up"
                            >
                              <ArrowUp size={14} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(index, 'down')}
                              disabled={index === slides.length - 1}
                              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title="Move Slide Down"
                            >
                              <ArrowDown size={14} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {slide.subtitle && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {slide.subtitle}
                          </p>
                        )}

                        {/* CTA Pills preview */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {slide.ctaText && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <span>Primary: {slide.ctaText}</span>
                              <span className="text-slate-400">({slide.ctaLink})</span>
                            </span>
                          )}
                          {slide.secondaryCtaText && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              <span>Secondary: {slide.secondaryCtaText}</span>
                              <span className="text-slate-400">({slide.secondaryCtaLink})</span>
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
                            <span>Edit</span>
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT SLIDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">
                  {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Configure text, high-res background image, and call-to-action buttons
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Main Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Where Passion Meets Potential: Kids Sports & Coaching"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Subtitle / Custom Text
                </label>
                <textarea
                  rows={2}
                  placeholder="Discover verified sports academies, dance studios, and STEM robotics labs with 100% free trial sessions."
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Badge Pill */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Top Highlight Badge Pill
                </label>
                <input
                  type="text"
                  placeholder="e.g. India's Verified Kids Coaching Network"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image URL & Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Slide Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.imageUrl && (
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
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          formData.imageUrl === preset.url
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Primary CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Activities"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Primary CTA Link
                  </label>
                  <input
                    type="text"
                    placeholder="/activities"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Secondary CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Book Free Trial"
                    value={formData.secondaryCtaText}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Secondary CTA Link
                  </label>
                  <input
                    type="text"
                    placeholder="/activities?trial=free"
                    value={formData.secondaryCtaLink}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

              {/* Status Toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Slide Active Status
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {formData.isActive ? 'Active (Visible)' : 'Draft (Hidden)'}
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
                  <span>{editingSlide ? 'Update Slide' : 'Create Slide'}</span>
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
