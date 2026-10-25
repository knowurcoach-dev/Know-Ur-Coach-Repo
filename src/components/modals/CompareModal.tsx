"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useModalStore } from '@/hooks/useModalStore';
import { DialogWrapper } from './DialogWrapper';
import {
  Scales,
  CheckCircle,
  Ticket,
  Star,
  CircleNotch,
  Plus,
  X,
  ArrowsLeftRight,
  MagnifyingGlass,
  MapPin,
  SealCheck,
  ShieldCheck,
  CalendarCheck,
  ArrowSquareOut,
  Sparkle,
  Buildings,
  Users,
} from '@phosphor-icons/react';
import { getDiscoveryData } from '@/lib/actions';
import { getCategoryDisplayName, resolveCategoryCoverImage } from '@/lib/categories';

const THEME_STYLES = [
  {
    themeName: 'Blue',
    slotLabel: 'Academy 1',
    border: 'border-blue-200',
    headerBg: 'bg-blue-50/70',
    headerText: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    cardBorder: 'border-blue-200 bg-blue-50/30',
  },
  {
    themeName: 'Purple',
    slotLabel: 'Academy 2',
    border: 'border-purple-200',
    headerBg: 'bg-purple-50/70',
    headerText: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
    cardBorder: 'border-purple-200 bg-purple-50/30',
  },
  {
    themeName: 'Emerald',
    slotLabel: 'Academy 3',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-50/70',
    headerText: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    cardBorder: 'border-emerald-200 bg-emerald-50/30',
  },
];

const PRESET_CATEGORIES = [
  { label: '🏸 Badminton', category: 'badminton' },
  { label: '🏏 Cricket', category: 'cricket' },
  { label: '🏊 Swimming', category: 'swimming' },
  { label: '🥋 Martial Arts', category: 'martial-arts' },
  { label: '🧠 Brain Booster', category: 'brain-booster' },
];

function getStartingFee(c: any): number {
  const batchFees = (c?.batches || [])
    .map((b: any) => Number(b.monthlyFee || b.fee || 0))
    .filter((f: number) => f > 0);
  if (batchFees.length > 0) {
    return Math.min(...batchFees);
  }
  return Number(c?.monthlyTuitionFee || c?.fee || 0);
}

