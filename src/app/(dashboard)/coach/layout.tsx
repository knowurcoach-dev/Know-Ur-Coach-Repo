"use client";

import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CoachRouteGate } from '@/components/coach/CoachRouteGate';

export default function CoachDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="COACH">
      <DashboardLayout role="coach">
        <CoachRouteGate>{children}</CoachRouteGate>
      </DashboardLayout>
    </AuthGuard>
  );
}
