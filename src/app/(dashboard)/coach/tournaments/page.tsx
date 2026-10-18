"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { getCoachTournamentsAction, toggleTournamentCheckInAction } from '@/lib/actions';
import { HostTournamentModal } from '@/components/modals/HostTournamentModal';
import {
  Trophy,
  PlusCircle,
  Users,
  CurrencyInr,
  CalendarBlank,
  Clock,
  MapPin,
  SealCheck,
  WhatsappLogo,
  CheckCircle,
  XCircle,
  Check,
  Lock,
  LockKey,
  Crown,
  ArrowRight,
  CircleNotch,
  ArrowSquareOut,
  FilePdf,
  ShieldCheck,
  Ticket,
  CaretDown,
  CaretUp,
  DownloadSimple,
  Printer,
  Sparkle,
} from '@phosphor-icons/react';

export default function CoachTournamentsPage() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { showToast, activeCity } = usePersona();
  const { openModal } = useModalStore();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [centre, setCentre] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await getCoachTournamentsAction(userEmail);
      if (res.success) {
        setCentre(res.centre);
        setIsSubscribed(Boolean(res.isSubscribed));
        setTournaments(res.tournaments || []);
        if (res.tournaments && res.tournaments.length > 0 && !expandedTournamentId) {
          setExpandedTournamentId(res.tournaments[0].id);
        }
      } else {
        showToast(res.message || 'Could not load tournament data');
      }
    } catch (err) {
      console.error('Error loading coach tournaments:', err);
      showToast('⚠️ Failed to load tournament dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const handleToggleCheckIn = (tournamentId: string, bookingId: string, currentCheckedIn: boolean) => {
    startTransition(async () => {
      try {
        const nextState = !currentCheckedIn;
        const res = await toggleTournamentCheckInAction(bookingId, nextState);
        if (res.success) {
          showToast(res.message || (nextState ? 'Checked In!' : 'Check-in cleared'));
          // Update local state optimistically
          setTournaments((prev) =>
            prev.map((t) => {
              if (t.id !== tournamentId) return t;
              return {
                ...t,
                participants: t.participants.map((p: any) =>
                  p.bookingId === bookingId ? { ...p, isCheckedIn: nextState, checkedInAt: nextState ? new Date() : null } : p
                ),
              };
            })
          );
        } else {
          showToast(res.message || 'Failed to update check-in');
        }
      } catch (err) {
        console.error('Check-in error:', err);
        showToast('⚠️ Error updating check-in state');
      }
    });
  };

  const handleExportCSV = (tournament: any) => {
    if (!tournament.participants || tournament.participants.length === 0) {
      showToast('No participants to export yet.');
      return;
    }

    const headers = ['Pass ID', 'Child Name', 'Age', 'Parent Name', 'Parent Phone', 'Parent Email', 'Amount (INR)', 'Payment Status', 'Check-In Status', 'Registered At'];
    const rows = tournament.participants.map((p: any) => [
      p.passId,
      `"${p.childName}"`,
      p.childAge,
      `"${p.parentName}"`,
      p.parentPhone,
      p.parentEmail,
      p.netAmountPaid,
      p.paymentStatus,
      p.isCheckedIn ? 'CHECKED IN' : 'PENDING',
      new Date(p.registeredAt).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournament.title.replace(/[^a-zA-Z0-9]/g, '_')}_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Participant roster CSV exported!');
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={36} className="animate-spin text-orange-600 mb-3" />
        <p className="text-sm font-bold text-slate-600">Loading tournaments &amp; events hub...</p>
      </div>
    );
  }

  // ========================================================
  // CASE 1: UNLOCKED STATE (ACTIVE STANDARD / PREMIUM PLAN)
  // ========================================================
  if (!isSubscribed) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-left">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/coach/dashboard" className="hover:text-orange-600">Coach Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Tournaments &amp; Events</span>
        </div>

        {/* Feature Lock Paywall Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Lock size={14} weight="bold" />
              <span>Standard &amp; Premium Plan Exclusive</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Host Sanctioned Tournaments &amp; Accept Registrations Online
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Unlock the complete tournament operations suite for <strong>{centre?.name || 'your academy'}</strong>. Host city-wide youth championships, collect entry fees directly via Razorpay or offer free passes, download participant rosters, and use the QR check-in scanner on match day.
            </p>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>Host Unlimited Youth Tournaments</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>Collect Fees via Razorpay (or ₹0 Free)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>Real-Time Registered Players Roster</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>Parent Contacts &amp; WhatsApp Messaging</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>Digital QR Pass Verification on Match Day</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />
                <span>CSV Export &amp; Printable Roster Slips</span>
              </div>
            </div>

            {/* Upgrade CTA Button */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/coach/plans"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Crown size={18} weight="fill" />
                <span>Upgrade to Standard or Premium Plan</span>
                <ArrowRight size={16} weight="bold" />
              </Link>

              <Link
                href="/coach/dashboard"
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // CASE 2: SUBSCRIBED STATE (ACTIVE COACH PARTNER)
  // ========================================================
  const totalTournaments = tournaments.length;
  const totalParticipants = tournaments.reduce((acc, t) => acc + (t.participantsCount || 0), 0);
  const totalRevenue = tournaments.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header & Host Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/coach/dashboard" className="hover:text-orange-600">Coach Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Tournaments &amp; Events Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tournaments &amp; Events Hub</span>
            <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              Partner Hub
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Host championships, inspect participant rosters, and verify match day attendance for {centre?.name}.
          </p>
        </div>

        <button
          onClick={() => openModal('competition-host')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-95 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-600/25 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle size={20} weight="bold" />
          <span>Host New Tournament</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Trophy size={26} weight="fill" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tournaments Hosted</span>
            <span className="text-2xl font-black text-slate-900">{totalTournaments}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={26} weight="fill" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Registered Kids</span>
            <span className="text-2xl font-black text-slate-900">{totalParticipants}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CurrencyInr size={26} weight="bold" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Revenue Collected</span>
            <span className="text-2xl font-black text-emerald-700">₹{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tournaments List & Rosters */}
      {tournaments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <Trophy size={32} weight="duotone" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-900">No Tournaments Hosted Yet</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              You haven't posted any competitions under {centre?.name}. Click below to publish your first youth championship and start accepting registrations!
            </p>
          </div>
          <button
            onClick={() => openModal('competition-host')}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle size={18} weight="bold" />
            <span>Host First Tournament</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tournaments.map((tournament) => {
            const isExpanded = expandedTournamentId === tournament.id;
            const participants = tournament.participants || [];
            const checkedInCount = participants.filter((p: any) => p.isCheckedIn).length;

            return (
              <div
                key={tournament.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
              >
                {/* Tournament Card Header */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 border-b border-slate-200/80">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {tournament.sport || 'Sports'}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Open
                      </span>
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <CalendarBlank size={14} />
                        <span>{tournament.dates}</span>
                      </span>
                    </div>

                    <h3 className="font-black text-lg text-slate-900 tracking-tight truncate">
                      {tournament.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                      <span>Venue: <strong className="text-slate-800">{tournament.venue}</strong></span>
                      <span>•</span>
                      <span>Divisions: <strong className="text-slate-800">{tournament.ageDivisions}</strong></span>
                      <span>•</span>
                      <span>
                        Fee: <strong className="text-emerald-700">{tournament.registrationFee === 0 ? 'FREE' : `₹${tournament.registrationFee}`}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/competitions/${tournament.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors"
                      title="View public tournament page"
                    >
                      <ArrowSquareOut size={14} weight="bold" />
                      <span>View Public Page</span>
                    </Link>

                    <button
                      onClick={() => handleExportCSV(tournament)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Export CSV Roster"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span>Export Roster</span>
                    </button>

                    <button
                      onClick={() => setExpandedTournamentId(isExpanded ? null : tournament.id)}
                      className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-black px-4 py-2 rounded-xl border border-orange-200 transition-colors cursor-pointer"
                    >
                      <span>{participants.length} Participants ({checkedInCount} Checked In)</span>
                      {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Participants Roster */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                          <Users size={16} weight="bold" className="text-orange-600" />
                          <span>Registered Participants Roster</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Real-time registrations verified via KnowUrCoach portal with online / venue settlement
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          ✓ {checkedInCount} Checked In
                        </span>
                        <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          ⏳ {participants.length - checkedInCount} Pending
                        </span>
                      </div>
                    </div>

                    {participants.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">
                        No participants have registered for this tournament yet. Share the public link with parents!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200/80">
                              <th className="py-2.5 px-3">Pass ID</th>
                              <th className="py-2.5 px-3">Child Name</th>
                              <th className="py-2.5 px-3">Age</th>
                              <th className="py-2.5 px-3">Parent Name</th>
                              <th className="py-2.5 px-3">Contact</th>
                              <th className="py-2.5 px-3">Fee &amp; Payment</th>
                              <th className="py-2.5 px-3">Match Day Check-In</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {participants.map((p: any) => (
                              <tr key={p.bookingId} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3 font-mono font-black text-orange-600 text-[11px]">
                                  {p.passId}
                                </td>
                                <td className="py-3 px-3 font-extrabold text-slate-900">
                                  {p.childName}
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-600">
                                  {p.childAge} Yrs
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-700">
                                  {p.parentName}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[11px] text-slate-800 font-semibold">{p.parentPhone || '—'}</span>
                                    {p.parentPhone && (
                                      <a
                                        href={`https://wa.me/${p.parentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${p.parentName}, regarding ${tournament.title} for ${p.childName}...`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 p-1"
                                        title="WhatsApp parent"
                                      >
                                        <WhatsappLogo size={16} weight="fill" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                      p.isPaid
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : (p.grossAmount === 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800')
                                    }`}
                                  >
                                    {p.paymentStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleToggleCheckIn(tournament.id, p.bookingId, Boolean(p.isCheckedIn))}
                                    disabled={isPending}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                                      p.isCheckedIn
                                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {p.isCheckedIn ? (
                                      <>
                                        <Check size={12} weight="bold" />
                                        <span>Checked In</span>
                                      </>
                                    ) : (
                                      <span>Mark Present</span>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Host Tournament Modal Component */}
      <HostTournamentModal onTournamentCreated={loadData} />
    </div>
  );
}
