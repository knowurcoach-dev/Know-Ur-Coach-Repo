"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Academy } from '@/types';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryDisplayName, resolveCategoryCoverImage } from '@/lib/categories';
import { toggleCentreBookmark } from '@/lib/actions';
import {
  Star,
  SealCheck,
  MapPin,
  Heart,
  Ticket,
  CalendarPlus,
  ArrowRight,
  Info,
  CheckCircle,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react';

import { useBookmarks } from '@/hooks/useBookmarks';

export interface AcademyCardProps {
  academy: Academy;
  isSavedInitially?: boolean;
  onBookmarkToggle?: (academyId: string, saved: boolean) => void;
  onOpenTrial?: (academy: Academy) => void;
  onOpenBatch?: (academy: Academy) => void;
  onOpenDetails?: (academy: Academy) => void;
  onOpenAudit?: (academy: Academy) => void;
  onQuickEdit?: (academy: Academy) => void;
}

export function AcademyCard({
  academy,
  isSavedInitially,
  onBookmarkToggle,
  onOpenTrial,
  onOpenBatch,
  onOpenDetails,
  onOpenAudit,
  onQuickEdit,
}: AcademyCardProps) {
  const router = useRouter();
  const { isGuest } = useAuth();
  const { showToast } = usePersona();
  const { openModal } = useModalStore();
  const { isSaved, toggleBookmark } = useBookmarks();
  const bookmarked = isSaved(academy.id);
  const [isTrialBooked, setIsTrialBooked] = useState(false);
  const [isBatchBooked, setIsBatchBooked] = useState(false);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = await toggleBookmark(academy.id, academy.name);
    if (onBookmarkToggle) {
      onBookmarkToggle(academy.id, nextSaved);
    }
  };

  const handleTrialClick = () => {
    if (isTrialBooked) return;
    if (isGuest) {
      showToast('🎁 Create a free parent account to claim your Free Trial pass!');
      router.push('/register-parent');
      return;
    }
    if (onOpenTrial) {
      onOpenTrial(academy);
    } else {
      openModal('trial-booking', {
        acadId: academy.id,
        acadName: academy.name,
        locality: academy.localityName,
        category: academy.category,
        academy,
        batches: academy.batches,
      });
    }
  };

  const handleBatchClick = () => {
    if (isBatchBooked) return;
    if (isGuest) {
      showToast('Please sign in to enroll in monthly batches');
      router.push('/login?callbackUrl=/activities');
      return;
    }
    if (onOpenBatch) {
      onOpenBatch(academy);
    } else {
      openModal('batch-booking', {
        acadId: academy.id,
        acadName: academy.name,
        locality: academy.localityName,
        category: academy.category,
        academy,
        batches: academy.batches,
      });
    }
  };

  const isCurrentCoachCenter = false; // Shown only when coach is authenticated (NextAuth session)

  return (
    <div
      className="academy-card w-full bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col gap-3 relative hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
      data-id={academy.id}
      data-name={academy.name}
      data-category={academy.category}
      data-activities={Array.isArray(academy.activities) ? academy.activities.join(',') : (academy.activitiesText || '')}
      data-locality={academy.locality}
      data-distance={academy.distance}
      data-age={Array.isArray(academy.age) ? academy.age.join(',') : (academy.ageText || '')}
      data-fee={academy.fee}
    >
      {/* Top Half Content Container */}
      <div className="flex flex-col gap-3">
        {/* Coach Logged-In Tag */}
        {isCurrentCoachCenter && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <SealCheck size={14} weight="fill" className="text-emerald-600" />
              Your Coaching Center (Logged-In Coach View)
            </span>
            <button
              onClick={() => (onQuickEdit ? onQuickEdit(academy) : showToast('Opening batch manager'))}
              className="underline text-emerald-900 font-bold hover:text-emerald-700 cursor-pointer"
            >
              Quick Edit
            </button>
          </div>
        )}

        {/* 1. Full-Width Top Status & Badges Bar (Fixed Height: h-6) */}
        <div className="flex items-center justify-between h-6 gap-2">
          {/* Left Badges */}
          <div className="flex items-center gap-1.5 overflow-hidden shrink min-w-0 text-[9px] font-extrabold">
            {academy.isTopInArea && (
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 whitespace-nowrap shadow-2xs">
                <Star size={10} weight="fill" /> TOP IN AREA
              </span>
            )}
            {academy.reviewsCount && academy.reviewsCount > 0 ? (
              <>
                <span className="bg-yellow-100 text-yellow-900 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 whitespace-nowrap font-bold">
                  <Star size={10} weight="fill" className="text-yellow-600" /> {Number(academy.rating || 5).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">
                  ({academy.reviewsCount})
                </span>
              </>
            ) : (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0 whitespace-nowrap font-bold text-[9px]">
                <Sparkle size={10} weight="fill" className="text-emerald-600" /> New
              </span>
            )}
          </div>

          {/* Right Verified Tag & Bookmark */}
          <div className="flex items-center gap-1.5 shrink-0">
            {academy.isVerifiedBatch ? (
              <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border border-blue-100 flex items-center gap-0.5">
                <SealCheck size={11} weight="fill" /> Verified Academy
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[9px] font-medium px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border border-slate-200">
                Self-Listed
              </span>
            )}
            <button
              onClick={handleBookmarkToggle}
              className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                bookmarked ? 'text-red-500' : 'text-slate-300 hover:text-red-500'
              }`}
              title={bookmarked ? 'Remove Bookmark' : 'Save Academy'}
            >
              <Heart size={18} weight={bookmarked ? 'fill' : 'bold'} />
            </button>
          </div>
        </div>

        {/* 2. Middle Row: Thumbnail Image + Details (Fixed Height: h-22) */}
        <div className="flex gap-3.5 items-center">
          {/* Fixed-Dimension Thumbnail (88px x 88px) */}
          <Link
            href={`/activities/${academy.id}`}
            className="w-[88px] h-[88px] rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-100 block group/thumb"
            title={`View ${academy.name} details`}
          >
            <img
              src={(academy.hasCustomImage && academy.image) ? academy.image : resolveCategoryCoverImage(academy.category || (academy.activities && academy.activities[0]) || 'sports', '')}
              alt={academy.name}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                const fallback = resolveCategoryCoverImage(academy.category || (academy.activities && academy.activities[0]) || 'sports', '');
                if ((e.target as HTMLImageElement).src !== fallback) {
                  (e.target as HTMLImageElement).src = fallback;
                }
              }}
            />
            {academy.isVerifiedBatch && (
              <div
                className="absolute bottom-1 right-1 bg-white/95 backdrop-blur-xs p-0.5 rounded-full shadow-xs"
                title="Physically Inspected & Verified Center"
              >
                <SealCheck size={13} weight="fill" className="text-blue-600" />
              </div>
            )}
          </Link>

          {/* Text Info Column (Fixed Height: h-[88px]) */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-[88px]">
            {/* Academy Name: Exactly 2 lines height (h-10) with line-clamp-2 */}
            <Link
              href={`/activities/${academy.id}`}
              title={academy.name}
              className="font-extrabold text-[#0a1128] text-sm leading-snug hover:text-blue-600 cursor-pointer transition-colors line-clamp-2 h-10 flex items-center"
            >
              <span className="line-clamp-2">{academy.name}</span>
            </Link>

            {/* Locality & Distance: Exactly 1 line (h-4) */}
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 h-4 truncate">
              <MapPin size={12} weight="bold" className="text-red-500 shrink-0" />
              <span className="truncate">
                {academy.localityName}
                {academy.city && academy.city.toLowerCase() !== (academy.localityName || '').toLowerCase()
                  ? `, ${academy.city}`
                  : ''}
              </span>
              {academy.distanceText && academy.distanceText.trim() ? (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold text-slate-700 shrink-0">{academy.distanceText}</span>
                </>
              ) : null}
            </p>

            {/* Activities & Age: Exactly 1 line (h-5) with truncate */}
            <div className="h-5 flex items-center">
              {(() => {
                const displayCategory = getCategoryDisplayName(academy.activitiesText || academy.category);
                return (
                  <span
                    title={`${displayCategory} • ${academy.ageText}`}
                    className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md truncate max-w-full"
                  >
                    {displayCategory} • {academy.ageText}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 3. Highlights & Coach Row (Fixed Height: h-10) */}
        <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex justify-between items-center text-[11px] text-slate-600">
          <div className="flex items-center gap-1 truncate min-w-0 mr-2">
            <strong className="text-slate-800 shrink-0 font-bold">Coach:</strong>
            <span className="truncate text-slate-700" title={academy.coachName || 'NIS Certified Coach'}>
              {academy.coachName || 'NIS Certified Coach'}
              {academy.coachTitle ? (
                <span className="text-slate-400"> ({academy.coachTitle})</span>
              ) : null}
            </span>
          </div>
          <div className="font-extrabold text-[#0a1128] text-xs shrink-0 whitespace-nowrap">
            ₹{Number(academy.fee || 0).toLocaleString('en-IN')}{' '}
            <span className="text-[10px] font-normal text-slate-400">/mo</span>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons Row (Fixed Height: h-10, Anchored to bottom) */}
      <div className="flex gap-2 items-center w-full mt-auto pt-1">
        {/* Free Trial Button (flex-1 min-w-0 for equal width without clipping) */}
        <button
          onClick={handleTrialClick}
          disabled={isTrialBooked}
          className={`btn-trial-action flex-1 min-w-0 h-10 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
            isTrialBooked
              ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-700 cursor-default'
              : 'bg-white border-2 border-[#0066ff] text-[#0066ff] hover:bg-blue-50 active:scale-[0.98]'
          }`}
        >
          {isTrialBooked ? (
            <>
              <CheckCircle size={16} weight="bold" className="text-emerald-600 shrink-0" />
              <span className="truncate">Trial Booked</span>
            </>
          ) : (
            <>
              <Ticket size={16} weight="bold" className="shrink-0 text-[#0066ff]" />
              <span className="truncate">Free Trial</span>
            </>
          )}
        </button>

        {/* Book Batch Button (flex-1 min-w-0 for equal width without clipping) */}
        <button
          onClick={handleBatchClick}
          disabled={isBatchBooked}
          className={`btn-batch-action flex-1 min-w-0 h-10 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm cursor-pointer select-none ${
            isBatchBooked
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-[#0066ff] text-white hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {isBatchBooked ? (
            <>
              <CheckCircle size={16} weight="bold" className="shrink-0" />
              <span className="truncate">Enrolled</span>
            </>
          ) : (
            <>
              <CalendarPlus size={16} weight="bold" className="shrink-0" />
              <span className="truncate">Book Batch</span>
            </>
          )}
        </button>

        {/* Details Button (Info ⓘ) → navigates to Academy Detail page */}
        <Link
          href={`/activities/${academy.id}`}
          className="w-10 h-10 shrink-0 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer group/info border border-slate-200/80 shadow-xs"
          title="View Full Academy Details"
          aria-label="View Full Academy Details"
        >
          <Info size={20} weight="bold" className="shrink-0" />
        </Link>

        {/* Admin Audit Button (when enabled) */}
        {onOpenAudit && (
          <button
            onClick={() => onOpenAudit(academy)}
            className="btn-admin-audit h-10 bg-purple-50 text-purple-700 border border-purple-200 px-3 rounded-xl text-xs font-extrabold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
            title="Audit Center Safety & KYC"
          >
            <ShieldCheck size={16} weight="fill" />
            <span>Audit</span>
          </button>
        )}
      </div>
    </div>
  );
}
