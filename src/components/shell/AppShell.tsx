"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePersona } from '@/context/PersonaContext';
import { AppHeader } from '@/components/navigation/AppHeader';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { Toast } from '@/components/ui/Toast';
import { LocalityModal } from '@/components/modals/LocalityModal';
import { NotificationModal } from '@/components/modals/NotificationModal';
import { TrialBookingModal } from '@/components/modals/TrialBookingModal';
import { SessionPassModal } from '@/components/modals/SessionPassModal';
import { CompareModal } from '@/components/modals/CompareModal';
import { PaymentSecurityModal } from '@/components/modals/PaymentSecurityModal';
import { EnrollmentModal } from '@/components/modals/EnrollmentModal';
import { HostTournamentModal } from '@/components/modals/HostTournamentModal';
import { TournamentRegisterModal } from '@/components/modals/TournamentRegisterModal';
import { AttendanceLogModal } from '@/components/modals/AttendanceLogModal';
import { useModalStore } from '@/hooks/useModalStore';
import { AppFooter } from '@/components/navigation/AppFooter';
import { WhatsAppSupportWidget } from '@/components/ui/WhatsAppSupportWidget';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { setActiveTab } = usePersona();
  const { isOpen, activeModal, closeModal } = useModalStore();
  const [localityModalOpen, setLocalityModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Sync activeTab with pathname on route changes
  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname === '/activities') {
      setActiveTab('activities');
    } else if (pathname === '/competitions') {
      setActiveTab('competitions');
    } else if (pathname.startsWith('/parent')) {
      setActiveTab('bookings');
    } else if (pathname.startsWith('/coach')) {
      setActiveTab('coach-dashboard');
    } else if (pathname.startsWith('/admin')) {
      setActiveTab('admin-dashboard');
    }
  }, [pathname, setActiveTab]);

  const isLocalityOpen = localityModalOpen || (isOpen && activeModal === 'locality-selector');
  const isNotificationOpen = notificationModalOpen || (isOpen && activeModal === 'notification');

  // Auth/register pages render full-screen without shell chrome
  const isBareRoute =
    pathname === '/login' ||
    pathname.startsWith('/register-') ||
    pathname === '/admin/login';

  // Authenticated dashboard routes and fullscreen explore view render full-height without marketing footer
  const isDashboardRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/coach') ||
    pathname.startsWith('/parent');

  const isNoFooterRoute = isDashboardRoute || pathname.startsWith('/activities/explore');

  // Automatic location selection modal popup for new users
  useEffect(() => {
    if (isBareRoute || isDashboardRoute) return;

    try {
      const saved = localStorage.getItem('kuc_user_location');
      const dismissed = sessionStorage.getItem('kuc_location_dismissed');
      if (!saved && !dismissed) {
        const timer = setTimeout(() => {
          setLocalityModalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore storage errors in restricted contexts
    }
  }, [isBareRoute, isDashboardRoute]);

  if (isBareRoute) {
    return (
      <div className="min-h-screen relative w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative w-full bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Responsive App Header (Fixed at top) */}
      <AppHeader
        onOpenLocality={() => setLocalityModalOpen(true)}
        onOpenNotifications={() => setNotificationModalOpen(true)}
      />

      {/* Header height placeholder spacer to prevent content overlap under fixed header */}
      <div className="h-[104px] md:h-[65px] shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 w-full relative transition-colors duration-300 pb-20 md:pb-0 h-full overflow-x-hidden"
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavBar />

      {/* Desktop Footer (hidden on all dashboard portals and explore view for clean layout) */}
      {!isNoFooterRoute && <AppFooter />}

      {/* Modals */}
      <LocalityModal
        isOpen={isLocalityOpen}
        onClose={() => {
          setLocalityModalOpen(false);
          if (activeModal === 'locality-selector') closeModal();
        }}
      />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => {
          setNotificationModalOpen(false);
          if (activeModal === 'notification') closeModal();
        }}
      />
      <TrialBookingModal />
      <EnrollmentModal />
      <HostTournamentModal />
      <TournamentRegisterModal />
      <SessionPassModal />
      <AttendanceLogModal />
      <CompareModal />
      <PaymentSecurityModal />

      {/* Floating Toast */}
      <Toast />

      {/* Floating WhatsApp Support (Desktop and Mobile) */}
      <WhatsAppSupportWidget />
    </div>
  );
}
