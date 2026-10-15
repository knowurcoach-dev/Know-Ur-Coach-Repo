"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import {
  Ticket,
  User,
  Users,
  Heart,
  CurrencyInr,
  Bell,
  Gear,
  SignOut,
  SealCheck,
  House,
  Sparkle,
  LockKey,
  QrCode,
} from '@phosphor-icons/react';

const navItems = [
  {
    group: 'Admissions & Bookings',
    items: [
      { label: 'My Bookings & Admissions', href: '/parent/bookings', icon: Ticket },
    ],
  },
  {
    group: 'My Children',
    items: [
      { label: 'Child Profiles', href: '/parent/children', icon: Users },
    ],
  },
  {
    group: 'Discover',
    items: [
      { label: 'Saved Academies', href: '/parent/saved', icon: Heart },
      { label: 'Browse Academies', href: '/activities', icon: Sparkle },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Tuition & Payment Records', href: '/parent/payments', icon: CurrencyInr },
      { label: 'Notifications', href: '/parent/notifications', icon: Bell },
      { label: 'Account Settings', href: '/parent/settings', icon: Gear },
    ],
  },
];

export interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function ParentSidebar({ isMobile = false, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={
        isMobile
          ? "w-full flex flex-col bg-white min-h-full"
          : "w-64 flex-shrink-0 hidden md:flex flex-col bg-white border-r border-slate-200/80 min-h-full"
      }
    >
      {/* Sidebar Header — Parent Profile */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 text-sm truncate leading-tight">
              {user?.name || 'Parent Account'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <SealCheck size={12} weight="fill" className="text-emerald-600 shrink-0" />
              <span className="text-[10px] text-emerald-700 font-bold truncate">
                Verified Parent Member
              </span>
            </div>
          </div>
        </div>

        {/* Zero Platform Fee Trust Badge */}
        <div className="mt-3 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <SealCheck size={14} weight="fill" className="text-blue-600 shrink-0" />
          <span className="text-[10px] text-blue-900 font-bold leading-tight">
            Direct Academy Admissions • ₹0 Fee
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 px-2">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onNavigate?.()}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      size={16}
                      weight={active ? 'fill' : 'bold'}
                      className={active ? 'text-blue-600' : 'text-slate-400'}
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
      <div className="p-4 border-t border-slate-100 space-y-2">
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
