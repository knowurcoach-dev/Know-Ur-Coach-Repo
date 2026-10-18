"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import {
  getAdminDashboardData,
  updatePlatformConfig,
  adminExtendCoachSubscription,
  adminSetCoachCustomExpiry,
} from '@/lib/actions';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { PlanFeature, parseFeatures, serializeFeatureItems } from '@/lib/plan-features';
import { DynamicPlanFeaturesEditor } from '@/components/dashboard/DynamicPlanFeaturesEditor';
import {
  FREE_TRIAL_PRESETS,
  getCentreSubscriptionStatus,
} from '@/lib/subscription';
import {
  CurrencyInr,
  Crown,
  CheckCircle,
  WarningCircle,
  ToggleLeft,
  ToggleRight,
  FloppyDisk,
  ArrowClockwise as ArrowsClockwise,
  CreditCard,
  Eye,
  EyeSlash,
  Buildings,
  Tag,
  Lightning,
  Check,
  X,
  MagnifyingGlass,
  ArrowSquareOut,
  Sparkle,
  PencilSimple,
  Clock,
  CalendarBlank,
} from '@phosphor-icons/react';

const DEFAULT_FREE_FEATURES: PlanFeature[] = [
  { text: "Verified Academy Profile in National & City Directory", included: true },
  { text: "Receive up to 5 parent trial leads per month", included: true },
  { text: "Student attendance roster up to 20 students", included: true },
  { text: "Standard locality discovery placement", included: true },
  { text: "Zero parent fee escrow payment protection", included: true },
  { text: "Top of Area Priority Search Ranking", included: false },
  { text: "Golden 'Verified Premier Academy' Badge", included: false },
];

const DEFAULT_STANDARD_FEATURES: PlanFeature[] = [
  { text: "Guaranteed public listing in discovery directory", included: true },
  { text: "Receive unlimited Free Trial session leads", included: true },
  { text: "Full student roster up to 100 students", included: true },
  { text: "Priority search ranking above free academies", included: true },
  { text: "Instant SMS & Email inquiry alerts", included: true },
  { text: "Up to 5 coaching batches & timings", included: true },
  { text: "Zero parent fee escrow guarantee", included: true },
  { text: "Top #1 Priority in Locality", included: false },
];

const DEFAULT_PREMIUM_FEATURES: PlanFeature[] = [
  { text: "#1 Top of Area priority placement in locality", included: true, highlight: true },
  { text: "Golden 'Verified Premier Academy' safety badge", included: true, highlight: true },
  { text: "Instant WhatsApp lead alerts directly to coach phone", included: true, highlight: true },
  { text: "Unlimited batches, timings & enrolled students", included: true },
  { text: "Priority 24-hr in-app Digital KYC inspection audit", included: true },
  { text: "Official Youth Tournament hosting tools & organizer brackets", included: true },
  { text: "Dedicated KnowUrCoach account & compliance manager", included: true },
  { text: "0% platform commission on direct parent enrollments", included: true },
];

