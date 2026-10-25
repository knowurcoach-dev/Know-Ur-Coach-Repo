"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getParentDashboardData, toggleCentreBookmark, getDiscoveryData } from '@/lib/actions';
import { ParentBookingsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Heart,
  Star,
  MapPin,
  ShieldCheck,
  Ticket,
  Sparkle,
  Spinner,
  Trash,
  Lock,
} from '@phosphor-icons/react';

const BOOKMARK_EVENT = 'kuc_bookmarks_updated';

export default function ParentSavedPage() {
  const { user, session, isLoading } = useAuth();
  const { showToast } = usePersona();
  const { openModal } = useModalStore();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [savedList, setSavedList] = useState<any[]>([]);

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    if (isLoading) return;
    setLoading(true);
    try {
      let dbSaved: any[] = [];
      if (userEmail) {
        const res = await getParentDashboardData(userEmail);
        if (res.success && res.savedCentres) {
          dbSaved = res.savedCentres;
        }
      }

      // Check localStorage for saved IDs
      let localIds: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('kuc_saved_academies');
          if (raw) localIds = JSON.parse(raw);
        } catch {}
      }

      const existingIds = new Set(dbSaved.map((s) => s.coachingCentreId || s.centre?.id));
      const missingIds = localIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        try {
          const { centres } = await getDiscoveryData();
          const missingCentres = centres
            .filter((c: any) => missingIds.includes(c.id))
            .map((c: any) => ({
              id: `local-${c.id}`,
              coachingCentreId: c.id,
              centre: c,
            }));
          dbSaved = [...dbSaved, ...missingCentres];
        } catch (discErr) {
          console.warn("Could not load discovery centres for saved:", discErr);
        }
      }

      setSavedList(dbSaved);
    } catch (err) {
      console.warn("Could not load saved centres:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      loadData();
    }
  }, [userEmail, isLoading]);

  useEffect(() => {
    const handleBookmarkSync = () => {
      loadData();
    };
    window.addEventListener(BOOKMARK_EVENT, handleBookmarkSync);
    return () => {
      window.removeEventListener(BOOKMARK_EVENT, handleBookmarkSync);
    };
  }, [userEmail]);

  const handleRemove = (centreId: string, acadName: string) => {
    startTransition(async () => {
      try {
        setSavedList((prev) => prev.filter((item) => (item.coachingCentreId || item.centre?.id) !== centreId));

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('kuc_saved_academies');
            if (raw) {
              const arr = JSON.parse(raw);
              const nextArr = arr.filter((id: string) => id !== centreId);
              localStorage.setItem('kuc_saved_academies', JSON.stringify(nextArr));
              window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT, { detail: { savedIds: nextArr } }));
            }
          } catch {}
        }

        if (userEmail) {
          await toggleCentreBookmark(userEmail, centreId);
        }
        showToast(`Removed ${acadName} from saved list`);
      } catch {
        showToast('Failed to update bookmark');
      }
    });
  };

  if (loading) {
    return <ParentBookingsSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-rose-200">
              <Heart size={14} weight="fill" className="text-rose-400" />
              Saved Coaching Centres
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Shortlisted Academies
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
              Keep track of verified sports academies, badminton arenas, and hobby classes you want to review or book trials with later.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 flex items-center gap-3">
            <div className="text-3xl font-black text-rose-300">{savedList.length}</div>
            <div className="text-xs text-white/80 font-bold leading-tight">
              Saved<br />Academies
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Spinner size={32} className="animate-spin text-rose-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading saved academies...</p>
          </div>
        ) : savedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedList.map((item) => {
              const centre = item.centre;
              if (!centre) return null;

              const batchFees = (centre.batches || [])
                .map((b: any) => Number(b.monthlyFee))
                .filter((fee: number) => !isNaN(fee) && fee > 0);
              const minFee = batchFees.length > 0 ? Math.min(...batchFees) : Number(centre.monthlyTuitionFee || 0);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {centre.isSuspended ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full inline-block">
                            Temporarily Unavailable
                          </span>
                        ) : centre.kycStatus !== 'APPROVED' ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                            Verification In Progress
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {centre.category || 'Sports'}
                          </span>
                        )}
                        <h3 className="font-black text-slate-900 text-base mt-1.5 leading-snug">
                          {centre.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                          <MapPin size={13} weight="bold" />
                          <span>{centre.locality}{centre.city ? `, ${centre.city}` : ''}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemove(centre.id, centre.name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Remove from saved"
                      >
                        <Trash size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {centre.tagline || 'Verified sports training academy with certified coaching staff.'}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-1 text-amber-500 font-black">
                        <Star size={14} weight="fill" />
                        <span>{Number(centre.rating || 5.0).toFixed(1)}</span>
                      </div>
                      <div className="text-slate-400">•</div>
                      <div className="text-slate-600 font-bold">
                        {minFee > 0 ? `Starts from ₹${minFee}/mo` : 'Fee on Inquiry'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    {centre.isSuspended || centre.kycStatus !== 'APPROVED' ? (
                      <div className="flex-1 bg-slate-200/80 text-slate-500 font-extrabold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <Lock size={14} />
                        <span>{centre.isSuspended ? 'Temporarily Suspended' : 'Under Verification'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          openModal('trial-booking', {
                            acadId: centre.id,
                            acadName: centre.name,
                            locality: centre.locality,
                            category: centre.category,
                            academy: centre,
                            batches: (centre as any).batches || [],
                          })
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Ticket size={15} weight="bold" />
                        <span>Book Free Trial</span>
                      </button>
                    )}
                    <Link
                      href={`/activities/${centre.id}`}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Heart size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Saved Academies</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you browse sports and hobby centers, click the bookmark icon to save your favorite academies here for instant booking.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 bg-[#0066ff] text-white text-xs font-extrabold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Sparkle size={16} weight="fill" />
                <span>Discover Centers</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
