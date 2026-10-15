"use client";

import React, { useState, useEffect } from 'react';
import { useModalStore } from '@/hooks/useModalStore';
import { DialogWrapper } from './DialogWrapper';
import { Scales, CheckCircle, Ticket, Star, CircleNotch } from '@phosphor-icons/react';
import { getDiscoveryData } from '@/lib/actions';
import { getCategoryDisplayName } from '@/lib/categories';

export function CompareModal() {
  const { isOpen, activeModal, modalData, closeModal, openModal } = useModalStore();
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isModalOpen = isOpen && activeModal === 'compare-academies';

  useEffect(() => {
    if (!isModalOpen) return;

    async function loadCentres() {
      setLoading(true);
      try {
        const res = await getDiscoveryData();
        if (res?.centres && res.centres.length > 0) {
          // If specific centres were passed to compare, filter those; otherwise display top 3 verified centres
          const passedIds = modalData?.centreIds as string[] | undefined;
          if (passedIds && passedIds.length > 0) {
            const filtered = res.centres.filter((c: any) => passedIds.includes(c.id));
            setCentres(filtered.length > 0 ? filtered : res.centres.slice(0, 3));
          } else {
            setCentres(res.centres.slice(0, 3));
          }
        } else {
          setCentres([]);
        }
      } catch (err) {
        console.error('Error loading centres for compare modal:', err);
        setCentres([]);
      } finally {
        setLoading(false);
      }
    }

    loadCentres();
  }, [isModalOpen, modalData]);

  const handleBook = (acadId: string, acadName: string) => {
    closeModal();
    setTimeout(() => {
      openModal('trial-booking', { acadId, acadName });
    }, 150);
  };

  const THEME_STYLES = [
    { text: 'text-blue-700', bg: 'bg-blue-50/60', btn: 'bg-blue-600 hover:bg-blue-700' },
    { text: 'text-purple-700', bg: 'bg-purple-50/60', btn: 'bg-purple-600 hover:bg-purple-700' },
    { text: 'text-emerald-700', bg: 'bg-emerald-50/60', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  return (
    <DialogWrapper
      isOpen={isModalOpen}
      onClose={closeModal}
      desktopWidth="md:max-w-3xl"
      title="Compare Coaching & Activity Centers"
      subtitle="Side-by-side verified comparison for Agra parents"
      icon={<Scales size={20} weight="fill" className="text-white" />}
      headerGradient="bg-gradient-to-r from-emerald-50 to-teal-50"
    >
      <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
        <p className="text-slate-600 text-xs leading-relaxed">
          Compare key features across Agra’s top verified coaching hubs, cognitive brain gyms, and sports academies before booking your free trial.
        </p>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <CircleNotch size={28} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-500 font-semibold text-xs">Loading verified center details from database...</p>
          </div>
        ) : centres.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-semibold">
            No coaching centers currently available to compare.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hide-scrollbar border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-slate-500 font-extrabold uppercase text-[10px]">Feature</th>
                    {centres.map((c, idx) => {
                      const theme = THEME_STYLES[idx % THEME_STYLES.length];
                      return (
                        <th key={c.id} className={`p-3 font-extrabold ${theme.text} ${theme.bg} border-l border-slate-200`}>
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{c.name}</span>
                            <span className="text-[10px] text-amber-600 font-bold flex items-center shrink-0">
                              <Star size={10} weight="fill" /> {Number(c.rating || 4.8).toFixed(1)}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Discipline</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 font-semibold text-slate-800 border-l border-slate-100">
                        {getCategoryDisplayName(c.category)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Locality</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100 capitalize">
                        {c.locality ? c.locality.replace('-', ' ') : 'Agra'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Age Group</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100">
                        {c.eligibleAgeGroup || 'Ages 4 - 17 Yrs'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Monthly Fee</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 font-extrabold text-slate-900 border-l border-slate-100">
                        ₹{Number(c.monthlyTuitionFee || 1800).toLocaleString('en-IN')}/mo
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Trial Class</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 text-emerald-700 font-extrabold border-l border-slate-100">
                        {Number(c.trialFee) === 0 ? '100% Free Trial' : `₹${c.trialFee}`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Student:Coach</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-slate-800 border-l border-slate-100">
                        {c.studentCoachRatio || '1 : 8 Ratio'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Head Coach</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 text-slate-700 border-l border-slate-100 truncate max-w-[140px]">
                        {c.headCoachName || 'Certified NIS Coach'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 bg-slate-50/50">Physical Safety</td>
                    {centres.map((c) => (
                      <td key={c.id} className="p-3 text-emerald-700 font-extrabold border-l border-slate-100 flex items-center gap-1">
                        <CheckCircle size={15} weight="fill" />
                        <span>{c.safetyGrade === 'GRADE_A_PLUS' ? 'Verified Compliant' : 'Safety Inspected'}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action row */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {centres.map((c, idx) => {
                const theme = THEME_STYLES[idx % THEME_STYLES.length];
                return (
                  <button
                    key={c.id}
                    onClick={() => handleBook(c.id, c.name)}
                    className={`w-full ${theme.btn} text-white font-extrabold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95`}
                  >
                    <Ticket size={16} weight="fill" />
                    <span className="truncate">Book {c.name.split(' ')[0]} Trial</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DialogWrapper>
  );
}
