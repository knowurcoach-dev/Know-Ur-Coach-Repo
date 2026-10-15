import React, { Suspense } from 'react';
import { ActivitiesExploreView } from '@/components/views/ActivitiesExploreView';

export const metadata = {
  title: 'Explore Coaching Centers & Activities | KnowUrCoach',
  description: 'Blinkit-style category explorer and verified coaching academies listing.',
};

export default function ActivitiesExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading verified coaching academies...</p>
        </div>
      }
    >
      <ActivitiesExploreView />
    </Suspense>
  );
}
