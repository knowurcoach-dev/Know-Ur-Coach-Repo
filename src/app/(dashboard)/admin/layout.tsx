"use client";

import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="ADMIN">
      <DashboardLayout role="admin">{children}</DashboardLayout>
    </AuthGuard>
  );
}
