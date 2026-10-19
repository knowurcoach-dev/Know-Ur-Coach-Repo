"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachDashboardData } from '@/lib/actions';
import { getCentreSubscriptionStatus } from '@/lib/subscription';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';
import {
  Star,
  CheckCircle,
  ArrowSquareOut,
  ArrowLeft,
  Sparkle,
  ShieldCheck,
  Crown,
  Copy,
  Check,
  Globe,
  MapPin,
  Clock,
  Buildings,
  User,
  Gear,
} from '@phosphor-icons/react';

export default function CoachListingsPage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();

  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getCoachDashboardData(userEmail);
        if (res.success && res.centre) {
          setCentreData(res.centre);
        }
      } catch (err) {
        console.warn('Could not load listings info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  const academyName =
    centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');
  const plan = centreData?.planTier || 'FREE';
  const subStatus = getCentreSubscriptionStatus(centreData, null);
  const isApproved = centreData?.kycStatus === 'APPROVED';
  const isPendingReview = centreData?.kycStatus === 'DOCS_REVIEW';
  const isReferredBack = centreData?.kycStatus === 'REFERRED_BACK';
  const isRejected = centreData?.kycStatus === 'REJECTED';
  const isPendingDocs = centreData?.kycStatus === 'PENDING';
  const isSuspended = Boolean(centreData?.isSuspended);
  const isPlanActive = subStatus.canOperate;
  const isPublicLive = subStatus.isPublicLive;

  const publicUrl = centreData?.id
    ? typeof window !== 'undefined'
      ? `${window.location.origin}/activities/${centreData.id}`
      : `http://localhost:3000/activities/${centreData.id}`
    : '';

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      showToast('🔗 Public directory link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const categories = centreData?.category
    ? centreData.category.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : ['sports'];

  const batches = centreData?.batches || [];
  const minBatchFee = batches.length > 0
    ? Math.min(...batches.map((b: any) => Number(b.monthlyFee) || 1800))
    : Number(centreData?.monthlyTuitionFee) || 1800;

  if (loading) {
    return <GeneralCoachPageSkeleton title="Public Directory Showcase" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/dashboard"
              className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Public Directory Showcase &amp; Visibility
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live Preview, Shareable URL &amp; Search Directory Presence • {academyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/coach/plans"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Crown size={15} weight="bold" />
              <span>Subscription &amp; Plans</span>
            </Link>
          </div>
        </div>

        {/* Status Alert Banner */}
        {isSuspended ? (
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-red-500/40">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Account Suspended
              </span>
              <h2 className="text-xl font-black">{academyName} — Listing Suspended</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your academy profile has been suspended by platform administration. Operational tools and public search listings are currently disabled.
                {centreData?.statusNotes ? ` Notice: "${centreData.statusNotes}"` : ''}
              </p>
            </div>
            <a
              href="mailto:support@knowurcoach.in?subject=Appeal%20Academy%20Suspension"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Contact Support Desk</span>
            </a>
          </div>
        ) : subStatus.isExpired ? (
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-red-500/40">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Subscription Expired
              </span>
              <h2 className="text-xl font-black">{academyName} — Listing Paused</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your subscription expired on <span className="text-white font-bold">{subStatus.formattedExpiry}</span>. Public search listing and parent discovery are paused. Renew your subscription to restore your live directory presence.
              </p>
            </div>
            <Link
              href="/coach/plans"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Crown size={16} weight="bold" />
              <span>Renew Subscription Now</span>
            </Link>
          </div>
        ) : isPublicLive ? (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} weight="fill" />
                  <span>Live on Public Directory</span>
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  Tier: {plan}
                </span>
              </div>
              <h2 className="text-xl font-black">{academyName}</h2>
              <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
                Parents across your city can discover your sports programs, browse verified safety badges, and book free trial sessions directly through your live public page.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-black text-xs px-4 py-3 rounded-xl transition-all border border-white/20 cursor-pointer"
              >
                {copiedLink ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Public URL'}</span>
              </button>
              <Link
                href={`/activities/${centreData?.id}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <span>View Live Page</span>
                <ArrowSquareOut size={16} weight="bold" />
              </Link>
            </div>
          </div>
        ) : isPlanActive && isPendingReview ? (
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-blue-500/30">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full inline-block">
                  Subscription Active • Verification In Review
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  Plan: {plan} ({subStatus.daysRemaining}d left)
                </span>
              </div>
              <h2 className="text-xl font-black">{academyName} — Listing Queued</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your partner plan is confirmed and active! Your verification documents are currently under compliance review (turnaround 24–48 hours). Your public listing will automatically go live as soon as approved.
              </p>
            </div>

            <Link
              href={`/activities/${centreData?.id}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <ArrowSquareOut size={16} weight="bold" />
              <span>Preview Profile Draft</span>
            </Link>
          </div>
        ) : isPlanActive && isReferredBack ? (
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-amber-500/30">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Subscription Active • Revisions Requested
              </span>
              <h2 className="text-xl font-black">{academyName} — Action Required</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your subscription is active, but admin requested document revisions before publishing your profile. Feedback: "{centreData?.referredBackRemarks || 'Please upload updated documents.'}"
              </p>
            </div>

            <Link
              href="/coach/dashboard#onboarding-hub"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Update Documents</span>
            </Link>
          </div>
        ) : isPlanActive && isPendingDocs ? (
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-amber-500/30">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Subscription Active • KYC Upload Needed
              </span>
              <h2 className="text-xl font-black">{academyName} — Complete Setup to Go Live</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your plan is active! Complete your facility safety checklist and upload verification documents to publish your academy live to parents.
              </p>
            </div>

            <Link
              href="/coach/dashboard#onboarding-hub"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Upload Documents</span>
            </Link>
          </div>
        ) : isRejected ? (
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-red-500/30">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Application Declined
              </span>
              <h2 className="text-xl font-black">{academyName} — Verification Declined</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Reason: {centreData?.rejectionReason || 'Submitted documentation could not be verified'}. Please reach out to support at support@knowurcoach.in to submit an appeal or request refund options.
              </p>
            </div>

            <a
              href="mailto:support@knowurcoach.in?subject=Appeal%20KYC%20Rejection"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Contact Support</span>
            </a>
          </div>
        ) : isApproved && !isPlanActive ? (
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-amber-500/30">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block">
                KYC Approved • Plan Activation Required
              </span>
              <h2 className="text-xl font-black">{academyName}</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Your academy documents have been verified and approved by Platform Admin! Select an active partner plan (Standard or Premier) to publish your profile live in the directory.
              </p>
            </div>

            <Link
              href="/coach/plans"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Crown size={16} weight="bold" />
              <span>Choose Plan to Go Live</span>
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-5 border border-slate-700">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Profile Setup &amp; Verification In Progress
              </span>
              <h2 className="text-xl font-black">{academyName}</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Complete your academy KYC verification and activate your partner plan to unlock public directory placement and trial booking inquiries.
              </p>
            </div>

            <Link
              href="/coach/dashboard#onboarding-hub"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Complete Verification</span>
            </Link>
          </div>
        )}

        {/* Shareable Link Box */}
        {publicUrl && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Globe size={20} weight="bold" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Public Listing Link
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 truncate">
                  {publicUrl}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedLink ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        )}

        {/* Interactive Public Listing Preview Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Live Directory Card Preview
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                This is exactly how parents see your academy card when browsing activities &amp; sports
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              Parent View Preview
            </span>
          </div>

          {/* Directory Card Preview Mock */}
          <div className="max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden hover:shadow-lg transition-all">
            {/* Mock Image Header */}
            <div className="h-44 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex flex-col justify-between relative">
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat: string) => (
                    <span
                      key={cat}
                      className="bg-white/90 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm"
                    >
                      <span>{getCategoryEmoji(cat)}</span>
                      <span>{getCategoryDisplayName(cat)}</span>
                    </span>
                  ))}
                </div>

                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} weight="fill" />
                  <span>VERIFIED</span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                  <Star size={14} weight="fill" />
                  <span>5.0</span>
                  <span className="text-slate-300 font-normal text-[11px]">(Verified Academy)</span>
                </div>
                <h4 className="text-lg font-black leading-snug">{academyName}</h4>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <MapPin size={12} weight="fill" className="text-rose-400" />
                  <span>{centreData?.address || 'Agra, Uttar Pradesh'}</span>
                </p>
              </div>
            </div>

            {/* Mock Card Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between text-slate-600 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-bold">
                  <User size={14} className="text-blue-600" />
                  <span>Coach: {centreData?.headCoachName || 'Certified Coach'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock size={14} className="text-emerald-600" />
                  <span>{batches.length} Batches</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Plan starts from
                  </span>
                  <span className="text-base font-black text-slate-900">
                    ₹{minBatchFee.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                  </span>
                </div>

                <div className="bg-[#0066ff] text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs">
                  Book Free Trial
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Highlights & Search Presence */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
              Search Placement
            </div>
            <div className="text-lg font-black text-slate-900">
              {centreData?.planTier === 'PREMIUM' ? 'Top in City Sponsored' : centreData?.planTier === 'STANDARD' ? 'Verified City Directory' : subStatus.isTrial ? 'Trial Listing' : 'Private / Unlisted'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Regional sports &amp; activity search rankings
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
              Safety Verification
            </div>
            <div className="text-lg font-black text-slate-900">
              {centreData?.safetyGrade || 'Grade A+'} Certified
            </div>
            <div className="text-xs text-slate-500 font-medium">
              CCTV, First Aid &amp; Background verified
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
              Inquiry Channels
            </div>
            <div className="text-lg font-black text-slate-900">
              Free Trials &amp; WhatsApp
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Parents can book trials directly into your CRM
            </div>
          </div>
        </div>

        {/* Quick Management Actions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            Quick Directory Management
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/coach/profile"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600">
                  Update Academy Profile
                </div>
                <div className="text-[11px] text-slate-500">
                  Photos, address &amp; coach bio
                </div>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
            </Link>

            <Link
              href="/coach/batches"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600">
                  Manage Batches &amp; Timings
                </div>
                <div className="text-[11px] text-slate-500">
                  Slots, age groups &amp; fees
                </div>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </Link>

            <Link
              href="/coach/plans"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-extrabold text-xs text-slate-900 group-hover:text-purple-600">
                  Partner Subscription &amp; Billing
                </div>
                <div className="text-[11px] text-slate-500">
                  Standard &amp; Premier upgrades
                </div>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-purple-600 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
