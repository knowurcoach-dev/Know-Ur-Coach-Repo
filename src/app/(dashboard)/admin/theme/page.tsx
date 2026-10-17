"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getAdminDashboardData,
  updatePlatformConfig,
  getHeroCarouselThemeAction,
  updateHeroCarouselThemeAction,
  resetHeroCarouselThemeAction,
} from '@/lib/actions';
import {
  HeroCarouselTheme,
  DEFAULT_HERO_CAROUSEL_THEME,
  getHeroOverlayGradient,
  getHeroCardHeightClass,
  hexToRgba,
} from '@/lib/hero-theme';
import { usePersona } from '@/context/PersonaContext';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Palette,
  CheckCircle,
  FloppyDisk,
  ArrowsClockwise,
  Sparkle,
  Star,
  ShieldCheck,
  Desktop,
  DeviceMobile,
  Sliders,
  TextT,
  Eye,
  ArrowRight,
  Sun,
  Drop,
  Slideshow,
  PaintBrush,
} from '@phosphor-icons/react';

const OVERLAY_COLOR_PRESETS = [
  { label: 'Midnight Slate', value: '#020617', bgClass: 'bg-slate-950' },
  { label: 'Pitch Black', value: '#000000', bgClass: 'bg-black' },
  { label: 'Deep Navy', value: '#0a1128', bgClass: 'bg-[#0a1128]' },
  { label: 'Forest Emerald', value: '#064e3b', bgClass: 'bg-emerald-950' },
  { label: 'Royal Indigo', value: '#1e1b4b', bgClass: 'bg-indigo-950' },
  { label: 'Charcoal Zinc', value: '#18181b', bgClass: 'bg-zinc-900' },
  { label: 'Crimson Ruby', value: '#450a0a', bgClass: 'bg-red-950' },
];

const TITLE_COLOR_PRESETS = [
  { label: 'Crisp White', value: '#ffffff' },
  { label: 'Warm Cream', value: '#fef3c7' },
  { label: 'Golden Amber', value: '#fde047' },
  { label: 'Ice Cyan', value: '#7dd3fc' },
  { label: 'Mint Lime', value: '#6ee7b7' },
  { label: 'Silver White', value: '#f1f5f9' },
];

const SUBTITLE_COLOR_PRESETS = [
  { label: 'Slate 200', value: '#e2e8f0' },
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Pale Cyan', value: '#e0f2fe' },
  { label: 'Soft Cream', value: '#fef9c3' },
  { label: 'Cool Silver', value: '#cbd5e1' },
];