export function CompareModal() {
  const { isOpen, activeModal, modalData, closeModal, openModal } = useModalStore();
  const [allCentres, setAllCentres] = useState<any[]>([]);
  const [selectedCentres, setSelectedCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Picker drawer/overlay state
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState('all');

  const isModalOpen = isOpen && activeModal === 'compare-academies';

  useEffect(() => {
    if (!isModalOpen) {
      setPickerSlotIndex(null);
      return;
    }

    async function loadCentres() {
      setLoading(true);
      try {
        const res = await getDiscoveryData();
        const loaded = res?.centres || [];
        setAllCentres(loaded);

        if (loaded.length === 0) {
          setSelectedCentres([]);
          return;
        }

        // Determine initial selected centres
        const passedIds = modalData?.centreIds as string[] | undefined;
        if (passedIds && passedIds.length > 0) {
          const matched = loaded.filter((c: any) => passedIds.includes(c.id));
          if (matched.length >= 2) {
            setSelectedCentres(matched.slice(0, 3));
          } else if (matched.length === 1) {
            // Pick a 2nd center matching same category or locality
            const target = matched[0];
            const companion = loaded.find(
              (c: any) =>
                c.id !== target.id &&
                (c.category === target.category || c.locality === target.locality)
            ) || loaded.find((c: any) => c.id !== target.id);

            const initial = companion ? [target, companion] : [target];
            setSelectedCentres(initial);
          } else {
            setSelectedCentres(loaded.slice(0, 3));
          }
        } else {
          // Default to top 3 verified centres (or 2 if only 2 exist)
          setSelectedCentres(loaded.slice(0, Math.min(3, loaded.length)));
        }
      } catch (err) {
        console.error('Error loading centres for compare modal:', err);
        setAllCentres([]);
        setSelectedCentres([]);
      } finally {
        setLoading(false);
      }
    }

    loadCentres();
  }, [isModalOpen, modalData]);

  // Open picker for a slot
  const handleOpenPicker = (slotIdx: number) => {
    setPickerSlotIndex(slotIdx);
    setPickerSearch('');
    setPickerCategoryFilter('all');
  };

  // Select academy for slot
  const handleSelectAcademy = (centre: any) => {
    if (pickerSlotIndex === null) return;

    setSelectedCentres((prev) => {
      const copy = [...prev];
      if (pickerSlotIndex < copy.length) {
        copy[pickerSlotIndex] = centre;
      } else {
        copy.push(centre);
      }
      return copy.slice(0, 3);
    });

    setPickerSlotIndex(null);
  };

  // Remove slot (only allowed if 3 academies are selected, reducing to 2)
  const handleRemoveSlot = (indexToRemove: number) => {
    if (selectedCentres.length <= 2) return;
    setSelectedCentres((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Quick preset filter
  const handleQuickPreset = (categorySlug: string) => {
    const matching = allCentres.filter((c: any) => {
      const cats = Array.isArray(c.categories) ? c.categories : [c.category];
      return (
        cats.some((cat: string) => cat?.toLowerCase().includes(categorySlug.toLowerCase())) ||
        c.category?.toLowerCase().includes(categorySlug.toLowerCase())
      );
    });

    if (matching.length >= 2) {
      setSelectedCentres(matching.slice(0, 3));
    } else if (matching.length === 1 && allCentres.length >= 2) {
      const fallback = allCentres.find((c: any) => c.id !== matching[0].id);
      setSelectedCentres(fallback ? [matching[0], fallback] : matching);
    }
  };

  // Book trial session
  const handleBookTrial = (acadId: string, acadName: string) => {
    const matched = allCentres.find((c: any) => c.id === acadId);
    closeModal();
    setTimeout(() => {
      openModal('trial-booking', {
        acadId,
        acadName,
        academy: matched,
        batches: matched?.batches || [],
        locality: matched?.localityName || matched?.locality,
        category: matched?.category,
      });
    }, 150);
  };

  // Filtered list of centres for the picker
  const filteredPickerCentres = useMemo(() => {
    let list = allCentres;

    if (pickerCategoryFilter !== 'all') {
      list = list.filter((c: any) => {
        const cats = Array.isArray(c.categories) ? c.categories : [c.category];
        return (
          cats.some((cat: string) =>
            cat?.toLowerCase().includes(pickerCategoryFilter.toLowerCase())
          ) || c.category?.toLowerCase().includes(pickerCategoryFilter.toLowerCase())
        );
      });
    }

    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      list = list.filter((c: any) => {
        const name = (c.name || '').toLowerCase();
        const locality = (c.locality || c.localityName || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const addr = (c.address || '').toLowerCase();
        return name.includes(q) || locality.includes(q) || cat.includes(q) || addr.includes(q);
      });
    }

    return list;
  }, [allCentres, pickerCategoryFilter, pickerSearch]);

  const selectedIds = selectedCentres.map((c) => c.id);

  return (
    <DialogWrapper
      isOpen={isModalOpen}
      onClose={closeModal}
      desktopWidth="md:max-w-4xl lg:max-w-5xl"
      title="Compare Coaching & Activity Centers"
      subtitle="Side-by-side custom comparison for Agra parents"
      icon={<Scales size={20} weight="fill" className="text-white" />}
      headerGradient="bg-gradient-to-r from-emerald-50 to-teal-50"
    >
      <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs relative max-h-[85vh]">
        {/* Intro & Preset Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Scales size={15} weight="bold" className="text-emerald-600" />
                Custom Side-by-Side Comparison
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedCentres.length} of 3 Selected
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select any 2 or 3 academies to compare verified coaches, fees, facilities, and trial passes.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Quick:
            </span>
            {PRESET_CATEGORIES.map((p) => (
              <button
                key={p.category}
                onClick={() => handleQuickPreset(p.category)}
                className="text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <CircleNotch size={32} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-500 font-semibold text-xs">
              Loading verified coaching centers from database...
            </p>
          </div>
        ) : allCentres.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-semibold bg-slate-50 rounded-2xl border border-slate-200">
            No coaching centers currently available to compare.
          </div>
        ) : (
          <>
            {/* 1. Interactive Center Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedCentres.map((c, idx) => {
                const theme = THEME_STYLES[idx % THEME_STYLES.length];
                const fee = getStartingFee(c);
                const cover =
                  (c.hasCustomImage && c.image) ||
                  c.image ||
                  resolveCategoryCoverImage(c.category || 'sports', '');

                return (
                  <div
                    key={c.id || idx}
                    className={`rounded-2xl p-3 border ${theme.cardBorder} flex flex-col justify-between gap-2.5 relative shadow-xs transition-all hover:shadow-md`}
                  >
                    {/* Slot Header Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}
                      >
                        {theme.slotLabel}
                      </span>

                      {/* Remove button (only visible when 3 centres are chosen) */}
                      {selectedCentres.length > 2 && (
                        <button
                          onClick={() => handleRemoveSlot(idx)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove this academy from comparison"
                          aria-label="Remove academy"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      )}
                    </div>

                    {/* Academy Preview Info */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={cover}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = resolveCategoryCoverImage(
                              c.category || 'sports',
                              ''
                            );
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate" title={c.name}>
                            {c.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate mt-0.5">
                          <span className="capitalize">{getCategoryDisplayName(c.category)}</span>
                          <span>•</span>
                          <span className="capitalize">{c.locality || 'Agra'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                            <Star size={11} weight="fill" />
                            {Number(c.rating || 5.0).toFixed(1)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700">
                            {fee > 0 ? `₹${fee.toLocaleString('en-IN')}/mo` : 'Fee on Inquiry'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Swap / Change Button */}
                    <button
                      onClick={() => handleOpenPicker(idx)}
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-bold py-1.5 px-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                    >
                      <ArrowsLeftRight size={13} weight="bold" />
                      <span>Change Academy</span>
                    </button>
                  </div>
                );
              })}

              {/* Slot 3: "+ Add 3rd Academy" card when only 2 are selected */}
              {selectedCentres.length === 2 && (
                <button
                  type="button"
                  onClick={() => handleOpenPicker(2)}
                  className="rounded-2xl p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/40 text-slate-600 hover:text-blue-700 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group min-h-[135px]"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center shadow-2xs">
                    <Plus size={20} weight="bold" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-slate-800 group-hover:text-blue-700">
                      + Add 3rd Academy
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Compare up to 3 centers side-by-side
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* 2. Side-by-Side Comparison Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
              <table className="w-full border-collapse text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-slate-500 font-black uppercase text-[10px] w-36 bg-slate-100/60">
                      Key Factors
                    </th>
                    {selectedCentres.map((c, idx) => {
                      const theme = THEME_STYLES[idx % THEME_STYLES.length];
                      return (
                        <th
                          key={c.id || idx}
                          className={`p-3 font-extrabold ${theme.headerText} ${theme.headerBg} border-l border-slate-200`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate max-w-[150px] font-black">{c.name}</span>
                            <span className="text-[10px] text-amber-600 font-bold flex items-center shrink-0">
                              <Star size={11} weight="fill" /> {Number(c.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* Discipline */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Discipline / Sport</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-slate-800 border-l border-slate-100">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-extrabold">
                          {getCategoryDisplayName(c.category)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Locality */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Locality & Location</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100">
                        <div className="flex items-start gap-1">
                          <MapPin size={13} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold capitalize text-slate-900 block">
                              {c.locality ? c.locality.replace('-', ' ') : 'Agra'}
                            </span>
                            {c.address && (
                              <span className="text-[10px] text-slate-500 line-clamp-1">
                                {c.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Monthly Tuition Fee */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Starting Tuition Fee</td>
                    {selectedCentres.map((c) => {
                      const fee = getStartingFee(c);
                      return (
                        <td key={c.id} className="p-3 border-l border-slate-100">
                          {fee > 0 ? (
                            <div className="font-black text-slate-900 text-sm">
                              ₹{fee.toLocaleString('en-IN')}{' '}
                              <span className="text-[10px] font-normal text-slate-500">/mo</span>
                            </div>
                          ) : (
                            <span className="text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-[11px] font-extrabold">
                              Fee on Inquiry
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Free Trial Class */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Trial Class Pass</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-emerald-700 font-extrabold border-l border-slate-100">
                        <span className="flex items-center gap-1">
                          <Sparkle size={13} weight="fill" className="text-emerald-600" />
                          {Number(c.trialFee) === 0 ? '100% Free Trial Pass' : `₹${c.trialFee} Trial`}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Student : Coach Ratio */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Student : Coach Ratio</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-slate-800 border-l border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" />
                          <span>{c.studentCoachRatio || '1 : 8 Ratio'}</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Head Coach */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Head Coach & Mentors</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-800 border-l border-slate-100">
                        <div className="font-extrabold text-slate-900 truncate max-w-[170px]">
                          {c.headCoachName || 'Certified NIS Coach'}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
                          <SealCheck size={11} weight="fill" /> Verified Mentorship
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Eligible Age Group */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Age Groups</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100">
                        {c.eligibleAgeGroup || 'Ages 4 - 17 Yrs'}
                      </td>
                    ))}
                  </tr>

                  {/* Physical Safety Grade */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Safety & KYC Audit</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-emerald-700 font-extrabold border-l border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={15} weight="fill" className="text-emerald-600" />
                          <span>
                            {c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Compliant' : 'Safety Inspected'}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Configured Batches */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Batches & Timing</td>
                    {selectedCentres.map((c) => {
                      const count = (c.batches || []).length;
                      const sample = c.batches?.[0]?.schedule || c.batches?.[0]?.timing;
                      return (
                        <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100">
                          <span className="font-extrabold text-slate-900 block">
                            {count > 0 ? `${count} Active ${count === 1 ? 'Batch' : 'Batches'}` : 'Batches on Request'}
                          </span>
                          {sample && (
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {sample}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Facilities & Infrastructure */}
                  <tr>
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/60">Infrastructure</td>
                    {selectedCentres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-600 border-l border-slate-100">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Buildings size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {Array.isArray(c.facilities) && c.facilities.length > 0
                              ? c.facilities.map((f: any) => f.name || f).join(', ')
                              : 'Synthetic Court / Professional Arena'}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Action Footer Row */}
            <div className={`pt-2 grid gap-2.5 ${selectedCentres.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {selectedCentres.map((c, idx) => {
                const theme = THEME_STYLES[idx % THEME_STYLES.length];
                return (
                  <div key={c.id} className="space-y-1.5">
                    <button
                      onClick={() => handleBookTrial(c.id, c.name)}
                      className={`w-full ${theme.btn} font-extrabold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95`}
                    >
                      <Ticket size={16} weight="fill" />
                      <span className="truncate">Book {c.name.split(' ')[0]} Trial</span>
                    </button>

                    <Link
                      href={`/activities/${c.id}`}
                      onClick={closeModal}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <span>View Full Academy Profile</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 4. In-Modal Search & Select Academy Drawer */}
        {pickerSlotIndex !== null && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50">
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Scales size={18} weight="bold" className="text-blue-600" />
                    Select Academy for {THEME_STYLES[pickerSlotIndex]?.slotLabel || `Slot ${pickerSlotIndex + 1}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose any verified academy in Agra to add into this comparison slot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerSlotIndex(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close Picker"
                  aria-label="Close Picker"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Search & Filters */}
              <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2.5 bg-white">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    weight="bold"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search by academy name, activity (e.g. Cricket, Swimming), or locality..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium text-slate-900 placeholder:text-slate-400"
                    autoFocus
                  />
                  {pickerSearch && (
                    <button
                      onClick={() => setPickerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 text-[11px]">
                  {[
                    { label: 'All Academies', slug: 'all' },
                    { label: 'Badminton', slug: 'badminton' },
                    { label: 'Cricket', slug: 'cricket' },
                    { label: 'Swimming', slug: 'swimming' },
                    { label: 'Martial Arts', slug: 'martial-arts' },
                    { label: 'Brain Booster', slug: 'brain-booster' },
                    { label: 'Tennis', slug: 'tennis' },
                    { label: 'Dance & Music', slug: 'arts' },
                  ].map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setPickerCategoryFilter(cat.slug)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                        pickerCategoryFilter === cat.slug
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Centres List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                {filteredPickerCentres.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                    No coaching centers found matching your search.
                  </div>
                ) : (
                  filteredPickerCentres.map((centre) => {
                    const isAlreadySelected = selectedIds.includes(centre.id);
                    const isCurrentSlotCentre =
                      selectedCentres[pickerSlotIndex]?.id === centre.id;
                    const fee = getStartingFee(centre);
                    const cover =
                      (centre.hasCustomImage && centre.image) ||
                      centre.image ||
                      resolveCategoryCoverImage(centre.category || 'sports', '');

                    return (
                      <div
                        key={centre.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrentSlotCentre
                            ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                            : isAlreadySelected
                            ? 'bg-slate-50/80 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={cover}
                              alt={centre.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = resolveCategoryCoverImage(
                                  centre.category || 'sports',
                                  ''
                                );
                              }}
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">
                              {centre.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="capitalize">
                                {getCategoryDisplayName(centre.category)}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{centre.locality || 'Agra'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                                <Star size={11} weight="fill" />
                                {Number(centre.rating || 5.0).toFixed(1)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">
                                {fee > 0 ? `₹${fee.toLocaleString('en-IN')}/mo` : 'Fee on Inquiry'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Select Button */}
                        <div className="shrink-0">
                          {isCurrentSlotCentre ? (
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-1.5 rounded-xl block">
                              Current Center
                            </span>
                          ) : isAlreadySelected ? (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl block">
                              In Comparison
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectAcademy(centre)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setPickerSlotIndex(null)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogWrapper>
  );
}
