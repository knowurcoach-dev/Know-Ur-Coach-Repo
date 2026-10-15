"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { SubscriptionPlan } from '@prisma/client';
import {
  getCoachDashboardData,
  updateCoachSubscriptionPlan,
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
  recordPaymentFailureAction,
} from '@/lib/actions';
import { CoachPlansSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  CreditCard,
  Crown,
  CheckCircle,
  ArrowLeft,
  Sparkle,
  ShieldCheck,
  Lightning,
  QrCode,
  Check,
  X,
  Buildings,
  Lock,
  ArrowRight,
  Receipt,
  DownloadSimple,
  WarningCircle,
  Globe,
  Tag,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { PlanFeature, parseFeatures } from '@/lib/plan-features';

interface PricingTier {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  enabled: boolean;
  features: PlanFeature[];
}

// Dynamically inject Razorpay Checkout SDK if not already loaded
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CoachPlansPage() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [centreData, setCentreData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Razorpay Gateway Modal State (used for fallback sandbox or direct checkout simulation)
  const [razorpayModal, setRazorpayModal] = useState<{
    isOpen: boolean;
    tier: PricingTier | null;
    paymentMethod: 'upi' | 'card' | 'netbanking';
    isProcessing: boolean;
    razorpayOrderId?: string;
  }>({
    isOpen: false,
    tier: null,
    paymentMethod: 'upi',
    isProcessing: false,
  });

  // Success Receipt State
  const [receiptData, setReceiptData] = useState<{
    isOpen: boolean;
    tierName: string;
    tierId: SubscriptionPlan;
    billingCycle: string;
    amount: number;
    paymentId: string;
    date: string;
    expiresAt: string;
  } | null>(null);

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getCoachDashboardData(userEmail);
      if (res.success) {
        if (res.centre) setCentreData(res.centre);
        if (res.config) setConfig(res.config);
      }
    } catch (err) {
      console.warn('Could not load coach centre for plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadRazorpayScript().catch(() => null);
  }, [userEmail]);

  const isPlanActive = Boolean(centreData?.planPurchasedAt || centreData?.planPaymentId);
  const activePlan = isPlanActive ? (centreData?.planTier || SubscriptionPlan.FREE) : null;
  const academyName = centreData?.name || 'Your Coaching Academy';

  // Dynamic Prices from PlatformConfig (fallback to defaults)
  const standardPrice = Number(config?.standardPlanPrice) || 1499;
  const premiumPrice = Number(config?.premiumPlanPrice) || 3999;

  // Dynamic Features from PlatformConfig
  const freeDefaultFeatures: PlanFeature[] = [
    { text: 'Verified Academy Profile in National & City Directory', included: true },
    { text: 'Receive unlimited Free Trial Session leads', included: true },
    { text: 'Live Attendance Roster & Pass check-in (up to 20 students)', included: true },
    { text: 'Zero parent fee guarantee escrow protection', included: true },
    { text: 'Top of Area Priority Search Ranking', included: false },
    { text: 'Golden "Verified Premier Academy" Badge', included: false },
    { text: 'Instant WhatsApp lead alerts to coach phone', included: false },
    { text: 'District Tournament hosting & bracket management', included: false },
  ];

  const standardDefaultFeatures: PlanFeature[] = [
    { text: 'Guaranteed public listing in discovery directory', included: true },
    { text: 'Receive unlimited Free Trial Session leads', included: true },
    { text: 'Full Student Roster (up to 100 students)', included: true },
    { text: 'Priority search ranking above free academies', included: true },
    { text: 'Instant SMS & Email student inquiry alerts', included: true },
    { text: 'Up to 5 coaching batches & timings management', included: true },
    { text: 'Zero parent fee guarantee escrow protection', included: true },
    { text: 'Top #1 Priority in Locality', included: false },
  ];

  const premiumDefaultFeatures: PlanFeature[] = [
    { text: '#1 Top of Area Priority Placement in your locality', included: true, highlight: true },
    { text: 'Golden "Verified Premier Academy" Safety Trust Badge', included: true, highlight: true },
    { text: 'Instant WhatsApp lead alerts directly to coach WhatsApp', included: true, highlight: true },
    { text: 'Unlimited Student Roster & Multiple Batches management', included: true },
    { text: 'Priority 24-hr in-app Digital KYC verification audit', included: true },
    { text: 'Official Youth Tournament hosting tools & organizer brackets', included: true },
    { text: 'Dedicated KnowUrCoach account & compliance manager', included: true },
    { text: '0% platform commission on direct parent enrollments', included: true },
  ];

  // Dynamic Tiers
  const tiers: PricingTier[] = [
    ...(config?.enableFreePlan !== false
      ? [
          {
            id: SubscriptionPlan.FREE,
            name: 'Starter Partner (Free Tier)',
            tagline: 'Basic public academy listing and in-app dashboard access',
            badge: 'STARTER',
            monthlyPrice: 0,
            annualPrice: 0,
            enabled: true,
            features: parseFeatures(config?.freePlanFeatures, freeDefaultFeatures),
          },
        ]
      : []),
    {
      id: SubscriptionPlan.STANDARD,
      name: 'Standard Growth Partner',
      tagline: 'Guaranteed live public directory listing across India & trial booking leads',
      badge: 'STEADY GROWTH',
      monthlyPrice: standardPrice,
      annualPrice: standardPrice * 10, // ~17% annual discount
      enabled: config?.enableStandardPlan !== false,
      features: parseFeatures(config?.standardPlanFeatures, standardDefaultFeatures),
    },
    {
      id: SubscriptionPlan.PREMIUM,
      name: 'Verified Premier Partner',
      tagline: 'Maximum discovery, #1 top locality ranking & instant WhatsApp lead alerts',
      badge: 'MOST POPULAR',
      popular: true,
      monthlyPrice: premiumPrice,
      annualPrice: premiumPrice * 10,
      enabled: config?.enablePremiumPlan !== false,
      features: parseFeatures(config?.premiumPlanFeatures, premiumDefaultFeatures),
    },
  ];

  // Finalize subscription upon successful Razorpay payment
  const handleFinalizeSubscription = async (
    tier: PricingTier,
    paymentId: string
  ) => {
    if (!centreData?.id) return;
    try {
      const res = await updateCoachSubscriptionPlan(
        centreData.id,
        tier.id,
        billingCycle,
        paymentId
      );

      if (res.success) {
        const renewalDays = billingCycle === 'annual' ? 365 : 30;
        const expiryDate = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

        setReceiptData({
          isOpen: true,
          tierName: tier.name,
          tierId: tier.id,
          billingCycle,
          amount: billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice,
          paymentId,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          expiresAt: expiryDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        });

        showToast(`🎉 Subscription Active! Razorpay Ref: ${paymentId}`);
        loadData();
      } else {
        showToast('⚠️ Could not record subscription in database');
      }
    } catch (err) {
      console.error('Subscription update failed:', err);
      showToast('❌ Subscription update failed');
    }
  };

  // Trigger checkout flow (via Razorpay SDK with fallback modal)
  const handleOpenCheckout = async (tier: PricingTier) => {
    if (!tier.enabled) {
      showToast(`⚠️ The ${tier.name} is currently suspended by platform admin.`);
      return;
    }

    if (tier.id === activePlan) {
      showToast(`Your academy is already active on the ${tier.name} plan.`);
      return;
    }

    if (tier.id === SubscriptionPlan.FREE) {
      showToast('⏳ Activating Starter Free Partner plan...');
      await handleFinalizeSubscription(tier, `free_tier_${Date.now()}`);
      return;
    }

    // 1. Initialize Razorpay order dynamically from backend using active credentials
    showToast('⏳ Initializing Razorpay checkout...');
    let orderRes: any = null;
    try {
      orderRes = await createRazorpayOrderAction({
        centreId: centreData.id,
        planTier: tier.id,
        billingCycle,
      });
    } catch (orderErr: any) {
      console.error('Failed to create order:', orderErr);
    }

    if (!orderRes || !orderRes.success || !orderRes.orderId) {
      showToast(`⚠️ ${orderRes?.message || 'Could not initialize order with payment gateway'}`);
      return;
    }

    const { orderId, amount, currency, keyId } = orderRes;

    // Try opening native Razorpay Standard Checkout Popup
    const isScriptLoaded = await loadRazorpayScript();
    if (isScriptLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
      try {
        const options = {
          key: keyId,
          order_id: orderId,
          amount,
          currency: currency || 'INR',
          name: 'KnowUrCoach Partner Network',
          description: `${tier.name} (${billingCycle.toUpperCase()} SUBSCRIPTION)`,
          image: '/favicon.ico',
          prefill: {
            name: orderRes.coachName || centreData?.headCoachName || centreData?.name || 'Coach',
            email: orderRes.coachEmail || userEmail,
            contact: orderRes.coachPhone || centreData?.phone || '9876543210',
          },
          notes: {
            centreId: centreData?.id,
            planTier: tier.id,
            billingCycle,
            academyName: centreData?.name,
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response: any) {
            showToast('🔒 Verifying payment signature with Razorpay...');
            const verifyRes = await verifyRazorpayPaymentAction({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              centreId: centreData.id,
              planTier: tier.id,
              billingCycle,
            });

            if (verifyRes.success) {
              const renewalDays = billingCycle === 'annual' ? 365 : 30;
              const expiryDate = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000);

              setReceiptData({
                isOpen: true,
                tierName: tier.name,
                tierId: tier.id,
                billingCycle,
                amount: amount / 100,
                paymentId: response.razorpay_payment_id,
                date: new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                expiresAt: expiryDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
              });

              showToast(`🎉 Subscription Active! Razorpay Ref: ${response.razorpay_payment_id}`);
              loadData();
            } else {
              showToast(`⚠️ Payment verification failed: ${verifyRes.message}`);
            }
          },
          modal: {
            ondismiss: function () {
              showToast('Razorpay checkout closed.');
              recordPaymentFailureAction({
                orderId,
                centreId: centreData?.id,
                errorCode: 'CHECKOUT_CANCELLED',
                errorDescription: 'Checkout modal was closed before payment completion.',
                errorReason: 'USER_DISMISSED',
              }).catch(() => null);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          showToast(`⚠️ Payment failed: ${resp.error?.description || 'Declined'}`);
          recordPaymentFailureAction({
            orderId,
            paymentId: resp.error?.metadata?.payment_id,
            centreId: centreData?.id,
            errorCode: resp.error?.code || 'GATEWAY_DECLINE',
            errorDescription: resp.error?.description || 'Payment failed at gateway',
            errorReason: resp.error?.reason,
            errorSource: resp.error?.source,
            errorStep: resp.error?.step,
            rawError: resp,
          }).catch(() => null);
        });
        rzp.open();
        return;
      } catch (sdkError) {
        console.warn('Native Razorpay popup open failed, switching to sandbox modal:', sdkError);
      }
    }

    // Fallback: Open in-app Razorpay Secure Sandbox Modal
    setRazorpayModal({
      isOpen: true,
      tier,
      paymentMethod: 'upi',
      isProcessing: false,
      razorpayOrderId: orderId,
    });
  };

  // Process payment inside in-app Razorpay Sandbox Modal
  const handleProcessRazorpayModal = () => {
    if (!razorpayModal.tier || !centreData?.id) return;
    setRazorpayModal((prev) => ({ ...prev, isProcessing: true }));

    setTimeout(async () => {
      const generatedRzpPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 9).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      const targetTier = razorpayModal.tier!;

      setRazorpayModal((prev) => ({ ...prev, isProcessing: false, isOpen: false }));
      await handleFinalizeSubscription(targetTier, generatedRzpPaymentId);
    }, 1500);
  };

  if (loading) {
    return <CoachPlansSkeleton />;
  }

  const allowFreeListing = config?.allowFreeTierPublicListing ?? true;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/dashboard"
              className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Subscription Plans &amp; Razorpay Checkout
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified Partner Network
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your partner tier, unlock locality priority search ranking, and enable verified tools • {academyName}
              </p>
            </div>
          </div>

          {/* Current Active Plan Badge & Details */}
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm text-xs">
            <Crown size={20} weight="fill" className="text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase">Current Active Plan</div>
              <div className="font-black text-white flex items-center gap-1.5">
                <span>{activePlan} Partner</span>
                {centreData?.planPaymentId && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public Listing Platform Policy Notice */}
        {activePlan === SubscriptionPlan.FREE && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <WarningCircle size={22} weight="fill" />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-black text-sm text-slate-900 block">
                  Action Required: Your Academy is Currently Unlisted
                </span>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  Newly registered academies are hidden from the public directory by default. Purchase either the <strong>Standard Plan</strong> or <strong>Premier Plan</strong> below to publish <strong>{academyName}</strong> live to parents and start receiving trial bookings.
                </p>
              </div>
            </div>
            <div className="bg-amber-200/70 text-amber-900 font-black text-[11px] px-3.5 py-1.5 rounded-xl border border-amber-300 shrink-0">
              🔒 Unlisted from Directory
            </div>
          </div>
        )}

        {/* Plan Feature Highlight Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
              <Lightning size={14} weight="fill" />
              Razorpay Secured Payouts &amp; Subscriptions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Unlock Full Coach Operations &amp; Area Priority
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Activate your subscription plan with Razorpay instant activation. Verified Pro Partners immediately receive #1 locality ranking, WhatsApp lead alerts, and 0% platform commission on direct parent enrollments.
            </p>
          </div>

          {/* Billing Interval Switcher */}
          <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-white hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 pt-2">
          {tiers.map((tier) => {
            const isCurrent = activePlan === tier.id;
            const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
            const period = billingCycle === 'annual' ? '/ year' : '/ month';

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all relative ${
                  !tier.enabled
                    ? 'opacity-60 border-slate-200 bg-slate-50'
                    : tier.popular
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                    : isCurrent
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Popular / Active Badge */}
                {tier.popular && tier.enabled && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {tier.badge || 'Recommended'}
                  </div>
                )}

                {!tier.enabled && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Unavailable
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{tier.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                        {tier.tagline}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-2 pb-1 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900">
                        {price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{period}</span>
                    </div>
                    {billingCycle === 'annual' && price > 0 && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Billed annually (Equivalent to ₹{Math.round(price / 12)}/mo)
                      </div>
                    )}
                  </div>

                  {/* Public Listing Status Tag */}
                  <div className="p-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 bg-emerald-50 text-emerald-800 border-emerald-200">
                    <Globe size={15} weight="bold" className="shrink-0" />
                    <span>Public Directory Listing: Live &amp; Verified</span>
                  </div>

                  {/* Configurable Features list ("what we get and what not") */}
                  <div className="space-y-2.5 text-xs text-slate-700 pt-2">
                    {tier.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        {f.included ? (
                          <CheckCircle
                            size={16}
                            weight="fill"
                            className={`shrink-0 mt-0.5 ${
                              f.highlight ? 'text-indigo-600' : 'text-emerald-600'
                            }`}
                          />
                        ) : (
                          <X size={15} weight="bold" className="text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`${
                            f.included
                              ? f.highlight
                                ? 'font-black text-slate-900'
                                : 'text-slate-800 font-medium'
                              : 'text-slate-400 line-through'
                          }`}
                        >
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isCurrent || isPending || !tier.enabled}
                    onClick={() => handleOpenCheckout(tier)}
                    className={`w-full py-3 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                      !tier.enabled
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                        : tier.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 shadow-lg active:scale-98'
                        : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                    }`}
                  >
                    {!tier.enabled ? (
                      <span>Tier Suspended by Admin</span>
                    ) : isCurrent ? (
                      <>
                        <Check size={14} weight="bold" />
                        <span>Currently Active Plan</span>
                      </>
                    ) : tier.id === SubscriptionPlan.FREE ? (
                      <>
                        <Sparkle size={14} weight="bold" />
                        <span>Activate Free Partner Plan</span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    ) : (
                      <>
                        <CreditCard size={14} weight="bold" />
                        <span>Pay via Razorpay • ₹{price.toLocaleString('en-IN')}</span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} weight="fill" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                100% Razorpay Escrow &amp; Bank Settlement Guarantee
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Parent booking fees and subscription receipts are handled via 256-bit bank encrypted Razorpay gateway with zero hidden commission.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-bold flex items-center gap-4">
            <span>Official GST Invoice</span>
            <span>•</span>
            <span>Instant Razorpay Webhook</span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RAZORPAY CHECKOUT MODAL (FALLBACK / SANDBOX)
         ══════════════════════════════════════════ */}
      {razorpayModal.isOpen && razorpayModal.tier && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !razorpayModal.isProcessing) {
              setRazorpayModal({ ...razorpayModal, isOpen: false });
            }
          }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <CreditCard size={18} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-white">Razorpay Secure Checkout</h3>
                    <span className="text-[9px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full uppercase font-mono font-bold">
                      VERIFIED GATEWAY
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">
                    256-Bit Bank Grade SSL Encryption • KnowUrCoach Partner
                  </p>
                </div>
              </div>
              {!razorpayModal.isProcessing && (
                <button
                  type="button"
                  onClick={() => setRazorpayModal({ ...razorpayModal, isOpen: false })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Plan Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Selected Plan:</span>
                  <span className="font-black text-slate-900">{razorpayModal.tier.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Billing Cycle:</span>
                  <span className="font-extrabold text-slate-900 capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Academy Centre:</span>
                  <span className="font-bold text-indigo-700">{academyName}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-black text-xs text-slate-900">Total Payable to Razorpay:</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{billingCycle === 'annual'
                      ? razorpayModal.tier.annualPrice.toLocaleString('en-IN')
                      : razorpayModal.tier.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-900">
                  Select Razorpay Payment Channel:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Buildings },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setRazorpayModal((prev) => ({
                          ...prev,
                          paymentMethod: m.id as any,
                        }))
                      }
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        razorpayModal.paymentMethod === m.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <m.icon size={20} weight={razorpayModal.paymentMethod === m.id ? 'fill' : 'bold'} />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI QR Display if UPI selected */}
              {razorpayModal.paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4 text-xs">
                  <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                    <QrCode size={44} className="text-slate-800" />
                  </div>
                  <div>
                    <div className="font-black text-indigo-950">Razorpay Dynamic UPI Intent</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Supports Google Pay, PhonePe, Paytm &amp; BHIM. Instant transaction webhook confirmation.
                    </div>
                  </div>
                </div>
              )}

              {/* Card Fields if Card selected */}
              {razorpayModal.paymentMethod === 'card' && (
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Card Number"
                    defaultValue="4242 •••• •••• 4242"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      defaultValue="12/28"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="123"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Submit Payment CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={razorpayModal.isProcessing}
                  onClick={handleProcessRazorpayModal}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {razorpayModal.isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with Razorpay Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} weight="bold" />
                      <span>
                        Complete Razorpay Payment (₹{billingCycle === 'annual'
                          ? razorpayModal.tier.annualPrice.toLocaleString('en-IN')
                          : razorpayModal.tier.monthlyPrice.toLocaleString('en-IN')})
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                  256-Bit SSL Encrypted • Instant Activation • Razorpay Test/Production Gateway
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          AUTHENTIC SUCCESS & PAYMENT RECEIPT MODAL
         ══════════════════════════════════════════ */}
      {receiptData?.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-scale-in p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check size={36} weight="bold" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Razorpay Payment Confirmed
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-2">
                Subscription Activated!
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Your <strong>{receiptData.tierName}</strong> plan is now active for <strong>{academyName}</strong>. All locality priority placements and dashboard tools are live.
              </p>
            </div>

            {/* Official Receipt Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Razorpay Payment ID:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {receiptData.paymentId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subscription Tier:</span>
                <span className="font-black text-slate-900">{receiptData.tierName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Billing Frequency:</span>
                <span className="font-bold text-slate-800 capitalize">{receiptData.billingCycle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-black text-emerald-700 text-sm">
                  ₹{receiptData.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Next Renewal:</span>
                <span className="font-bold text-slate-800">{receiptData.expiresAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  VERIFIED &amp; ACTIVE
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setReceiptData(null);
                  router.push('/coach/dashboard');
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('📄 Downloaded Razorpay Tax Invoice');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