export default function AdminThemePage() {
  const { showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isSavingCarousel, startSavingCarousel] = useTransition();

  // Global Platform Theme
  const [themeForm, setThemeForm] = useState({
    themeColor: 'emerald',
    bgColor: 'slate',
    fontSize: 'normal',
    borderRadius: 'rounded-xl',
  });

  // Hero Carousel Theme
  const [carouselTheme, setCarouselTheme] = useState<HeroCarouselTheme>(DEFAULT_HERO_CAROUSEL_THEME);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [res, carouselRes] = await Promise.all([
        getAdminDashboardData(),
        getHeroCarouselThemeAction(),
      ]);

      if (res.config) {
        setThemeForm({
          themeColor: res.config.themeColor || 'emerald',
          bgColor: res.config.bgColor || 'slate',
          fontSize: res.config.fontSize || 'normal',
          borderRadius: res.config.borderRadius || 'rounded-xl',
        });
      }

      if (carouselRes.success && carouselRes.theme) {
        setCarouselTheme(carouselRes.theme);
      }
    } catch (err) {
      console.error("Failed to load theme config:", err);
      showToast("Error loading theme styling");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTheme = () => {
    startTransition(async () => {
      try {
        const res = await updatePlatformConfig({
          themeColor: themeForm.themeColor,
          bgColor: themeForm.bgColor,
          fontSize: themeForm.fontSize,
          borderRadius: themeForm.borderRadius,
        });
        if (res.success) {
          showToast("🎨 Platform design system styling saved successfully!");
        } else {
          showToast("Failed to save platform theme settings");
        }
      } catch (err) {
        showToast("Error updating platform theme");
      }
    });
  };

  const handleSaveCarouselTheme = () => {
    startSavingCarousel(async () => {
      try {
        const res = await updateHeroCarouselThemeAction(carouselTheme);
        if (res.success) {
          showToast("✨ Hero carousel theme, overlay & font controls saved successfully!");
        } else {
          showToast(res.message || "Failed to save carousel theme");
        }
      } catch (err: any) {
        showToast("Error saving hero carousel theme: " + err?.message);
      }
    });
  };

  const handleResetCarouselTheme = () => {
    if (!window.confirm("Are you sure you want to reset the hero carousel theme to recommended defaults?")) {
      return;
    }
    startSavingCarousel(async () => {
      try {
        const res = await resetHeroCarouselThemeAction();
        if (res.success && res.theme) {
          setCarouselTheme(res.theme);
          showToast("🔄 Hero carousel theme reset to recommended defaults!");
        } else {
          showToast("Failed to reset hero carousel theme");
        }
      } catch (err: any) {
        showToast("Error resetting theme: " + err?.message);
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Theme & Visual Styling Controls" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <Palette size={16} weight="fill" className="text-emerald-400" />
              Design System & Theming
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Theme & Visual Styling Controls
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Customize brand accent colors, hero carousel overlay darkness, typography scale, font colors, and container radius across KnowUrCoach.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/hero-slides"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <Slideshow size={15} weight="bold" />
              <span>Manage Slide Banners</span>
            </Link>
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Reload from server"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ========================================================
            SECTION 1: HERO SECTION CAROUSEL THEME & STYLING
            (Overlay darkness, overlay color, font sizes, colors, brightness)
           ======================================================== */}
        <div id="hero-carousel" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-1.5">
                <Sparkle size={13} weight="fill" className="text-indigo-600" />
                Hero Section Carousel Styling
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hero Carousel Overlay, Typography &amp; Atmosphere Controls
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Fine-tune the exact opacity, scrim color, headline size, subtitle font color, and image brightness for the rotating hero carousel.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetCarouselTheme}
                disabled={isSavingCarousel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowsClockwise size={13} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCarouselTheme}
                disabled={isSavingCarousel}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <FloppyDisk size={15} weight="bold" />
                <span>{isSavingCarousel ? 'Saving Changes...' : 'Save Carousel Styling'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Preview Component */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} weight="bold" className="text-indigo-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Interactive Live Carousel Preview
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Real-Time Updates
                </span>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    previewViewport === 'desktop'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Desktop size={14} weight="bold" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    previewViewport === 'mobile'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <DeviceMobile size={14} weight="bold" />
                  <span>Mobile View</span>
                </button>
              </div>
            </div>

            {/* Preview Viewport Container */}
            <div className="bg-slate-950 p-3 sm:p-6 rounded-3xl border border-slate-800 flex justify-center items-center overflow-hidden">
              <div
                className={`transition-all duration-300 w-full ${
                  previewViewport === 'mobile' ? 'max-w-[360px]' : 'max-w-4xl'
                }`}
              >
                <div
                  className={`relative ${carouselTheme.borderRadius || 'rounded-3xl'} overflow-hidden shadow-2xl bg-slate-900 border border-white/30 backdrop-blur-md ${
                    previewViewport === 'mobile'
                      ? carouselTheme.cardHeightMobile === 'compact'
                        ? 'h-[260px]'
                        : carouselTheme.cardHeightMobile === 'tall'
                        ? 'h-[340px]'
                        : 'h-[290px]'
                      : carouselTheme.cardHeightDesktop === 'compact'
                      ? 'h-[320px]'
                      : carouselTheme.cardHeightDesktop === 'tall'
                      ? 'h-[420px]'
                      : 'h-[360px]'
                  } flex items-center`}
                >
                  {/* Background Image */}
                  <img
                    src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1400&auto=format&fit=crop"
                    alt="Preview Background"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
                    style={{
                      filter: `brightness(${carouselTheme.imageBrightness ?? 100}%)`,
                    }}
                  />

                  {/* Dynamic Gradient Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-all duration-300"
                    style={{
                      background: getHeroOverlayGradient(carouselTheme, previewViewport === 'desktop'),
                    }}
                  />

                  {/* Content Container */}
                  <div className="relative z-10 w-full max-w-xl px-4 sm:px-8 py-4 sm:py-6 space-y-2 sm:space-y-3 text-left">
                    {/* Badge Pill */}
                    <div
                      className="inline-flex items-center gap-1.5 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-md transition-all"
                      style={{
                        backgroundColor: hexToRgba(carouselTheme.badgeBgColor || '#000000', (carouselTheme.badgeBgOpacity ?? 50) / 100),
                        color: carouselTheme.badgeTextColor || '#ffffff',
                      }}
                    >
                      <Sparkle size={12} weight="fill" style={{ color: carouselTheme.badgeAccentColor || '#34d399' }} />
                      <span>India&apos;s Verified Kids Coaching Network</span>
                    </div>

                    {/* Headline Title */}
                    <h1
                      className={`font-black tracking-tight leading-snug sm:leading-tight line-clamp-2 transition-all ${
                        previewViewport === 'mobile'
                          ? carouselTheme.titleFontSizeMobile === 'sm'
                            ? 'text-sm'
                            : carouselTheme.titleFontSizeMobile === 'base'
                            ? 'text-base'
                            : carouselTheme.titleFontSizeMobile === 'xl'
                            ? 'text-xl'
                            : carouselTheme.titleFontSizeMobile === '2xl'
                            ? 'text-2xl'
                            : 'text-lg'
                          : carouselTheme.titleFontSizeDesktop === '3xl'
                          ? 'text-3xl'
                          : carouselTheme.titleFontSizeDesktop === '4xl'
                          ? 'text-4xl'
                          : carouselTheme.titleFontSizeDesktop === '6xl'
                          ? 'text-5xl lg:text-6xl'
                          : 'text-4xl lg:text-5xl'
                      } ${
                        carouselTheme.titleFontWeight === 'bold'
                          ? 'font-bold'
                          : carouselTheme.titleFontWeight === 'extrabold'
                          ? 'font-extrabold'
                          : 'font-black'
                      } ${
                        carouselTheme.titleDropShadow === 'none'
                          ? ''
                          : carouselTheme.titleDropShadow === 'subtle'
                          ? 'drop-shadow-sm'
                          : carouselTheme.titleDropShadow === 'strong'
                          ? 'drop-shadow-2xl'
                          : 'drop-shadow-lg'
                      }`}
                      style={{ color: carouselTheme.titleColor || '#ffffff' }}
                    >
                      Where Passion Meets Potential: Kids Sports &amp; Athletics
                    </h1>

                    {/* Subtitle */}
                    <p
                      className={`leading-normal sm:leading-relaxed max-w-lg line-clamp-2 transition-all ${
                        previewViewport === 'mobile'
                          ? carouselTheme.subtitleFontSizeMobile === 'sm'
                            ? 'text-xs'
                            : 'text-[11px]'
                          : carouselTheme.subtitleFontSizeDesktop === 'base'
                          ? 'text-base'
                          : carouselTheme.subtitleFontSizeDesktop === 'xs'
                          ? 'text-xs'
                          : 'text-sm'
                      } ${
                        carouselTheme.subtitleFontWeight === 'normal'
                          ? 'font-normal'
                          : carouselTheme.subtitleFontWeight === 'semibold'
                          ? 'font-semibold'
                          : 'font-medium'
                      }`}
                      style={{ color: carouselTheme.subtitleColor || '#e2e8f0' }}
                    >
                      Discover verified sports academies, Olympic pools, and badminton arenas with 100% free trial sessions.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[11px] sm:text-xs px-3.5 py-1.5 rounded-lg shadow-md">
                        Explore Academies
                      </span>
                      <span className="bg-white/15 text-white font-bold text-[11px] sm:text-xs px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md">
                        Search Below
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Column 1: Overlay & Atmosphere Controls */}
            <div className="space-y-6">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Drop size={18} weight="fill" className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    1. Overlay Darkness &amp; Color
                  </h3>
                </div>

                {/* Overlay Opacity Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-slate-700">
                      Overlay Darkness (Opacity)
                    </label>
                    <span className="font-mono font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-xs">
                      {carouselTheme.overlayOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={carouselTheme.overlayOpacity}
                    onChange={(e) =>
                      setCarouselTheme({ ...carouselTheme, overlayOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>10% (Bright / Transparent)</span>
                    <span>65% (Balanced)</span>
                    <span>95% (Deep Black)</span>
                  </div>
                </div>

                {/* Overlay Base Color */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">
                      Overlay Tint Base Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={carouselTheme.overlayColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, overlayColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Pick custom color"
                      />
                      <input
                        type="text"
                        value={carouselTheme.overlayColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, overlayColor: e.target.value })}
                        className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 text-center uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Preset Swatches */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {OVERLAY_COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setCarouselTheme({ ...carouselTheme, overlayColor: p.value })}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          carouselTheme.overlayColor.toLowerCase() === p.value.toLowerCase()
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: p.value }}
                        />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradient Direction / Style */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Gradient Style &amp; Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'balanced-scrim', label: 'Balanced Scrim', desc: 'Left fade (desktop) / Bottom (phone)' },
                      { id: 'cinematic-fade', label: 'Cinematic Fade', desc: '105° angled dynamic lighting' },
                      { id: 'radial-vignette', label: 'Radial Vignette', desc: 'Soft spotlight from left focal' },
                      { id: 'subtle-tint', label: 'Subtle Tint', desc: 'Uniform translucent tint wash' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() =>
                          setCarouselTheme({ ...carouselTheme, overlayGradientType: g.id as any })
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          carouselTheme.overlayGradientType === g.id
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">{g.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Brightness */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Sun size={14} className="text-amber-500" />
                      Background Photo Brightness
                    </label>
                    <span className="font-mono font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs">
                      {carouselTheme.imageBrightness ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="115"
                    step="5"
                    value={carouselTheme.imageBrightness ?? 100}
                    onChange={(e) =>
                      setCarouselTheme({ ...carouselTheme, imageBrightness: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Font Sizes, Colors & Typography Controls */}
            <div className="space-y-6">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <TextT size={18} weight="fill" className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    2. Headline &amp; Subtitle Typography
                  </h3>
                </div>

                {/* Title Font Color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">
                      Headline Title Font Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={carouselTheme.titleColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, titleColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={carouselTheme.titleColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, titleColor: e.target.value })}
                        className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 text-center uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Title Color Quick Swatches */}
                  <div className="flex flex-wrap gap-2">
                    {TITLE_COLOR_PRESETS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setCarouselTheme({ ...carouselTheme, titleColor: t.value })}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          carouselTheme.titleColor.toLowerCase() === t.value.toLowerCase()
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: t.value }}
                        />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Font Sizes (Mobile & Desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Title Size (Mobile Phone)
                    </label>
                    <select
                      value={carouselTheme.titleFontSizeMobile}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, titleFontSizeMobile: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="sm">Small (14px - compact)</option>
                      <option value="base">Medium (16px)</option>
                      <option value="lg">Standard Recommended (18px)</option>
                      <option value="xl">Large (20px)</option>
                      <option value="2xl">Extra Large (24px)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Title Size (Desktop)
                    </label>
                    <select
                      value={carouselTheme.titleFontSizeDesktop}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, titleFontSizeDesktop: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="3xl">Standard (30px)</option>
                      <option value="4xl">Prominent (36px)</option>
                      <option value="5xl">Heroic Recommended (48px)</option>
                      <option value="6xl">Extra Heroic (60px)</option>
                    </select>
                  </div>
                </div>

                {/* Title Weight & Drop Shadow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Headline Font Weight
                    </label>
                    <select
                      value={carouselTheme.titleFontWeight}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, titleFontWeight: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="bold">Bold (700)</option>
                      <option value="extrabold">Extra Bold (800)</option>
                      <option value="black">Heavy Black (900 - Recommended)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Title Text Shadow
                    </label>
                    <select
                      value={carouselTheme.titleDropShadow}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, titleDropShadow: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="none">None (Clean)</option>
                      <option value="subtle">Subtle Shadow</option>
                      <option value="medium">Medium Drop Shadow (Recommended)</option>
                      <option value="strong">High Contrast Strong Shadow</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle Font Color & Size */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">
                      Subtitle Font Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={carouselTheme.subtitleColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, subtitleColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={carouselTheme.subtitleColor}
                        onChange={(e) => setCarouselTheme({ ...carouselTheme, subtitleColor: e.target.value })}
                        className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 text-center uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SUBTITLE_COLOR_PRESETS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setCarouselTheme({ ...carouselTheme, subtitleColor: s.value })}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          carouselTheme.subtitleColor.toLowerCase() === s.value.toLowerCase()
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: s.value }}
                        />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carousel Card Height & Border Radius */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Card Height (Mobile)
                    </label>
                    <select
                      value={carouselTheme.cardHeightMobile}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, cardHeightMobile: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="compact">Compact (260px)</option>
                      <option value="standard">Standard (290px)</option>
                      <option value="tall">Spacious (340px)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Card Corner Radius
                    </label>
                    <select
                      value={carouselTheme.borderRadius}
                      onChange={(e) =>
                        setCarouselTheme({ ...carouselTheme, borderRadius: e.target.value as any })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="rounded-2xl">Rounded-2XL (16px)</option>
                      <option value="rounded-3xl">Rounded-3XL (24px - Default)</option>
                      <option value="rounded-4xl">Rounded-4XL (32px - Ultra Modern)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-500 font-medium">
              💡 Tip: Click <strong>Save Carousel Styling</strong> to instantly update the homepage hero section for all visitors across India.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetCarouselTheme}
                disabled={isSavingCarousel}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleSaveCarouselTheme}
                disabled={isSavingCarousel}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <FloppyDisk size={16} weight="bold" />
                <span>{isSavingCarousel ? 'Saving...' : 'Save Carousel Styling'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 2: GLOBAL PLATFORM THEME (Brand Accent, Page Canvas, App Radius)
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Controls (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Global Platform Theme &amp; UI Styling
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controls default brand buttons, academy cards, badges, and general layout styling throughout the web application.
                </p>
              </div>

              {/* Primary Color */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  1. Primary Brand Accent Color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'emerald', label: 'Emerald Green', hex: '#059669', badge: 'bg-emerald-600' },
                    { id: 'indigo', label: 'Indigo Modern', hex: '#4f46e5', badge: 'bg-indigo-600' },
                    { id: 'blue', label: 'Royal Blue', hex: '#2563eb', badge: 'bg-blue-600' },
                    { id: 'amber', label: 'Amber Gold', hex: '#d97706', badge: 'bg-amber-500' },
                    { id: 'violet', label: 'Violet Tech', hex: '#9333ea', badge: 'bg-purple-600' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setThemeForm({ ...themeForm, themeColor: c.id })}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                        themeForm.themeColor === c.id
                          ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${c.badge} shadow-2xs shrink-0`} />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{c.label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{c.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background style */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  2. Page Background Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'slate', label: 'Subtle Slate', desc: 'Slate-50 clean background with sharp contrast' },
                    { id: 'clean', label: 'Crisp White', desc: 'Pure white canvas for maximal brightness' },
                    { id: 'zinc', label: 'Zinc Minimal', desc: 'Cool-toned architectural grey' },
                  ].map((b) => (
                    <label
                      key={b.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        themeForm.bgColor === b.id
                          ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-bold ring-2 ring-purple-600/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{b.label}</span>
                        <input
                          type="radio"
                          name="bgStyle"
                          checked={themeForm.bgColor === b.id}
                          onChange={() => setThemeForm({ ...themeForm, bgColor: b.id })}
                          className="accent-purple-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                        {b.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Typography scale & corner radius */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    3. Typography Scale
                  </label>
                  <select
                    value={themeForm.fontSize}
                    onChange={(e) => setThemeForm({ ...themeForm, fontSize: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="small">Compact (14px base - denser rosters)</option>
                    <option value="normal">Standard (16px base - Plus Jakarta Sans)</option>
                    <option value="large">Spacious (18px base - high accessibility)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    4. Container Corner Radius
                  </label>
                  <select
                    value={themeForm.borderRadius}
                    onChange={(e) => setThemeForm({ ...themeForm, borderRadius: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="rounded-lg">Rounded-LG (8px - crisp modern)</option>
                    <option value="rounded-xl">Rounded-XL (12px - balanced modern)</option>
                    <option value="rounded-2xl">Rounded-2xl (16px - friendly soft)</option>
                    <option value="rounded-3xl">Rounded-3xl (24px - hyper-curved premium)</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTheme}
                  disabled={isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Save Platform Theme</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview (1 column on lg) */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkle size={18} weight="fill" className="text-yellow-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Platform UI Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Theme: {themeForm.themeColor}</span>
              </div>

              {/* Sample Academy Card in theme */}
              <div className={`bg-white text-slate-900 p-4 ${themeForm.borderRadius} shadow-md space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={11} weight="fill" /> VERIFIED ACADEMY
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500 font-extrabold text-xs">
                    <Star size={12} weight="fill" />
                    <span>4.9</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm leading-snug">National Sports Academy</h4>
                  <p className="text-[10px] text-slate-500">Khandari, Agra</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-extrabold text-slate-800">₹1,500 / mo</span>
                  <button
                    type="button"
                    className={`text-[10px] font-extrabold text-white px-3 py-1.5 ${themeForm.borderRadius} shadow-2xs ${
                      themeForm.themeColor === 'emerald'
                        ? 'bg-emerald-600'
                        : themeForm.themeColor === 'indigo'
                        ? 'bg-indigo-600'
                        : themeForm.themeColor === 'blue'
                        ? 'bg-blue-600'
                        : themeForm.themeColor === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-purple-600'
                    }`}
                  >
                    Book Free Trial
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Platform theme settings apply across all cards, navigation bars, and buttons.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