export default function AdminPlansPage() {
  const { showToast, refreshConfig } = usePersona();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Coach Subscription Tiers Form & Policies
  const [standardPlanPrice, setStandardPlanPrice] = useState(1499);
  const [premiumPlanPrice, setPremiumPlanPrice] = useState(3999);
  const [allowFreeTierPublicListing, setAllowFreeTierPublicListing] = useState(true);
  const [enableFreePlan, setEnableFreePlan] = useState(true);
  const [freeTierDurationDays, setFreeTierDurationDays] = useState(90);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [enableStandardPlan, setEnableStandardPlan] = useState(true);
  const [enablePremiumPlan, setEnablePremiumPlan] = useState(true);

  // Quick Action & Override Modal State
  const [extendingCoachId, setExtendingCoachId] = useState<string | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    coach: any;
    daysToAdd: number;
    customDate: string;
    planTier: string;
    reason: string;
  } | null>(null);

  // Configurable Dynamic Plan Feature Points
  const [freePlanFeatures, setFreePlanFeatures] = useState<PlanFeature[]>(DEFAULT_FREE_FEATURES);
  const [standardPlanFeatures, setStandardPlanFeatures] = useState<PlanFeature[]>(DEFAULT_STANDARD_FEATURES);
  const [premiumPlanFeatures, setPremiumPlanFeatures] = useState<PlanFeature[]>(DEFAULT_PREMIUM_FEATURES);

  // Trial Bookings
  const [allowTrialBookings, setAllowTrialBookings] = useState(true);

  // Registered Coaches for Subscription Audit
  const [coaches, setCoaches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState<'ALL' | 'PAID' | 'FREE'>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDashboardData();
      if (res.coaches) {
        setCoaches(res.coaches);
      }
      if (res.config) {
        setStandardPlanPrice(Number(res.config.standardPlanPrice) || 1499);
        setPremiumPlanPrice(Number(res.config.premiumPlanPrice) || 3999);
        setAllowTrialBookings((res.config as any)?.allowTrialBookings ?? true);

        const trialDays = res.config.freeTierDurationDays ? Number(res.config.freeTierDurationDays) : 90;
        setFreeTierDurationDays(trialDays);
        setIsCustomDays(![30, 60, 90].includes(trialDays));

        setAllowFreeTierPublicListing(
          res.config.allowFreeTierPublicListing !== undefined
            ? Boolean(res.config.allowFreeTierPublicListing)
            : true
        );
        setEnableFreePlan(
          res.config.enableFreePlan !== undefined
            ? Boolean(res.config.enableFreePlan)
            : true
        );
        setEnableStandardPlan(
          res.config.enableStandardPlan !== undefined
            ? Boolean(res.config.enableStandardPlan)
            : true
        );
        setEnablePremiumPlan(
          res.config.enablePremiumPlan !== undefined
            ? Boolean(res.config.enablePremiumPlan)
            : true
        );

        if (res.config.freePlanFeatures) {
          setFreePlanFeatures(parseFeatures(res.config.freePlanFeatures, DEFAULT_FREE_FEATURES));
        }
        if (res.config.standardPlanFeatures) {
          setStandardPlanFeatures(parseFeatures(res.config.standardPlanFeatures, DEFAULT_STANDARD_FEATURES));
        }
        if (res.config.premiumPlanFeatures) {
          setPremiumPlanFeatures(parseFeatures(res.config.premiumPlanFeatures, DEFAULT_PREMIUM_FEATURES));
        }
      }
    } catch (err) {
      console.error("Failed to load plans config:", err);
      showToast("Error loading plan settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCoachPlans = () => {
    startTransition(async () => {
      const res = await updatePlatformConfig({
        standardPlanPrice: Number(standardPlanPrice),
        premiumPlanPrice: Number(premiumPlanPrice),
        allowFreeTierPublicListing,
        enableFreePlan,
        freeTierDurationDays: Number(freeTierDurationDays) || 90,
        enableStandardPlan,
        enablePremiumPlan,
        freePlanFeatures: serializeFeatureItems(freePlanFeatures),
        standardPlanFeatures: serializeFeatureItems(standardPlanFeatures),
        premiumPlanFeatures: serializeFeatureItems(premiumPlanFeatures),
      });
      if (res.success) {
        await refreshConfig();
        showToast("✅ Coach subscription plans, pricing, free duration & dynamic features saved!");
      } else {
        showToast("❌ Failed to save subscription pricing");
      }
    });
  };

  const handleQuickExtend = async (coachId: string, days: number = 30) => {
    setExtendingCoachId(coachId);
    try {
      const res = await adminExtendCoachSubscription(coachId, days);
      if (res.success) {
        showToast(`✅ ${res.message}`);
        await loadData();
      } else {
        showToast(`❌ ${res.message}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message || 'Failed to extend subscription'}`);
    } finally {
      setExtendingCoachId(null);
    }
  };

  const handleApplyOverride = async () => {
    if (!overrideModal?.coach?.id) return;
    startTransition(async () => {
      try {
        let res;
        if (overrideModal.customDate) {
          res = await adminSetCoachCustomExpiry(
            overrideModal.coach.id,
            overrideModal.customDate,
            overrideModal.planTier as any,
            overrideModal.reason
          );
        } else {
          res = await adminExtendCoachSubscription(
            overrideModal.coach.id,
            Number(overrideModal.daysToAdd) || 30,
            overrideModal.reason
          );
        }
        if (res.success) {
          showToast(`✅ ${res.message}`);
          setOverrideModal(null);
          await loadData();
        } else {
          showToast(`❌ ${res.message}`);
        }
      } catch (err: any) {
        showToast(`❌ Error: ${err?.message || 'Failed to apply override'}`);
      }
    });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Coach Plans & Monetization" />;
  }

  // Filter coaches for subscription audit ledger
  const filteredCoaches = coaches.filter((c) => {
    const nameMatch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.headCoachName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.planPaymentId?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!nameMatch) return false;

    if (subFilter === 'PAID') {
      return c.planTier === 'STANDARD' || c.planTier === 'PREMIUM';
    }
    if (subFilter === 'FREE') {
      return !c.planTier || c.planTier === 'FREE';
    }
    return true;
  });

  const paidCount = coaches.filter((c) => c.planTier === 'STANDARD' || c.planTier === 'PREMIUM').length;
  const freeCount = coaches.filter((c) => !c.planTier || c.planTier === 'FREE').length;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <CurrencyInr size={16} weight="bold" className="text-emerald-400" />
              Coach Subscription &amp; Commercial Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Coach Plans &amp; Monetization Configuration
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Configure academy subscription tiers, plan activation toggles, commercial prices, feature inclusions/exclusions, free tier public directory listing, and track Razorpay payments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/payments"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <CreditCard size={16} weight="bold" />
              <span>Razorpay Gateway Keys</span>
            </Link>
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Reload Settings</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            SECTION 1: COACH & ACADEMY SUBSCRIPTION TIERS & POLICIES
           ======================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black shadow-xs">
                <Buildings size={26} weight="fill" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Coach &amp; Academy Subscription Architecture
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Configure free tier listing permissions, plan activation toggles, commercial fees, and included feature points
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCoachPlans}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Save Plan Configuration</span>
            </button>
          </div>

          {/* Platform Public Listing Policy on Free Tier */}
          <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    Public Discovery Listing Policy for Free Tier
                  </span>
                  {allowFreeTierPublicListing ? (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Eye size={12} weight="bold" /> Allowed Publicly
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <EyeSlash size={12} weight="bold" /> Hidden / Requires Paid Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed max-w-3xl">
                  {allowFreeTierPublicListing
                    ? "Free Tier academies are currently visible to parents in public search, category filters, and activity detail pages."
                    : "⚠️ Free Tier academies are hidden from public discovery. Academies must purchase a Standard or Premium Plan via Razorpay to be listed publicly."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-700">
                  {allowFreeTierPublicListing ? "Allow Free Public Listing" : "Restrict Free Listing"}
                </span>
                <button
                  type="button"
                  onClick={() => setAllowFreeTierPublicListing(!allowFreeTierPublicListing)}
                  className="cursor-pointer transition-transform active:scale-95"
                >
                  {allowFreeTierPublicListing ? (
                    <ToggleRight size={38} weight="fill" className="text-emerald-600" />
                  ) : (
                    <ToggleLeft size={38} weight="fill" className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Three Tier Management Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* 1. FREE STANDARD PARTNER */}
            <div className={`p-5 rounded-2xl border transition-all space-y-4 ${enableFreePlan ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TIER 1</span>
                  <h3 className="text-sm font-black text-slate-900">Free Standard Partner</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${enableFreePlan ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {enableFreePlan ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableFreePlan(!enableFreePlan)}
                    className="cursor-pointer"
                  >
                    {enableFreePlan ? (
                      <ToggleRight size={30} weight="fill" className="text-emerald-600" />
                    ) : (
                      <ToggleLeft size={30} weight="fill" className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-500">Subscription Price</div>
                <div className="text-2xl font-black text-slate-900">₹0 <span className="text-xs font-medium text-slate-500">/ trial</span></div>
                <p className="text-[10px] text-slate-400">Zero upfront cost for newly registered coaches.</p>
              </div>

              {/* Configurable Free Tier Duration (Option 1) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    Free Tier Duration
                  </label>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                    {freeTierDurationDays} Days
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {FREE_TRIAL_PRESETS.map((preset) => {
                    const isSelected = !isCustomDays && freeTierDurationDays === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => {
                          setIsCustomDays(false);
                          setFreeTierDurationDays(preset.days);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomDays(true)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
                      isCustomDays
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {isCustomDays && (
                  <div className="flex items-center gap-2 pt-1 animate-fade-in">
                    <input
                      type="number"
                      min={1}
                      max={730}
                      value={freeTierDurationDays}
                      onChange={(e) => setFreeTierDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <span className="text-xs text-slate-500 font-medium">days trial validity</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 leading-tight">
                  New coaches receive active operational tools for this duration upon sign up. When expired, operations and public listing are locked until renewed.
                </p>
              </div>

              {/* Dynamic Feature Points Config */}
              <DynamicPlanFeaturesEditor
                label="Feature Benefits & Coverage"
                features={freePlanFeatures}
                onChange={setFreePlanFeatures}
                accentColor="emerald"
                placeholder="e.g. Receive up to 5 parent trial leads per month..."
              />
            </div>

            {/* 2. STANDARD / GROWTH PARTNER */}
            <div className={`p-5 rounded-2xl border transition-all space-y-4 ${enableStandardPlan ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-blue-200/80">
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">TIER 2</span>
                  <h3 className="text-sm font-black text-slate-900">Growth Partner</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${enableStandardPlan ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                    {enableStandardPlan ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableStandardPlan(!enableStandardPlan)}
                    className="cursor-pointer"
                  >
                    {enableStandardPlan ? (
                      <ToggleRight size={30} weight="fill" className="text-blue-600" />
                    ) : (
                      <ToggleLeft size={30} weight="fill" className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Price Config */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Monthly Price (₹):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={standardPlanPrice}
                    onChange={(e) => setStandardPlanPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Annual equivalent: ₹{(standardPlanPrice * 10).toLocaleString('en-IN')}/yr (20% off)
                </div>
              </div>

              {/* Dynamic Feature Points Config */}
              <DynamicPlanFeaturesEditor
                label="Feature Benefits & Coverage"
                features={standardPlanFeatures}
                onChange={setStandardPlanFeatures}
                accentColor="blue"
                placeholder="e.g. Priority search ranking above free academies..."
              />
            </div>

            {/* 3. PRO / VERIFIED PREMIER PARTNER */}
            <div className={`p-5 rounded-2xl border transition-all space-y-4 ${enablePremiumPlan ? 'bg-purple-50/50 border-purple-300 shadow-xs ring-1 ring-purple-300/50' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                <div>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">TIER 3 (PRO)</span>
                  <h3 className="text-sm font-black text-slate-900">Verified Pro Partner</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${enablePremiumPlan ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
                    {enablePremiumPlan ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnablePremiumPlan(!enablePremiumPlan)}
                    className="cursor-pointer"
                  >
                    {enablePremiumPlan ? (
                      <ToggleRight size={30} weight="fill" className="text-purple-600" />
                    ) : (
                      <ToggleLeft size={30} weight="fill" className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Price Config */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Monthly Price (₹):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-extrabold text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={premiumPlanPrice}
                    onChange={(e) => setPremiumPlanPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="text-[10px] text-purple-700 font-bold">
                  Annual equivalent: ₹{(premiumPlanPrice * 10).toLocaleString('en-IN')}/yr (20% off)
                </div>
              </div>

              {/* Dynamic Feature Points Config */}
              <DynamicPlanFeaturesEditor
                label="Feature Benefits & Coverage"
                features={premiumPlanFeatures}
                onChange={setPremiumPlanFeatures}
                accentColor="purple"
                placeholder="e.g. #1 Top of Area priority placement in locality..."
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 2: ACADEMY SUBSCRIPTIONS & RAZORPAY PAYMENT AUDIT LEDGER
           ======================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black shadow-xs">
                <CreditCard size={26} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    Coach &amp; Academy Subscription Audit Ledger
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Razorpay Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time tracking of which academies purchased plans via Razorpay vs free accounts
                </p>
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Summary:</span>
              <span className="text-xs font-extrabold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-xl">
                {paidCount} Paid Subscribers
              </span>
              <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                {freeCount} Unsubscribed / Unlisted
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search academy, coach, Razorpay ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(['ALL', 'PAID', 'FREE'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSubFilter(filter)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    subFilter === filter
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'ALL' ? `All (${coaches.length})` : filter === 'PAID' ? `Paid Subscribers (${paidCount})` : `Unsubscribed (${freeCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Ledger Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="py-3 px-4">Academy &amp; Coach</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Payment &amp; Razorpay Status</th>
                    <th className="py-3 px-4">Billing Cycle &amp; Renewal</th>
                    <th className="py-3 px-4">Directory Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCoaches.map((coach) => {
                    const subStatus = getCentreSubscriptionStatus(coach, {
                      allowFreeTierPublicListing,
                      enableFreePlan,
                      freeTierDurationDays,
                    });

                    return (
                      <tr key={coach.id} className="hover:bg-slate-50 transition-colors">
                        {/* Academy Details */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{coach.name}</span>
                              {coach.planTier === 'PREMIUM' && (
                                <Crown size={13} weight="fill" className="text-amber-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Coach: {coach.headCoachName || 'Assigned Coach'} • {coach.locality || coach.city || 'Verified Facility'}
                            </div>
                          </div>
                        </td>

                        {/* Plan Tier Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                              subStatus.isExpired
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : coach.planTier === 'PREMIUM'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : coach.planTier === 'STANDARD'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : subStatus.isTrial
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {coach.planTier || (subStatus.isTrial ? 'TRIAL' : 'FREE')}
                          </span>
                        </td>

                        {/* Payment & Subscription Status */}
                        <td className="py-3.5 px-4">
                          {subStatus.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                              <WarningCircle size={12} weight="bold" /> Expired ({subStatus.formattedExpiry})
                            </span>
                          ) : subStatus.isTrial ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                                <Clock size={12} weight="bold" /> Trial Active ({subStatus.daysRemaining}d left)
                              </span>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Valid until: {subStatus.formattedExpiry}
                              </div>
                            </div>
                          ) : subStatus.canOperate ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                <CheckCircle size={12} weight="fill" /> Active ({subStatus.daysRemaining}d left)
                              </span>
                              <div className="font-mono text-[10px] text-slate-500">
                                {coach.planPaymentId || 'Verified Subscription'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              No Active Plan (Locked)
                            </span>
                          )}
                        </td>

                        {/* Billing Cycle & Expiration */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          <div>
                            <div className="font-bold text-slate-800 capitalize">
                              {coach.planBillingCycle || (subStatus.isTrial ? 'Trial' : 'Monthly')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {coach.planExpiresAt
                                ? `${subStatus.isExpired ? 'Expired: ' : 'Expires: '}${new Date(coach.planExpiresAt).toLocaleDateString('en-IN')}`
                                : 'No expiry set'}
                            </div>
                          </div>
                        </td>

                        {/* Public Directory Status */}
                        <td className="py-3.5 px-4">
                          {subStatus.canPublicList ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Eye size={12} weight="bold" /> Listed in Directory
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <EyeSlash size={12} weight="bold" /> {subStatus.isExpired ? 'Hidden (Expired)' : 'Hidden (Requires Plan)'}
                            </span>
                          )}
                        </td>

                        {/* Actions (Requirement D: Manual Extension) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={extendingCoachId === coach.id}
                              onClick={() => handleQuickExtend(coach.id, 30)}
                              className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer disabled:opacity-50"
                              title="Quick extend validity by 30 days"
                            >
                              {extendingCoachId === coach.id ? (
                                <ArrowsClockwise size={12} className="animate-spin" />
                              ) : (
                                <span>+30d</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setOverrideModal({
                                  isOpen: true,
                                  coach,
                                  daysToAdd: 30,
                                  customDate: coach.planExpiresAt ? new Date(coach.planExpiresAt).toISOString().split('T')[0] : '',
                                  planTier: coach.planTier || 'STANDARD',
                                  reason: '',
                                })
                              }
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                            >
                              <PencilSimple size={12} />
                              <span>Manage</span>
                            </button>
                            <Link
                              href={`/activities/${coach.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                              title="View public profile"
                            >
                              <ArrowSquareOut size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCoaches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No coaching academies found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Subscription Extension Modal (Requirement D) */}
      {overrideModal?.isOpen && overrideModal.coach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                  Admin Subscription Override
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Manage Validity: {overrideModal.coach.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Current Tier: <strong className="text-slate-800">{overrideModal.coach.planTier || 'FREE'}</strong> • Current Expiry: {overrideModal.coach.planExpiresAt ? new Date(overrideModal.coach.planExpiresAt).toLocaleDateString('en-IN') : 'None'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Quick Extension Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 block">
                Quick Extend Days
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      setOverrideModal({
                        ...overrideModal,
                        daysToAdd: days,
                        customDate: '',
                      })
                    }
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      overrideModal.daysToAdd === days && !overrideModal.customDate
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Or Specific Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">
                Or Set Exact Expiry Date
              </label>
              <input
                type="date"
                value={overrideModal.customDate}
                onChange={(e) =>
                  setOverrideModal({
                    ...overrideModal,
                    customDate: e.target.value,
                    daysToAdd: 0,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Plan Tier Adjustment */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">
                Override Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['FREE', 'STANDARD', 'PREMIUM'].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() =>
                      setOverrideModal({
                        ...overrideModal,
                        planTier: tier,
                      })
                    }
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      overrideModal.planTier === tier
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">
                Administrative Reason / Audit Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Promotional extension, tournament partner, dispute resolution..."
                value={overrideModal.reason}
                onChange={(e) =>
                  setOverrideModal({
                    ...overrideModal,
                    reason: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleApplyOverride}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                Apply Validity Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
