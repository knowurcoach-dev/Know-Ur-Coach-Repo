"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { getAdminDashboardData } from '@/lib/actions';
import { usePersona } from '@/context/PersonaContext';
import { AdminDashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  Buildings,
  Users,
  Trophy,
  Palette,
  CurrencyInr,
  CreditCard,
  Gear,
  Star,
  MapPin,
  ArrowsClockwise,
  ArrowRight,
  Gift,
  Coins,
  ChartDonut,
  Sparkle,
  TrendUp,
  SealCheck,
  Warning,
  Eye,
  Laptop,
} from '@phosphor-icons/react';

export default function AdminOverviewDashboard() {
  const { showToast } = usePersona();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      setData(res);
    } catch (err) {
      console.error("Failed to load admin overview data:", err);
      showToast("Error loading admin overview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const coaches = data?.coaches || [];
  const parents = data?.parents || [];
  const categories = data?.categories || [];
  const competitions = data?.competitions || [];
  const config = data?.config;

  const pendingCoaches = coaches.filter(
    (c: any) => (c.kycStatus === 'PENDING' || c.kycStatus === 'DOCS_REVIEW' || c.kycStatus === 'REFERRED_BACK') && !c.isSuspended && c.kycStatus !== 'SUSPENDED'
  );
  const approvedCoaches = coaches.filter(
    (c: any) => c.kycStatus === 'APPROVED' && !c.isSuspended && c.kycStatus !== 'SUSPENDED'
  );
  const suspendedCount = coaches.filter((c: any) => c.isSuspended || c.kycStatus === 'SUSPENDED').length;

  const standardPlanPrice = Number(config?.standardPlanPrice) || 1499;
  const premiumPlanPrice = Number(config?.premiumPlanPrice) || 3999;

  // Locality distribution across regions
  const localityCounts: Record<string, number> = {};
  coaches.forEach((c: any) => {
    const loc = c.locality || 'Central Hub';
    localityCounts[loc] = (localityCounts[loc] || 0) + 1;
  });

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <ShieldCheck size={16} weight="fill" className="text-emerald-400" />
              KnowUrCoach Super Admin Command Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive Governance Center
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Real-time intelligence across sports academies, KYC safety verification pipelines, parent registrations, and commercial monetization.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Top Operational KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Pending KYC Audit */}
          <Link
            href="/admin/verify-coaches"
            className="group bg-white p-5 sm:p-6 rounded-3xl border border-purple-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Clock size={24} weight="fill" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Action Req
              </span>
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500">Pending KYC Queue</span>
              <div className="text-3xl font-black text-purple-900 mt-0.5">
                {pendingCoaches.length}
              </div>
              <div className="text-[11px] text-purple-700 font-extrabold flex items-center gap-1 mt-1">
                <span>Review & verify academies</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
          </Link>

          {/* Live Verified Academies */}
          <Link
            href="/admin/coaches"
            className="group bg-white p-5 sm:p-6 rounded-3xl border border-emerald-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <SealCheck size={24} weight="fill" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified
              </span>
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500">Verified Academies</span>
              <div className="text-3xl font-black text-emerald-600 mt-0.5">
                {approvedCoaches.length}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                <span>Active in directory</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
          </Link>

          {/* Registered Parents */}
          <Link
            href="/admin/parents"
            className="group bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Users size={24} weight="fill" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Parents
              </span>
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500">Registered Families</span>
              <div className="text-3xl font-black text-slate-900 mt-0.5">
                {parents.length}
              </div>
              <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 mt-1">
                <span>Manage parents &amp; children</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
          </Link>

          {/* Coach Plans & Monetization */}
          <Link
            href="/admin/plans"
            className="group bg-white p-5 sm:p-6 rounded-3xl border border-indigo-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <CurrencyInr size={24} weight="bold" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Razorpay Active
              </span>
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500">Coach Plans &amp; Pricing</span>
              <div className="text-2xl font-black text-indigo-900 mt-0.5">
                ₹{standardPlanPrice} / ₹{premiumPlanPrice}
              </div>
              <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 mt-1">
                <span>Configure plans &amp; policies</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Navigation Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Platform Management Portals
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Click any module to configure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Coach Approval Queue',
                desc: 'Review profile details and credentials in 2 steps, approve live listings or refer back.',
                href: '/admin/verify-coaches',
                icon: ShieldCheck,
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                badge: `${pendingCoaches.length} Pending`,
              },
              {
                title: 'Coach & Academy Registry',
                desc: 'Full directory of individual coaches and sports academies, plan tiers, batches, and suspension controls.',
                href: '/admin/coaches',
                icon: Buildings,
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                badge: `${coaches.length} Listed`,
              },
              {
                title: 'Parent & Student Registry',
                desc: 'Parent directory, registered children profiles, and account status controls.',
                href: '/admin/parents',
                icon: Users,
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                badge: `${parents.length} Families`,
              },
              {
                title: 'Coach Plans & Monetization',
                desc: 'Configure coach subscription tiers, prices, feature checklists, and free tier public listing rules.',
                href: '/admin/plans',
                icon: CurrencyInr,
                color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                badge: 'Plans & Pricing',
              },
              {
                title: 'Payment Gateway (Razorpay)',
                desc: 'Configure Test & Live Key IDs and Secrets, toggle Test Mode globally, and inspect transaction telemetry.',
                href: '/admin/payments',
                icon: CreditCard,
                color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                badge: 'Razorpay Integration',
              },
              {
                title: 'Tournament Management',
                desc: 'Publish and schedule youth sports tournaments, prize pools, and eligibility rules.',
                href: '/admin/competitions',
                icon: Trophy,
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                badge: `${competitions.length} Scheduled`,
              },
              {
                title: 'Activities & Disciplines',
                desc: 'Manage Blinkit-style 2-tier taxonomy: Major Activities (Sports, STEM, Arts) & nested Disciplines.',
                href: '/admin/categories',
                icon: Palette,
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                badge: `Taxonomy Hub`,
              },
              {
                title: 'Delivery Modes',
                desc: 'Configure dynamic coaching delivery formats (Offline, Online, Hybrid) with badge palettes and filters.',
                href: '/admin/modes',
                icon: Laptop,
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                badge: 'Dynamic Formats',
              },
              {
                title: 'Theme & Visual Styling',
                desc: 'Brand color accents (Emerald, Indigo, Violet), page tones, typography scale, and live UI preview.',
                href: '/admin/theme',
                icon: Palette,
                color: 'bg-teal-50 text-teal-700 border-teal-200',
                badge: config?.themeColor || 'Emerald',
              },
              {
                title: 'Platform Settings',
                desc: 'Site name, regional tagline, primary city operation, and safety audit personnel.',
                href: '/admin/config',
                icon: Gear,
                color: 'bg-slate-100 text-slate-800 border-slate-200',
                badge: 'System Defaults',
              },
            ].map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${module.color} group-hover:scale-105 transition-transform`}>
                        <Icon size={24} weight="fill" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {module.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                        {module.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-purple-700">
                    <span>Open Module</span>
                    <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Locality Distribution & Immediate Action Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Locality distribution */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={20} weight="fill" className="text-red-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Regional Locality Distribution
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-bold">Hyperlocal Coverage</span>
            </div>

            <div className="space-y-3">
              {Object.entries(localityCounts).map(([loc, count]) => {
                const percentage = Math.round((count / (coaches.length || 1)) * 100);
                return (
                  <div key={loc} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="capitalize">{loc.replace('-', ' ')}</span>
                      <span>{count} academies ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent KYC Action Queue Widget */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={20} weight="fill" className="text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Urgent KYC Verification Queue
                </h3>
              </div>
              <Link
                href="/admin/verify-coaches"
                className="text-xs font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <span>View All ({pendingCoaches.length})</span>
                <ArrowRight size={12} weight="bold" />
              </Link>
            </div>

            {pendingCoaches.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <CheckCircle size={32} weight="fill" className="text-emerald-600 mx-auto" />
                <div className="text-xs font-extrabold text-emerald-900">Queue is completely clear!</div>
                <div className="text-[11px] text-emerald-700">All registered academies are verified.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCoaches.slice(0, 3).map((coach: any) => (
                  <div
                    key={coach.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-purple-50/30 transition-colors"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs leading-snug">
                        {coach.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {coach.locality} • Head: {coach.headCoachName}
                      </div>
                    </div>

                    <Link
                      href="/admin/verify-coaches"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs shrink-0 flex items-center gap-1"
                    >
                      <Eye size={12} weight="bold" />
                      <span>Audit</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
