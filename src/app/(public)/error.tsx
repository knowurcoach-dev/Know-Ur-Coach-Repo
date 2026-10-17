"use client";

import React, { useEffect } from 'react';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PUBLIC_BOUNDARY_ERROR] Error in public section:', error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <DatabaseErrorView
        title="Unable to Load Directory"
        message="We are having trouble loading academy listings right now. Please check your internet connection or try again."
        error={error}
        onRetry={() => reset()}
        showHomeButton={true}
      />
    </div>
  );
}
