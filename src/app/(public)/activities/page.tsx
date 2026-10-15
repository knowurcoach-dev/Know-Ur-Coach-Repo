import React, { Suspense } from 'react';
import { ActivitiesView } from '@/components/views/ActivitiesView';

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading verified coaching &amp; activity centres...</p>
      </div>
    }>
      <ActivitiesView />
    </Suspense>
  );
}
