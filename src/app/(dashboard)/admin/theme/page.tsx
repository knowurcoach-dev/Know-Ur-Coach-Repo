"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { getAdminDashboardData, updatePlatformConfig } from '@/lib/actions';
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
  Cursor,
} from '@phosphor-icons/react';

export default function AdminThemePage() {
  const { showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [themeForm, setThemeForm] = useState({
    themeColor: 'emerald',
    bgColor: 'slate',
    fontSize: 'normal',
    borderRadius: 'rounded-xl',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      if (res.config) {
        setThemeForm({
          themeColor: res.config.themeColor || 'emerald',
          bgColor: res.config.bgColor || 'slate',
          fontSize: res.config.fontSize || 'normal',
          borderRadius: res.config.borderRadius || 'rounded-xl',
        });
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
          showToast("🎨 Theme and visual styling saved successfully!");
        } else {
          showToast("Failed to save theme settings");
        }
      } catch (err) {
        showToast("Error updating theme");
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Theme & Visual Styling Controls" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              Customize brand accent colors, background tones, typography scale, and button radius across KnowUrCoach.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading || isPending}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Reset to Saved</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Controls (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
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
                  <span>Save Theme & Visual Styling</span>
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
                    Live UI Preview
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
                  <h4 className="font-extrabold text-sm leading-snug">Agra Champions Club</h4>
                  <p className="text-[10px] text-slate-500">Kamla Nagar, Agra</p>
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
                Changes apply instantly across all parent discovery pages, coach batch roasters, and mobile navigation sheets.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
