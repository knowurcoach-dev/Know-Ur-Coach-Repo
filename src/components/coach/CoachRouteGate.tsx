"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCoachDashboardData } from '@/lib/actions';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Lock,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Buildings,
  WarningCircle,
  Sparkle,
} from '@phosphor-icons/react';

const LOCKED_ROUTES = [
  '/coach/attendance',
  '/coach/leads',
  '/coach/students',
  '/coach/batches',
  '/coach/revenue',
  '/coach/promote',
  '/coach/listings',
];

interface CoachRouteGateProps {
  children: React.ReactNode;
}

export function CoachRouteGate({ children }: CoachRouteGateProps) {
  const pathname = usePathname();
  const { session, user } = useAuth();
  const [centreData, setCentreData] = useState<any>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function checkStatus() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      try {
        const res = await getCoachDashboardData(userEmail);
        if (res.success && res.centre) {
          setCentreData(res.centre);
          if (res.config) setConfigData(res.config);
        }
      } catch (err) {
        console.warn('CoachRouteGate check error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [userEmail, pathname]);

  // Check if current route is one of the restricted operations routes
  const isRestrictedRoute = LOCKED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isRestrictedRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <GeneralCoachPageSkeleton />;
  }

  // Profile completion criteria
  const hasBasicProfile = Boolean(centreData?.name?.trim() && centreData?.address?.trim());
  const hasSubmittedKyc =
    centreData?.kycStatus === 'DOCS_REVIEW' ||
    centreData?.kycStatus === 'APPROVED' ||
    centreData?.kycStatus === 'INSPECTION_SCHEDULED' ||
    Boolean(centreData?.statusNotes && centreData.statusNotes.includes('In-app digital KYC submitted'));

  const isProfileComplete = hasBasicProfile && (hasSubmittedKyc || (centreData?.batches && centreData.batches.length > 0));

  // Compute live subscription status using the unified subscription engine
  const subStatus = getCentreSubscriptionStatus(centreData, configData);

  // Full access requires an active, unexpired subscription or valid trial
  if (subStatus.canOperate) {
    return <>{children}</>;
  }

  // If expired specifically, show high-urgency renewal gate
  if (subStatus.status === 'EXPIRED') {
    return (
      <div className="w-full bg-slate-50 min-h-[85vh] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-9 border-2 border-red-200 shadow-xl space-y-6 text-center animate-fade-scale-in">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <WarningCircle size={34} weight="bold" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Subscription Expired
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Renew Your Plan to Resume Operations
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              Your {subStatus.isTrial ? 'Free Trial' : 'Academy Subscription'} expired on{' '}
              <span className="font-bold text-slate-800">{subStatus.formattedExpiry}</span>. Operational tools
              (attendance, student rosters, leads, public listing) are currently paused until renewal.
            </p>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-left space-y-2">
            <div className="text-xs font-black text-red-900 flex items-center gap-2">
              <Lock size={16} weight="bold" className="text-red-600" />
              <span>Current Inactive Services:</span>
            </div>
            <ul className="text-[11px] text-red-800 space-y-1 ml-5 list-disc font-medium">
              <li>Academy hidden from parent public search &amp; discovery</li>
              <li>Attendance marking &amp; batch scheduling locked</li>
              <li>Lead notifications &amp; inquiries paused</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/coach/dashboard"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Buildings size={16} weight="bold" />
              <span>Coach Dashboard</span>
            </Link>
            <Link
              href="/coach/plans"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard size={16} weight="bold" />
              <span>Renew Subscription</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, display the locked gate overlay (initial onboarding / plan needed)
  return (
    <div className="w-full bg-slate-50 min-h-[85vh] p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-9 border-2 border-slate-200 shadow-xl space-y-6 text-center animate-fade-scale-in">
        {/* Lock Icon Header */}
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <Lock size={32} weight="bold" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Access Restricted
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Activate a Plan to Unlock Operations
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Attendance rosters, student directories, batch management, CRM leads, and public listings are locked until your academy profile is completed and an active plan is enabled.
          </p>
        </div>

        {/* Step Requirements Checklist */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-left space-y-3">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
            Required Onboarding Steps:
          </div>

          {/* Step 1: Profile & KYC */}
          <div className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-start gap-2.5">
              {isProfileComplete ? (
                <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock size={18} weight="bold" className="text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-black text-slate-900">
                  1. Academy Profile &amp; KYC Verification
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {isProfileComplete
                    ? 'Academy details & safety documents submitted ✓'
                    : 'Submit your facility details, safety checklist, and verification documents'}
                </div>
              </div>
            </div>

            {!isProfileComplete && (
              <Link
                href="/coach/dashboard#onboarding-hub"
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg shrink-0 transition-colors"
              >
                Complete
              </Link>
            )}
          </div>

          {/* Step 2: Subscription Plan */}
          <div className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-start gap-2.5">
              {subStatus.canOperate ? (
                <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <CreditCard size={18} weight="bold" className="text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-black text-slate-900">
                  2. Select Subscription Plan &amp; Activate
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {subStatus.canOperate
                    ? `Active Plan: ${centreData?.planTier || 'Active'} ✓`
                    : configData?.enableFreePlan
                    ? `Select Starter Free (${configData?.freeTierDurationDays || 90}d), Standard, or Premier`
                    : 'Choose and activate Standard or Premier plan to unlock operations'}
                </div>
              </div>
            </div>

            {!subStatus.canOperate && (
              <Link
                href="/coach/plans"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg shrink-0 transition-colors"
              >
                Select Plan
              </Link>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/coach/dashboard"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Buildings size={16} weight="bold" />
            <span>Go to Onboarding Hub</span>
          </Link>
          <Link
            href="/coach/plans"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CreditCard size={16} weight="bold" />
            <span>Select &amp; Pay Plan</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

