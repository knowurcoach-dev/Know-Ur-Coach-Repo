"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  X,
  House,
  Sparkle,
  Trophy,
  Buildings,
  User,
  UserCircle,
  Users,
  CalendarCheck,
  ClipboardText,
  ShieldCheck,
  SlidersHorizontal,
  WhatsappLogo,
  EnvelopeSimple,
  Phone,
  LockKey,
  FileText,
  MapPin,
  CaretRight,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface HeaderMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity?: string;
  activeLocality?: string;
  onOpenLocality?: () => void;
  isAuthenticated?: boolean;
  isCoach?: boolean;
  isAdmin?: boolean;
  isParent?: boolean;
  isGuest?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function HeaderMenuDrawer({
  isOpen,
  onClose,
  activeCity = 'Pune',
  activeLocality = '',
  onOpenLocality,
  isAuthenticated = false,
  isCoach = false,
  isAdmin = false,
  isParent = false,
  isGuest = true,
  user = null,
}: HeaderMenuDrawerProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on Escape key press & prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  // Strict role differentiation:
  const isActualCoach = Boolean(isCoach || user?.role === 'COACH');
  const isActualAdmin = Boolean(isAdmin || user?.role === 'ADMIN');
  const isActualParent = Boolean(!isActualCoach && !isActualAdmin && (isParent || user?.role === 'PARENT' || isAuthenticated));
  const isActualGuest = !isAuthenticated;

  const currentCityLabel =
    activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase()
      ? `${activeLocality}, ${activeCity}`
      : activeCity;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex justify-end animate-fade-in" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-label="Close menu"
      />

      {/* Clean Slide-over Sidebar Panel */}
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-white h-screen max-h-screen shadow-2xl flex flex-col z-10 border-l border-slate-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <BrandLogo size="sm" showTagline={false} />
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* User Card / Login Banner */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 ${
                  isActualCoach ? 'bg-emerald-600' : isActualAdmin ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Account'}</div>
                  <div className={`text-[10px] uppercase font-bold tracking-tight ${
                    isActualCoach ? 'text-emerald-700' : isActualAdmin ? 'text-purple-700' : 'text-blue-700'
                  }`}>
                    {isActualCoach ? 'Coach • Academy Owner' : isActualAdmin ? 'Platform Admin' : 'Parent Member'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: '/' });
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Welcome to KnowUrCoach</span>
              <Link
                href="/login"
                onClick={onClose}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          
          {/* =========================================================
              1. COACH LOGGED IN: ONLY Coach routes & public exploration
             ========================================================= */}
          {isActualCoach && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Coach Operations
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/coach/dashboard"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/coach/dashboard'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Buildings size={16} weight={pathname === '/coach/dashboard' ? 'fill' : 'regular'} className="text-emerald-600" />
                    <span>Coach Dashboard</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/coach/students"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/coach/students')
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardText size={16} className="text-blue-600" />
                    <span>Students &amp; Rosters</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/coach/batches"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/coach/batches')
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck size={16} className="text-purple-600" />
                    <span>Batch Management</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/coach/attendance"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/coach/attendance')
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck size={16} className="text-emerald-600" />
                    <span>Live Attendance Log</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/coach/leads"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/coach/leads')
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-amber-600" />
                    <span>Inquiry Leads</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>
              </nav>

              <div className="mt-3 px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Explore &amp; Activities
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <House size={16} className="text-slate-500" />
                    <span>Home</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/activities"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/activities'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkle size={16} className="text-teal-600" />
                    <span>Discover Activities</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/competitions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/competitions'
                      ? 'bg-amber-50 text-amber-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={16} className="text-amber-600" />
                    <span>Tournaments</span>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    Live
                  </span>
                </Link>
              </nav>
            </div>
          )}

          {/* =========================================================
              2. PARENT LOGGED IN: ONLY Parent passes & public exploration
             ========================================================= */}
          {isActualParent && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                My Parent Space
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/parent/bookings"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/parent/bookings')
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCircle size={16} className="text-blue-600" />
                    <span>My Bookings &amp; Passes</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>
              </nav>

              <div className="mt-3 px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Explore &amp; Activities
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <House size={16} className="text-slate-500" />
                    <span>Home</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/activities"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/activities'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkle size={16} className="text-teal-600" />
                    <span>Discover Activities</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/competitions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/competitions'
                      ? 'bg-amber-50 text-amber-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={16} className="text-amber-600" />
                    <span>Tournaments</span>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    Live
                  </span>
                </Link>
              </nav>
            </div>
          )}

          {/* =========================================================
              3. ADMIN LOGGED IN: ONLY Admin Suite & platform tools
             ========================================================= */}
          {isActualAdmin && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Admin Suite
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/admin'
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-purple-600" />
                    <span>Admin Console</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/admin/verify-coaches"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/admin/verify-coaches')
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Verify Academies</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/admin/hero-slides"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname.startsWith('/admin/hero-slides')
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal size={16} className="text-amber-600" />
                    <span>Carousel Manager</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>
              </nav>

              <div className="mt-3 px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Explore &amp; Activities
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <House size={16} className="text-slate-500" />
                    <span>Home</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/activities"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/activities'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkle size={16} className="text-teal-600" />
                    <span>Discover Activities</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/competitions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/competitions'
                      ? 'bg-amber-50 text-amber-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={16} className="text-amber-600" />
                    <span>Tournaments</span>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    Live
                  </span>
                </Link>
              </nav>
            </div>
          )}

          {/* =========================================================
              4. GUEST / PUBLIC: Discovery + Registration Links
             ========================================================= */}
          {isActualGuest && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Explore &amp; Activities
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <House size={16} className="text-slate-500" />
                    <span>Home</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/activities"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/activities'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkle size={16} className="text-teal-600" />
                    <span>Discover Activities</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/competitions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/competitions'
                      ? 'bg-amber-50 text-amber-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={16} className="text-amber-600" />
                    <span>Tournaments</span>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                    Live
                  </span>
                </Link>
              </nav>

              <div className="mt-3 px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Join KnowUrCoach
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/register-coach"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/register-coach'
                      ? 'bg-purple-50 text-purple-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Buildings size={16} className="text-purple-600" />
                    <span>List Your Academy</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>

                <Link
                  href="/register-parent"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    pathname === '/register-parent'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User size={16} className="text-blue-600" />
                    <span>Parent Enrollment</span>
                  </div>
                  <CaretRight size={13} className="text-slate-400" />
                </Link>
              </nav>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Help & Support (Common) */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Help &amp; Support
            </div>
            <div className="space-y-1">
              <a
                href="https://wa.me/919762577714?text=Hi%20KnowUrCoach%20Team%2C%20I%20need%20assistance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <WhatsappLogo size={16} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>WhatsApp Chat</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <span>Open</span>
                  <ArrowSquareOut size={12} weight="bold" />
                </div>
              </a>

              <a
                href="mailto:knowurcoach@gmail.com"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={16} className="text-blue-600 shrink-0" />
                  <span>knowurcoach@gmail.com</span>
                </div>
                <ArrowSquareOut size={12} className="text-slate-400" />
              </a>

              <a
                href="tel:+919762577714"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-slate-600 shrink-0" />
                  <span>+91 97625 77714</span>
                </div>
                <ArrowSquareOut size={12} className="text-slate-400" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Policies & Legal (Common) */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Legal &amp; Policies
            </div>
            <div className="space-y-0.5">
              <Link
                href="/privacy"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LockKey size={15} className="text-slate-400" />
                  <span>Privacy Policy</span>
                </div>
                <CaretRight size={13} className="text-slate-400" />
              </Link>

              <Link
                href="/terms"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={15} className="text-slate-400" />
                  <span>Terms of Service</span>
                </div>
                <CaretRight size={13} className="text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom City Selector */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <MapPin size={14} weight="fill" className="text-red-500 shrink-0" />
            <span className="max-w-[170px] truncate">{currentCityLabel}</span>
          </div>
          {onOpenLocality && (
            <button
              onClick={() => {
                onClose();
                onOpenLocality();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
