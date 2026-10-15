"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ParentSidebar } from '@/components/navigation/ParentSidebar';
import { CoachSidebar } from '@/components/navigation/CoachSidebar';
import { AdminSidebar } from '@/components/navigation/AdminSidebar';
import { List, X, CaretRight } from '@phosphor-icons/react';

type DashboardRole = 'parent' | 'coach' | 'admin';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: DashboardRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route transition
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  const Sidebar =
    role === 'coach'
      ? CoachSidebar
      : role === 'admin'
        ? AdminSidebar
        : ParentSidebar;

  const roleTitle =
    role === 'coach'
      ? 'Coach Ops'
      : role === 'admin'
        ? 'Admin Suite'
        : 'Parent Portal';

  // Format current page name for mobile breadcrumb
  const currentPathSegment = pathname.split('/').filter(Boolean).slice(-1)[0] || 'Dashboard';
  const pageTitle = currentPathSegment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex min-h-full flex-col md:flex-row relative">
      {/* ========================================================
          MOBILE TOP SUB-HEADER WITH HAMBURGER BUTTON
          Visible on screens < md (mobile phones)
         ======================================================== */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white shadow-sm border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer shadow-sm shrink-0"
            aria-label="Open sidebar menu"
          >
            <List size={18} weight="bold" className="text-emerald-400" />
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-300 min-w-0 truncate">
            <span className="font-extrabold text-slate-400">{roleTitle}</span>
            <CaretRight size={10} className="text-slate-500 shrink-0" />
            <span className="truncate font-semibold text-white">{pageTitle}</span>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
          {role}
        </span>
      </div>

      {/* ========================================================
          SLIDE-OVER MOBILE DRAWER BACKDROP & PANEL
         ======================================================== */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-emerald-400">
                  {roleTitle} Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close sidebar menu"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Sidebar isMobile onNavigate={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar — only visible md+ */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
