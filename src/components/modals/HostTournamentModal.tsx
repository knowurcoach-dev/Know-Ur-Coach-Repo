"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { createCompetition, getCoachTournamentsAction } from '@/lib/actions';
import {
  Trophy,
  PlusCircle,
  MapPin,
  CalendarBlank,
  CurrencyInr,
  Users,
  Medal,
  Clock,
  CircleNotch,
  LockKey,
  Crown,
  Sparkle,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';

export function HostTournamentModal({ onTournamentCreated }: { onTournamentCreated?: () => void }) {
  const router = useRouter();
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();
  const { showToast, activeCity } = usePersona();
  const { session, user, isGuest, isParent, isCoach, isAdmin, role } = useAuth();
  const [isPending, startTransition] = useTransition();

  const isModalOpen = isOpen && activeModal === 'competition-host';
  const canHost = !isGuest && !isParent && (isCoach || isAdmin || role === 'COACH' || role === 'ADMIN');

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Badminton');
  const [category, setCategory] = useState<'sports' | 'stem' | 'arts' | 'martial-arts'>('sports');
  const [organizer, setOrganizer] = useState('');
  const [dates, setDates] = useState('');
  const [timing, setTiming] = useState('8:30 AM - 5:00 PM');
  const [venue, setVenue] = useState('');
  const [locality, setLocality] = useState('kamla-nagar');
  const [feeType, setFeeType] = useState<'paid' | 'free'>('paid');
  const [registrationFee, setRegistrationFee] = useState('450');
  const [ageDivisions, setAgeDivisions] = useState('Under-12 & Under-15');
  const [prizePool, setPrizePool] = useState('₹20,000 Cash Pool + Trophies & Certificates');

  // Subscription verification state for coaches
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [academyCentre, setAcademyCentre] = useState<any>(null);

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    if (!isModalOpen || isGuest || isAdmin) return;

    if (modalData?.centre) {
      setAcademyCentre(modalData.centre);
      if (modalData.centre.name) setOrganizer(modalData.centre.name);
      if (modalData.isSubscribed !== undefined) {
        setIsSubscribed(modalData.isSubscribed);
      }
      return;
    }

    if (userEmail && (isCoach || role === 'COACH')) {
      setIsCheckingSub(true);
      getCoachTournamentsAction(userEmail)
        .then((res) => {
          if (res?.success) {
            setIsSubscribed(Boolean(res.isSubscribed));
            if (res.centre) {
              setAcademyCentre(res.centre);
              if (res.centre.name) setOrganizer(res.centre.name);
            }
          } else {
            setIsSubscribed(false);
          }
        })
        .catch(() => setIsSubscribed(false))
        .finally(() => setIsCheckingSub(false));
    }
  }, [isModalOpen, userEmail, isCoach, isAdmin, role, modalData]);

  const handleClose = () => {
    closeModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canHost) {
      showToast('⚠️ Unauthorized. Only coaches, organizers, and admins can post tournaments.');
      handleClose();
      return;
    }

    if (!isAdmin && !isSubscribed) {
      showToast('🔒 Subscription required. Please upgrade your partner plan to host tournaments.');
      handleClose();
      router.push('/coach/plans');
      return;
    }

    if (!title.trim() || !venue.trim() || !dates.trim()) {
      showToast('⚠️ Please fill in all required tournament details');
      return;
    }

    const effectiveFee = feeType === 'free' ? 0 : (Number(registrationFee) || 0);

    startTransition(async () => {
      try {
        const res = await createCompetition({
          title: title.trim(),
          sport: sport.trim(),
          category,
          organizer: organizer.trim() || academyCentre?.name || `${activeCity} District Sports Federation`,
          dates: dates.trim(),
          timing: timing.trim(),
          venue: venue.trim(),
          locality,
          registrationFee: effectiveFee,
          ageDivisions: ageDivisions.trim(),
          prizePool: prizePool.trim(),
          creatorRole: role,
          creatorEmail: session?.user?.email || undefined,
        });

        if (res?.success) {
          showToast(`🏆 Successfully published tournament "${title}"!`);
          handleClose();
          if (onTournamentCreated) onTournamentCreated();
        } else if (res?.isLocked) {
          showToast(`🔒 ${res.message}`);
          handleClose();
          router.push('/coach/plans');
        } else {
          showToast(res?.message || 'Failed to publish tournament');
        }
      } catch (err) {
        console.error('Error creating competition:', err);
        showToast('⚠️ Server error occurred while publishing tournament.');
      }
    });
  };

  if (!isModalOpen) return null;

  return (
    <DialogWrapper
      id="host-tournament-modal"
      isOpen={isModalOpen}
      onClose={handleClose}
      icon={<Trophy size={20} weight="fill" />}
      title={`Host / Post a Tournament in ${activeCity}`}
      subtitle="Publish your championship, inter-school tournament, or Olympiad"
      headerGradient="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white"
    >
      {!canHost ? (
        <div className="p-6 text-center space-y-3.5">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-xs">
            <LockKey size={26} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900">Host Access Restricted</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              Only verified academies, coaches, tournament directors, and administrators can publish district tournaments and competitions.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="mt-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      ) : isCheckingSub ? (
        <div className="p-8 text-center space-y-3">
          <CircleNotch size={32} className="animate-spin text-orange-600 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Checking academy partner status...</p>
        </div>
      ) : !isAdmin && !isSubscribed ? (
        /* LOCKED PAYWALL FOR NON-SUBSCRIPTION ACADEMIES */
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-orange-500/20">
            <Crown size={28} weight="fill" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Standard &amp; Premier Partner Feature
            </div>
            <h3 className="text-base font-black text-slate-900">Tournament Hosting is Locked</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Publishing official district tournaments, accepting digital Razorpay entries, issuing verified QR passes, and viewing participant rosters requires an active <strong>Standard Growth</strong> or <strong>Premier Pro</strong> Partner plan.
            </p>
          </div>

          <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200/80 text-left space-y-2 text-xs">
            <div className="font-extrabold text-orange-950 text-[11px] uppercase tracking-wider">
              What you unlock with Partner Subscription:
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                <span>Host unlimited youth tournaments &amp; championships</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                <span>Collect participant fees directly via Razorpay online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                <span>Real-time player roster with parent WhatsApp contact &amp; check-in</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => {
                handleClose();
                router.push('/coach/plans');
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Crown size={15} weight="bold" />
              <span>Unlock with Partner Plan</span>
              <ArrowRight size={14} weight="bold" />
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-left max-h-[75vh] overflow-y-auto">
        {/* Tournament Title */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
            Tournament / Championship Title *
          </label>
          <input
            type="text"
            required
            placeholder={`e.g. ${activeCity} Youth Badminton Open 2026`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Sport & Category */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Sport / Discipline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Badminton, Chess, Karate"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="sports">Sports &amp; Athletics</option>
              <option value="stem">STEM &amp; Chess</option>
              <option value="arts">Fine Arts &amp; Drawing</option>
              <option value="martial-arts">Martial Arts &amp; Taekwondo</option>
            </select>
          </div>
        </div>

        {/* Organizer & Venue */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Organizing Club / Association *
            </label>
            <input
              type="text"
              placeholder={`e.g. ${activeCity} Sports & Athletic Association`}
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Locality Area *
            </label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="kamla-nagar">Kamla Nagar</option>
              <option value="eklavya">Eklavya Stadium / Sadar</option>
              <option value="sanjay-place">Sanjay Place</option>
              <option value="dayalbagh">Dayalbagh</option>
              <option value="shilpgram">Shilpgram, Taj East</option>
            </select>
          </div>
        </div>

        {/* Venue Address */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
            Venue &amp; Stadium *
          </label>
          <input
            type="text"
            required
            placeholder={`e.g. Indoor Sports Arena, Main Complex, ${activeCity}`}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Dates & Timing */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Dates *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nov 20 - Nov 22, 2026"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Daily Timing
            </label>
            <input
              type="text"
              placeholder="e.g. 8:30 AM - 5:00 PM"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Registration Pricing: Paid vs Free */}
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
              Tournament Entry Fee *
            </label>
            <span className="text-[10px] text-slate-500 font-bold">
              {feeType === 'free' ? 'Free for all children' : 'Online Razorpay & Venue payment'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setFeeType('paid');
                if (registrationFee === '0') setRegistrationFee('450');
              }}
              className={`p-2.5 rounded-xl border text-left font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                feeType === 'paid'
                  ? 'bg-orange-50 border-orange-500 text-orange-950 ring-1 ring-orange-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CurrencyInr size={14} weight="bold" />
              <span>Paid Entry Tournament</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFeeType('free');
                setRegistrationFee('0');
              }}
              className={`p-2.5 rounded-xl border text-left font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                feeType === 'free'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Trophy size={14} weight="bold" />
              <span>Free Tournament (₹0)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                {feeType === 'free' ? 'Fee per Participant' : 'Entry Fee Amount (₹) *'}
              </label>
              {feeType === 'free' ? (
                <div className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-black text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                  <span>Free Entry Pass (₹0)</span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="450"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                Age Divisions *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Under-11 & Under-15"
                value={ageDivisions}
                onChange={(e) => setAgeDivisions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
            Prize Pool &amp; Awards
          </label>
          <input
            type="text"
            placeholder="e.g. ₹25,000 Cash Pool + District Ranking Certificates + Trophies"
            value={prizePool}
            onChange={(e) => setPrizePool(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer pt-2"
        >
          {isPending ? (
            <>
              <CircleNotch size={16} weight="bold" className="animate-spin" /> Publishing Tournament...
            </>
          ) : (
            <>
              <PlusCircle size={16} weight="bold" /> Publish Tournament in {activeCity}
            </>
          )}
        </button>
      </form>
      )}
    </DialogWrapper>
  );
}
