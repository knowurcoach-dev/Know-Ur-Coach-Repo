"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  House,
  Sparkle,
  Trophy,
  CalendarCheck,
  User,
  Users,
  Gear,
  ShieldCheck,
  SignIn,
} from '@phosphor-icons/react';

export function BottomNavBar() {
  const pathname = usePathname();
  const { isGuest, isParent, isCoach, isAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems = React.useMemo(() => {
    if (isCoach) {
      return [
        { id: 'home', label: 'Home', href: '/', Icon: House },
        { id: 'activities', label: 'Discover', href: '/activities', Icon: Sparkle },
        { id: 'leads', label: 'Leads', href: '/coach/leads', Icon: Users },
        { id: 'dashboard', label: 'Dashboard', href: '/coach/dashboard', Icon: CalendarCheck },
      ];
    }
    if (isAdmin) {
      return [
        { id: 'home', label: 'Home', href: '/', Icon: House },
        { id: 'activities', label: 'Discover', href: '/activities', Icon: Sparkle },
        { id: 'kyc', label: 'KYC Queue', href: '/admin/verify-coaches', Icon: ShieldCheck },
        { id: 'admin', label: 'Admin', href: '/admin', Icon: Gear },
      ];
    }
    if (isParent) {
      return [
        { id: 'home', label: 'Home', href: '/', Icon: House },
        { id: 'activities', label: 'Discover', href: '/activities', Icon: Sparkle },
        { id: 'competitions', label: 'Tournaments', href: '/competitions', Icon: Trophy },
        { id: 'bookings', label: 'My Passes', href: '/parent/bookings', Icon: CalendarCheck },
      ];
    }
    // Guest view: No authenticated "My Passes" link!
    return [
      { id: 'home', label: 'Home', href: '/', Icon: House },
      { id: 'activities', label: 'Discover', href: '/activities', Icon: Sparkle },
      { id: 'competitions', label: 'Tournaments', href: '/competitions', Icon: Trophy },
      { id: 'signin', label: 'Sign In', href: '/login', Icon: SignIn },
    ];
  }, [isGuest, isParent, isCoach, isAdmin]);

  return (
    <nav
      id="bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.12)]"
    >
      {navItems.map(({ id, label, href, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={id}
            href={href}
            prefetch={true}
            id={`nav-${id}`}
            className={`flex flex-col items-center gap-0.5 transition-all w-14 py-0.5 active:scale-95 ${
              active ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'
            }`}
          >
            <Icon
              size={24}
              weight={active ? 'fill' : 'bold'}
              className="transition-transform"
            />
            <span
              className={`text-[9px] tracking-tight ${
                active ? 'font-extrabold text-emerald-600' : 'font-semibold text-gray-500'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
