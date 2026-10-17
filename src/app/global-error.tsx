"use client";

import React, { useEffect } from 'react';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GLOBAL_BOUNDARY_ERROR] Uncaught error caught by global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4">
        <DatabaseErrorView
          title="Something went wrong"
          message="An unexpected system error occurred. Please refresh the page or try again in a moment."
          error={error}
          onRetry={() => reset()}
          showHomeButton={true}
        />
      </body>
    </html>
  );
}
