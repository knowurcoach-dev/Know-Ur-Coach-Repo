"use client";

import React, { useEffect } from 'react';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DASHBOARD_BOUNDARY_ERROR] Error in dashboard portal:', error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <DatabaseErrorView
        title="Unable to Load Dashboard"
        message="We are having trouble loading your dashboard records right now. Please refresh or try again in a moment."
        error={error}
        onRetry={() => reset()}
        showHomeButton={true}
      />
    </div>
  );
}
