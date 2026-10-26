"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import {
  ChartDonut,
  ShieldCheck,
  Users,
  Buildings,
  Trophy,
  Palette,
  CurrencyInr,
  CreditCard,
  Gear,
  House,
  SignOut,
  SealCheck,
  Warning,
  Receipt,
  Slideshow,
  MapPin,
  Laptop,
} from '@phosphor-icons/react';

const navItems = [
  {
    group: 'Governance',
    items: [
      { label: 'Overview Dashboard', href: '/admin', icon: ChartDonut, exactMatch: true },
      { label: 'Payments & Orders', href: '/admin/orders', icon: Receipt },
      { label: 'Coach KYC Queue', href: '/admin/verify-coaches', icon: ShieldCheck },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
    ],
  },
  {
    group: 'Registry',
    items: [
      { label: 'Parent Registry', href: '/admin/parents', icon: Users },
      { label: 'Coach & Academy Registry', href: '/admin/coaches', icon: Buildings },
    ],
  },
  {
    group: 'Platform',
    items: [
      { label: 'Hero Carousel', href: '/admin/hero-slides', icon: Slideshow },
      { label: 'Location Management', href: '/admin/locations', icon: MapPin },
      { label: 'Competition Management', href: '/admin/competitions', icon: Trophy },
      { label: 'Activities & Disciplines', href: '/admin/categories', icon: Palette },
      { label: 'Delivery Modes', href: '/admin/modes', icon: Laptop },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { label: 'Fee & Plan Config', href: '/admin/plans', icon: CurrencyInr },
      { label: 'Payment Gateway', href: '/admin/payments', icon: CreditCard },
      { label: 'Theme & Styling', href: '/admin/theme', icon: Palette },
      { label: 'Platform Settings', href: '/admin/config', icon: Gear },
    ],
  },
];

export interface AdminSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ isMobile = false, onNavigate }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string, exactMatch?: boolean) => {
    if (exactMatch) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={
        isMobile
          ? "w-full flex flex-col bg-slate-900 min-h-full"
          : "w-64 flex-shrink-0 hidden md:flex flex-col bg-slate-900 border-r border-slate-700 min-h-full"
      }
    >
      {/* Sidebar Header — Admin Profile */}
      <div className="p-5 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-white text-sm truncate leading-tight">
              {user?.name || 'Super Admin'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <SealCheck size={12} weight="fill" className="text-purple-400 shrink-0" />
              <span className="text-[10px] text-purple-300 font-bold">
                KnowUrCoach Admin Suite
              </span>
            </div>
          </div>
        </div>

        {/* Alert badge */}
        <div className="mt-3 flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
          <Warning size={14} weight="fill" className="text-amber-400 shrink-0" />
          <span className="text-[10px] text-amber-300 font-bold">
            3 KYC Approvals Pending
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 px-2">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon, exactMatch }) => {
                const active = isActive(href, exactMatch);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onNavigate?.()}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={16}
                      weight={active ? 'fill' : 'bold'}
                      className={active ? 'text-purple-200' : 'text-slate-500'}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-700 space-y-1">
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
        >
          <House size={15} weight="bold" />
          <span>View Public Site</span>
        </Link>
        <button
          onClick={() => {
            onNavigate?.();
            signOut({ callbackUrl: '/' });
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-900/30 transition-all cursor-pointer"
        >
          <SignOut size={15} weight="bold" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
