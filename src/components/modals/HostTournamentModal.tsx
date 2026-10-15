"use client";

import React, { useState, useTransition } from 'react';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { createCompetition } from '@/lib/actions';
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
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';

export function HostTournamentModal({ onTournamentCreated }: { onTournamentCreated?: () => void }) {
  const { isOpen, activeModal, closeModal } = useModalStore();
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
  const [registrationFee, setRegistrationFee] = useState('450');
  const [ageDivisions, setAgeDivisions] = useState('Under-12 & Under-15');
  const [prizePool, setPrizePool] = useState('₹20,000 Cash Pool + Trophies & Certificates');

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

    if (!title.trim() || !venue.trim() || !dates.trim()) {
      showToast('⚠️ Please fill in all required tournament details');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCompetition({
          title: title.trim(),
          sport: sport.trim(),
          category,
          organizer: organizer.trim() || `${activeCity} District Sports Federation`,
          dates: dates.trim(),
          timing: timing.trim(),
          venue: venue.trim(),
          locality,
          registrationFee: Number(registrationFee) || 450,
          ageDivisions: ageDivisions.trim(),
          prizePool: prizePool.trim(),
          creatorRole: role,
          creatorEmail: session?.user?.email || undefined,
        });

        if (res?.success) {
          showToast(`🏆 Successfully published tournament "${title}"!`);
          handleClose();
          if (onTournamentCreated) onTournamentCreated();
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

        {/* Registration Fee & Age Divisions */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
              Entry Fee (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="450"
              value={registrationFee}
              onChange={(e) => setRegistrationFee(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
            />
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
