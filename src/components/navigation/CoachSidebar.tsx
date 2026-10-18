"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import {
  ChartLine,
  CalendarCheck,
  Users,
  CurrencyInr,
  PencilSimple,
  ClipboardText,
  SealCheck,
  House,
  SignOut,
  Star,
  Buildings,
  Gear,
  Megaphone,
  CreditCard,
  Lock,
  Trophy,
} from '@phosphor-icons/react';
import { getCoachDashboardData } from '@/lib/actions';

const navItems = [
  {
    group: 'Operations',
    items: [
      { label: 'Operations Overview', href: '/coach/dashboard', icon: ChartLine, isGated: false },
      { label: 'Live Attendance Roster', href: '/coach/attendance', icon: CalendarCheck, isGated: true },
    ],
  },
  {
    group: 'Students & Leads',
    items: [
      { label: 'Student Leads (CRM)', href: '/coach/leads', icon: Users, isGated: true },
      { label: 'Enrolled Students', href: '/coach/students', icon: ClipboardText, isGated: true },
    ],
  },
  {
    group: 'Academy Management',
    items: [
      { label: 'Batch Management', href: '/coach/batches', icon: CalendarCheck, isGated: true },
      { label: 'Tournaments & Events', href: '/coach/tournaments', icon: Trophy, isGated: true },
      { label: 'Revenue & Analytics', href: '/coach/revenue', icon: CurrencyInr, isGated: true },
      { label: 'Academy Profile', href: '/coach/profile', icon: Buildings, isGated: false },
    ],
  },
  {
    group: 'Plans & Visibility',
    items: [
      { label: 'Payment & Plan', href: '/coach/plans', icon: CreditCard, isGated: false },
      { label: 'Public Directory Page', href: '/coach/listings', icon: Star, isGated: true },
      { label: 'Promote Center', href: '/coach/promote', icon: Megaphone, isGated: true },
    ],
  },
];

export interface CoachSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function CoachSidebar({ isMobile = false, onNavigate }: CoachSidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [centreData, setCentreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userEmail = (user as any)?.email;

  useEffect(() => {
    async function loadCentre() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      try {
        const res = await getCoachDashboardData(userEmail);
        if (res.success && res.centre) {
          setCentreData(res.centre);
        }
      } catch (e) {
        console.warn('Sidebar centre load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCentre();
  }, [userEmail, pathname]);

  const hasBasicProfile = Boolean(centreData?.name?.trim() && centreData?.address?.trim());
  const hasSubmittedKyc =
    centreData?.kycStatus === 'DOCS_REVIEW' ||
    centreData?.kycStatus === 'APPROVED' ||
    centreData?.kycStatus === 'INSPECTION_SCHEDULED' ||
    Boolean(centreData?.statusNotes && centreData.statusNotes.includes('In-app digital KYC submitted'));

  const hasActivePlan =
    centreData?.planTier === 'STANDARD' ||
    centreData?.planTier === 'PREMIUM' ||
    Boolean(centreData?.planPurchasedAt || centreData?.planPaymentId);

  const isKycApproved = centreData?.kycStatus === 'APPROVED';

  // Operations are unlocked strictly when an active purchased plan is held
  const isOperationsUnlocked = loading ? true : hasActivePlan;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || (href !== '/coach/dashboard' && pathname.startsWith(href));
  };

  const academyName = centreData?.name || (user?.name ? `${user.name}'s Academy` : 'My Coaching Centre');
  const locality = centreData?.locality || (user as any)?.locality || 'Verified Academy Campus';
  const plan = centreData?.planTier || 'FREE';

  return (
    <aside
      className={
        isMobile
          ? "w-full flex flex-col bg-white min-h-full"
          : "w-64 flex-shrink-0 hidden md:flex flex-col bg-white border-r border-slate-200/80 min-h-full"
      }
    >
      {/* Sidebar Header — Coach Profile */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 text-sm truncate leading-tight">
              {user?.name || 'Coach Account'}
            </div>
            {loading ? (
              <div className="w-20 h-3 bg-slate-100 rounded mt-1 animate-pulse" />
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <SealCheck size={12} weight="fill" className={centreData?.kycStatus === 'APPROVED' ? "text-emerald-600 shrink-0" : "text-amber-500 shrink-0"} />
                <span className={`text-[10px] font-bold truncate ${
                  centreData?.kycStatus === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {centreData?.kycStatus === 'APPROVED' ? 'KYC Verified' : 'Compliance Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Academy Name & Plan info */}
        {loading ? (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-12 h-2.5 bg-slate-200 rounded" />
              <div className="w-10 h-3 bg-slate-200 rounded" />
            </div>
            <div className="w-28 h-3.5 bg-slate-200 rounded" />
            <div className="w-20 h-2.5 bg-slate-200 rounded" />
          </div>
        ) : (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Academy</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                {plan}
              </span>
            </div>
            <div className="text-xs font-extrabold text-slate-900 truncate">
              {academyName}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {locality}
            </div>
          </div>
        )}

        {/* Alert badge if setup incomplete */}
        {!loading && !isOperationsUnlocked && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-bold flex items-center gap-1.5">
            <Lock size={12} weight="bold" className="text-amber-600 shrink-0" />
            <span>Setup Incomplete: Finish profile &amp; plan</span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 px-2">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon, isGated }) => {
                const active = isActive(href);
                const isLocked = isGated && !isOperationsUnlocked;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onNavigate?.()}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-slate-900 text-white'
                        : isLocked
                        ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        size={16}
                        weight={active ? 'fill' : 'bold'}
                        className={active ? 'text-emerald-400' : isLocked ? 'text-slate-300' : 'text-slate-400'}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {isLocked && (
                      <Lock size={13} weight="bold" className="text-amber-500 shrink-0 ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          href="/activities"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <PencilSimple size={15} weight="bold" className="text-slate-400" />
          <span>Browse Public Directory</span>
        </Link>
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <House size={15} weight="bold" className="text-slate-400" />
          <span>Back to Home</span>
        </Link>
        <button
          onClick={() => {
            onNavigate?.();
            signOut({ callbackUrl: '/' });
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        >
          <SignOut size={15} weight="bold" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
