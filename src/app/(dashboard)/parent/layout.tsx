"use client";

import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="PARENT">
      <DashboardLayout role="parent">{children}</DashboardLayout>
    </AuthGuard>
  );
}
