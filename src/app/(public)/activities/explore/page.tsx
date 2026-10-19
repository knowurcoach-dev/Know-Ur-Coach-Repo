import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ActivitiesExploreView } from '@/components/views/ActivitiesExploreView';
import { getCachedDiscoveryData } from '@/lib/cached-queries';
import { SEO_BRAND_KEYWORDS } from '@/lib/seo-config';

export const revalidate = 60; // ISR cache for 60 seconds with on-demand tag revalidation

export const metadata: Metadata = {
  title: 'Explore Kids Coaching Classes & Sports Categories Across India | KnowUrCoach',
  description:
    'Browse kids coaching by category across India: sports, martial arts, swimming, cricket, badminton, arts, dance, chess, robotics and cognitive brain boosters with instant filters.',
  alternates: {
    canonical: '/activities/explore',
  },
  keywords: SEO_BRAND_KEYWORDS,
  openGraph: {
    title: 'Explore Kids Coaching Classes & Sports Categories Across India | KnowUrCoach',
    description:
      'Browse kids coaching by category across India: sports, martial arts, swimming, cricket, badminton, arts, dance, chess, robotics and brain boosters.',
    url: '/activities/explore',
  },
};

export default async function ActivitiesExplorePage() {
  const initialData = await getCachedDiscoveryData();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading verified coaching academies...</p>
        </div>
      }
    >
      <ActivitiesExploreView initialData={initialData} />
    </Suspense>
  );
}

