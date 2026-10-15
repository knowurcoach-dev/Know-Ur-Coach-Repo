"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { getAdminDashboardData, updatePlatformConfig } from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Gear,
  CheckCircle,
  FloppyDisk,
  ArrowsClockwise,
  Globe,
  MapPin,
  ShieldCheck,
  Phone,
} from '@phosphor-icons/react';

export default function AdminPlatformConfigPage() {
  const { showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [config, setConfig] = useState({
    siteName: 'KnowUrCoach',
    tagline: 'Hyperlocal Sports & Academy Discovery across India',
    city: 'Agra',
    state: 'Uttar Pradesh',
    supportPhone: '+91 98970 00000',
    chiefAuditor: 'Er. S. Rawat',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      if (res.config) {
        setConfig((prev) => ({
          ...prev,
          siteName: res.config.siteName || 'KnowUrCoach',
          tagline: res.config.tagline || 'Hyperlocal Sports & Academy Discovery across India',
        }));
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
      showToast("Error loading platform configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await updatePlatformConfig({
          siteName: config.siteName,
          tagline: config.tagline,
        });
        if (res.success) {
          showToast("⚙️ Platform configuration saved successfully!");
        } else {
          showToast("Failed to save platform configuration");
        }
      } catch (err) {
        showToast("Error saving platform config");
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Platform Settings" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <Gear size={16} weight="fill" className="text-emerald-400" />
              System Parameters & Regional Defaults
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Settings
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Manage platform branding, default city operations, and verification safety auditor defaults.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading || isPending}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Reload Config</span>
          </button>
        </div>

        {/* Config Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                Platform Name
              </label>
              <div className="relative">
                <Globe size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                Regional Tagline
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                  Primary Operating City
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-3 text-red-500" />
                  <input
                    type="text"
                    value={config.city}
                    onChange={(e) => setConfig({ ...config, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={config.state}
                  onChange={(e) => setConfig({ ...config, state: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                  Parent Support Helpline
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={config.supportPhone}
                    onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                  Chief Safety Audit Officer
                </label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-3.5 top-3 text-emerald-600" />
                  <input
                    type="text"
                    value={config.chiefAuditor}
                    onChange={(e) => setConfig({ ...config, chiefAuditor: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Save Platform Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
