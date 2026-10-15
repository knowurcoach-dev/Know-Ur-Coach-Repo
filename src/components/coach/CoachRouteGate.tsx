"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCoachDashboardData } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Lock,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Buildings,
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

  // Profile completion criteria:
  // 1. Academy profile exists with valid name and address
  const hasBasicProfile = Boolean(centreData?.name?.trim() && centreData?.address?.trim());

  // 2. Profile/KYC has been submitted for review (or already approved/inspected) OR at least 1 batch configured
  const hasSubmittedKyc =
    centreData?.kycStatus === 'DOCS_REVIEW' ||
    centreData?.kycStatus === 'APPROVED' ||
    centreData?.kycStatus === 'INSPECTION_SCHEDULED' ||
    Boolean(centreData?.statusNotes && centreData.statusNotes.includes('In-app digital KYC submitted'));

  const isProfileComplete = hasBasicProfile && (hasSubmittedKyc || (centreData?.batches && centreData.batches.length > 0));

  // Plan activation criteria:
  const hasPlan =
    centreData?.planTier === 'STANDARD' ||
    centreData?.planTier === 'PREMIUM' ||
    Boolean(centreData?.planPurchasedAt || centreData?.planPaymentId);

  const isKycApproved = centreData?.kycStatus === 'APPROVED';

  // Full access requires an active subscription plan (Standard or Premier)
  if (hasPlan) {
    return <>{children}</>;
  }

  // Otherwise, display the locked gate overlay
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
            Complete Onboarding to Unlock Operations
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Attendance rosters, student directories, batch management, CRM leads, and public listings are locked until your academy profile is completed and your plan is activated.
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
              {hasPlan ? (
                <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <CreditCard size={18} weight="bold" className="text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-black text-slate-900">
                  2. Select Subscription Plan &amp; Activate
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {hasPlan
                    ? `Active Plan: ${centreData?.planTier || 'Active'} ✓`
                    : 'Choose and activate your subscription plan to unlock operations'}
                </div>
              </div>
            </div>

            {!hasPlan && (
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
