"use client";

import React, { useEffect } from 'react';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CLIENT_BOUNDARY_ERROR] Uncaught error caught by root error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <DatabaseErrorView
        title="Something went wrong"
        message="We encountered an unexpected issue while loading this page. Please try refreshing or return to the homepage."
        error={error}
        onRetry={() => reset()}
        showHomeButton={true}
      />
    </div>
  );
}
