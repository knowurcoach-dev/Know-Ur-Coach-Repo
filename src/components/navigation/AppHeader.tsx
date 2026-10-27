"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersona } from '@/context/PersonaContext';
import { useModalStore } from '@/hooks/useModalStore';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import {
  MapPin,
  CaretDown,
  Bell,
  House,
  Sparkle,
  Trophy,
  UserCircle,
  Buildings,
  Gift,
  User,
  SignOut,
  List,
  WhatsappLogo,
} from '@phosphor-icons/react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { HeaderMenuDrawer } from './HeaderMenuDrawer';
import { SUPPORT_WHATSAPP_URL } from '@/components/ui/WhatsAppSupportWidget';

interface AppHeaderProps {
  onOpenLocality?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

export function AppHeader({
  onOpenLocality,
  onOpenNotifications,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { activeLocality, activeCity, unreadCount } = usePersona();
  const { isAuthenticated, isGuest, isParent, isCoach, isAdmin, user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showAuthenticated = isMounted && isAuthenticated;
  const showCoach = isMounted && isCoach;
  const showAdmin = isMounted && isAdmin;
  const showParent = isMounted && isParent;
  const showGuest = isMounted ? isGuest : true;

  const isAdminPath = pathname.startsWith('/admin');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      {/* ==========================================
          DESKTOP NAVIGATION (Visible on md and up)
         ========================================== */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 lg:gap-4">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <BrandLogo size="md" />

            {/* City & Locality Selector Pill */}
            <button
              id="desktop-location-btn"
              onClick={onOpenLocality}
              className="flex items-center gap-1.5 lg:gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            >
              <MapPin size={15} weight="fill" className="text-red-500 shrink-0" />
              <span className="whitespace-nowrap">
                {activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase() ? `${activeLocality}, ${activeCity}` : activeCity}
              </span>
              <CaretDown size={12} weight="bold" className="text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Desktop Nav Links — Public pages only */}
          {!isAdminPath && (
            <nav className="flex items-center gap-1 lg:gap-2 text-xs font-bold shrink-0 whitespace-nowrap">
              <Link
                href="/"
                prefetch={true}
                className={`px-2.5 lg:px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap ${
                  pathname === '/' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </Link>
              <Link
                href="/activities"
                prefetch={true}
                id="desktop-nav-discover"
                className={`px-2.5 lg:px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                  pathname === '/activities' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkle size={14} weight="fill" className={pathname === '/activities' ? 'text-emerald-600' : 'text-slate-400'} />
                <span>Discover</span>
              </Link>
              <Link
                href="/competitions"
                prefetch={true}
                id="desktop-nav-tournaments"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap font-extrabold text-xs shadow-xs ${
                  pathname === '/competitions'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/25 ring-2 ring-orange-400/30'
                    : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 hover:border-amber-400 text-amber-900 hover:bg-amber-100/70 hover:shadow-sm'
                }`}
              >
                <Trophy
                  size={15}
                  weight="fill"
                  className={pathname === '/competitions' ? 'text-white' : 'text-amber-600'}
                />
                <span className="whitespace-nowrap">Tournaments</span>
                <span
                  className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    pathname === '/competitions'
                      ? 'bg-white/25 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${pathname === '/competitions' ? 'bg-white' : 'bg-white animate-ping'}`} />
                  Live
                </span>
              </Link>
              {showParent && (
                <Link
                  href="/parent/bookings"
                  className={`px-2.5 lg:px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap ${
                    pathname.startsWith('/parent') ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Passes
                </Link>
              )}
              {showCoach && (
                <Link
                  href="/coach/dashboard"
                  className={`px-2.5 lg:px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap ${
                    pathname.startsWith('/coach') ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Coach Dashboard
                </Link>
              )}
              {showAdmin && (
                <Link
                  href="/admin"
                  className={`px-2.5 lg:px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap ${
                    pathname.startsWith('/admin') ? 'text-purple-700 bg-purple-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Admin Console
                </Link>
              )}
            </nav>
          )}

          {/* Admin breadcrumb when in admin area */}
          {isAdminPath && (
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 shrink-0 whitespace-nowrap">
              <span className="text-gray-400 font-normal">Admin Suite</span>
              <span className="text-gray-300">›</span>
              <span>{pathname.replace('/admin', '').replace('/', '').replace('-', ' ') || 'Dashboard'}</span>
            </div>
          )}

          {/* Desktop Right CTAs */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
            {!isAdminPath && showGuest && (
              <>
                {/* Register Coach Link - for guest academy owners only */}
                <Link
                  href="/register-coach"
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Buildings size={15} weight="fill" className="text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">List Academy</span>
                </Link>
              </>
            )}

            {/* Notification bell */}
            <button
              id="desktop-notifications-btn"
              onClick={onOpenNotifications}
              className="relative text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Notifications"
            >
              <Bell size={18} weight="bold" className="shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* WhatsApp Support Direct Chat (Desktop) */}
            <a
              id="desktop-header-whatsapp-btn"
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 transition-all cursor-pointer shrink-0 shadow-2xs group"
              title="Chat with KnowUrCoach Support on WhatsApp"
              aria-label="WhatsApp Support Chat"
            >
              <WhatsappLogo size={18} weight="fill" className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden xl:inline text-xs font-extrabold text-emerald-800">Support</span>
            </a>

            {/* Menu Breadcrumb Button (Beside notification bell) */}
            <button
              id="desktop-header-menu-btn"
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 p-2 lg:px-2.5 lg:py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:border-emerald-200 transition-all cursor-pointer shrink-0 shadow-2xs group"
              title="Menu & Directory: All Routes, WhatsApp Support, Policies"
              aria-label="Navigation Menu & Directory"
            >
              <List size={18} weight="bold" className="text-slate-700 group-hover:text-emerald-700 shrink-0" />
              <span className="hidden xl:inline text-xs font-bold text-slate-700 group-hover:text-emerald-700">Menu</span>
            </button>

            {/* User account / sign in / sign out */}
            {showAuthenticated ? (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={isCoach ? '/coach/dashboard' : isAdmin ? '/admin' : '/parent/bookings'}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                  title="Go to Dashboard"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name || 'Account'}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <SignOut size={16} weight="bold" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <User size={15} weight="fill" className="shrink-0" />
                <span className="whitespace-nowrap">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          MOBILE NAVIGATION (Visible on sm and down)
         ========================================== */}
      <div className="md:hidden px-3.5 py-2.5 flex items-center justify-between border-b border-gray-100">
        {/* Mobile Logo */}
        <BrandLogo size="sm" showTagline={false} />

        {/* Mobile Locality & Notifications */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLocality}
            className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MapPin size={13} weight="fill" className="text-red-500" />
            <span className="max-w-[120px] truncate">
              {activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase() ? `${activeLocality}, ${activeCity}` : activeCity}
            </span>
            <CaretDown size={10} weight="bold" className="text-gray-400" />
          </button>

          <button
            id="mobile-notifications-btn"
            onClick={onOpenNotifications}
            className="relative text-gray-500 hover:text-gray-800 p-1.5 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} weight="bold" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mobile WhatsApp Support Icon */}
          <a
            id="mobile-header-whatsapp-btn"
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Chat with KnowUrCoach Support on WhatsApp"
            aria-label="WhatsApp Support"
          >
            <WhatsappLogo size={20} weight="fill" />
          </a>

          {/* Mobile Menu Breadcrumb Button (Beside notification bell) */}
          <button
            id="mobile-header-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            className="text-gray-700 hover:text-emerald-700 p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/90 transition-all cursor-pointer shrink-0"
            title="Menu & Directory: All Routes, WhatsApp Support, Policies"
            aria-label="Navigation Menu & Directory"
          >
            <List size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* Mobile Top Scrollable Pills — public navigation */}
      <nav className="md:hidden bg-white/95 px-2 py-1.5 border-b border-gray-100 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1.5 w-max">
          <Link
            href="/"
            prefetch={true}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              pathname === '/' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <House size={14} weight="fill" className="shrink-0" />
            <span className="whitespace-nowrap">Home</span>
          </Link>
          <Link
            href="/activities"
            prefetch={true}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              pathname === '/activities' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sparkle size={14} weight="fill" className="shrink-0" />
            <span className="whitespace-nowrap">Discover</span>
          </Link>
          <Link
            href="/competitions"
            prefetch={true}
            id="mobile-nav-tournaments"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 whitespace-nowrap shadow-xs ${
              pathname === '/competitions'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/25 ring-2 ring-orange-400/30'
                : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 text-amber-900 border border-amber-300 hover:border-amber-400'
            }`}
          >
            <Trophy
              size={14}
              weight="fill"
              className={pathname === '/competitions' ? 'text-white shrink-0' : 'text-amber-600 shrink-0'}
            />
            <span className="whitespace-nowrap">Tournaments</span>
            <span
              className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                pathname === '/competitions'
                  ? 'bg-white/25 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pathname === '/competitions' ? 'bg-white' : 'bg-white animate-ping'}`} />
              Live
            </span>
          </Link>
          {showParent && (
            <Link
              href="/parent/bookings"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                pathname.startsWith('/parent') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCircle size={14} weight="fill" className="shrink-0" />
              <span className="whitespace-nowrap">My Passes</span>
            </Link>
          )}
          {showCoach && (
            <Link
              href="/coach/dashboard"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                pathname.startsWith('/coach') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCircle size={14} weight="fill" className="shrink-0" />
              <span className="whitespace-nowrap">Coach Ops</span>
            </Link>
          )}
          {showAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                pathname.startsWith('/admin') ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCircle size={14} weight="fill" className="shrink-0" />
              <span className="whitespace-nowrap">Admin</span>
            </Link>
          )}
          {showGuest && (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap bg-emerald-600 text-white"
            >
              <User size={14} weight="fill" className="shrink-0" />
              <span className="whitespace-nowrap">Sign In</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Slide-over Menu Drawer with All Routes, Support, WhatsApp, Policies */}
      <HeaderMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeCity={activeCity}
        activeLocality={activeLocality}
        onOpenLocality={onOpenLocality}
        isAuthenticated={showAuthenticated}
        isCoach={showCoach}
        isAdmin={showAdmin}
        isParent={showParent}
        user={user}
      />
    </header>
  );
}
