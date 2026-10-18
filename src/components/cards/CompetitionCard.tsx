"use client";

import React, { useState } from 'react';
import { Competition } from '@/types';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import {
  Trophy,
  SealCheck,
  Heart,
  CalendarBlank,
  MapPin,
  UserCheck,
  Coins,
  Medal,
  FilePdf,
  Info,
  Ticket,
  CheckCircle,
  UsersThree,
} from '@phosphor-icons/react';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export interface CompetitionCardProps {
  competition: Competition;
  onOpenRulebook?: (competition: Competition) => void;
  onOpenDetails?: (competition: Competition) => void;
  onOpenRegister?: (competition: Competition) => void;
}

export function CompetitionCard({
  competition,
  onOpenRulebook,
  onOpenDetails,
  onOpenRegister,
}: CompetitionCardProps) {
  const { showToast } = usePersona();
  const { openModal } = useModalStore();
  const { isGuest } = useAuth();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    showToast(
      nextState
        ? `🏆 Added ${competition.title} to your competition wishlist!`
        : `Removed ${competition.title} from wishlist`
    );
  };

  const handleRulebookDownload = () => {
    if (onOpenRulebook) {
      onOpenRulebook(competition);
    } else {
      showToast(`📄 Downloading official rulebook: ${competition.rulebookPdf}`);
    }
  };

  const handleRegisterClick = () => {
    if (isRegistered) return;
    if (isGuest) {
      showToast('⚠️ Please sign in or register as a parent to book tournament passes');
      router.push('/login?callbackUrl=/competitions');
      return;
    }
    if (onOpenRegister) {
      onOpenRegister(competition);
    } else {
      openModal('competition-register', {
        competition,
        title: competition.title,
      });
    }
  };

  return (
    <div
      className="competition-card bg-white rounded-3xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.06)] border border-orange-100/60 relative hover:border-orange-300 transition-all flex flex-col gap-3.5 text-left"
      data-id={competition.id}
      data-title={competition.title}
      data-sport={competition.sport}
      data-category={competition.category}
      data-locality={competition.locality}
      data-status={competition.status}
      data-age={competition.age.join(',')}
      data-fee={competition.fee}
      data-date={competition.date}
      data-venue={competition.venue}
    >
      {/* Top Badges and Bookmark Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {competition.status === 'open' && (
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {competition.statusText}
            </span>
          )}
          {competition.status === 'fast-filling' && (
            <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              {competition.statusText}
            </span>
          )}
          {competition.status === 'upcoming' && (
            <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              {competition.statusText}
            </span>
          )}

          <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Trophy size={11} weight="fill" />
            <span className="capitalize">{competition.category.replace('-', ' ')}</span>
          </span>

          {competition.badgeSpecial && (
            <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
              {competition.badgeSpecial}
            </span>
          )}
        </div>

        <button
          onClick={handleBookmarkToggle}
          className={`p-1 transition-colors cursor-pointer ${
            isBookmarked ? 'text-red-500' : 'text-gray-300 hover:text-red-500'
          }`}
          title={isBookmarked ? 'Remove from Wishlist' : 'Save Competition'}
        >
          <Heart size={20} weight={isBookmarked ? 'fill' : 'bold'} />
        </button>
      </div>

      {/* Title & Organizer */}
      <div>
        <h3
          onClick={() => {
            if (onOpenDetails) onOpenDetails(competition);
            else router.push(`/competitions/${competition.id}`);
          }}
          className="font-extrabold text-[#0a1128] text-base leading-snug mb-1 hover:text-orange-600 cursor-pointer transition-colors"
        >
          {competition.title}
        </h3>
        <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
          Organized by <span className="font-bold text-gray-700">{competition.organizer}</span>
          <span title="Verified Organizer" className="inline-flex items-center">
            <SealCheck size={13} weight="fill" className="text-blue-500 flex-shrink-0" />
          </span>
        </p>
      </div>

      {/* Details Grid */}
      <div className="bg-orange-50/40 rounded-2xl p-3 border border-orange-100/50 space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-700">
          <span className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold">
            <CalendarBlank size={14} weight="bold" className="text-orange-500 flex-shrink-0" />
            Date & Time:
          </span>
          <span className="font-bold text-[11px]">{competition.date}</span>
        </div>

        <div className="flex items-center justify-between text-gray-700">
          <span className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold">
            <MapPin size={14} weight="fill" className="text-red-500 flex-shrink-0" />
            Venue:
          </span>
          <span className="font-bold text-[11px] text-right truncate max-w-[190px]">
            {competition.venueShort}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-700">
          <span className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold">
            <UserCheck size={14} weight="bold" className="text-blue-500 flex-shrink-0" />
            Eligibility:
          </span>
          <span className="font-bold text-[11px]">{competition.ageText}</span>
        </div>

        <div className="flex items-center justify-between text-gray-700 pt-1 border-t border-orange-100/60">
          <span className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold">
            <Coins size={14} weight="bold" className="text-emerald-600 flex-shrink-0" />
            Entry Fee:
          </span>
          <span className="font-extrabold text-sm text-emerald-700">
            ₹{competition.fee}{' '}
            <span className="text-[9px] font-normal text-gray-500">{competition.feeUnit}</span>
          </span>
        </div>
      </div>

      {/* Prize Pool Callout */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-3 py-2 text-[11px] text-amber-900 font-bold">
        <Medal size={16} weight="fill" className="text-amber-600 flex-shrink-0" />
        <span>{competition.prizePool}</span>
      </div>

      {/* Highlights & Tags */}
      <div className="flex flex-wrap gap-1.5">
        {competition.tags.map((tag, idx) => (
          <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleRulebookDownload}
          className="flex-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <FilePdf size={15} weight="bold" className="text-red-500" />
          <span>Rulebook</span>
        </button>

        <button
          onClick={() => {
            if (onOpenDetails) onOpenDetails(competition);
            else router.push(`/competitions/${competition.id}`);
          }}
          className="flex-1 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Info size={15} weight="bold" />
          <span>Details</span>
        </button>

        <button
          onClick={handleRegisterClick}
          disabled={isRegistered}
          className={`btn-register-comp flex-[1.4] text-white text-xs font-extrabold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
            isRegistered
              ? 'bg-emerald-600 shadow-emerald-500/30 cursor-default'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]'
          }`}
        >
          {isRegistered ? (
            <>
              <CheckCircle size={15} weight="bold" />
              <span>Registered</span>
            </>
          ) : competition.isTeam ? (
            <>
              <UsersThree size={15} weight="bold" />
              <span>Register Team</span>
            </>
          ) : (
            <>
              <Ticket size={15} weight="bold" />
              <span>Register Child</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
