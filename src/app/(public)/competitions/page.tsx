import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { CompetitionsView } from '@/components/views/CompetitionsView';
import { getCachedDiscoveryData } from '@/lib/cached-queries';

export const revalidate = 60; // ISR cache for 60s

export const metadata: Metadata = {
  title: 'Youth Sports Tournaments & Competitions Across India | KnowUrCoach',
  description:
    'Discover and register for upcoming youth sports tournaments, cricket leagues, badminton championships, chess meets, and martial arts competitions across India.',
  alternates: {
    canonical: '/competitions',
  },
  keywords: [
    'tournaments in india',
    'youth sports tournaments',
    'sports competitions for kids',
    'cricket tournament registration',
    'badminton championship india',
    'chess tournament for kids',
    'youth sports india',
    'knowurcoach competitions',
    'find sports events near me',
    'inter school tournament',
    'sports leagues for kids',
    'sports championship registration',
  ],
  openGraph: {
    title: 'Youth Sports Tournaments & Competitions Across India | KnowUrCoach',
    description:
      'Discover and register for upcoming youth sports tournaments, cricket leagues, badminton championships, and chess meets across India.',
    url: '/competitions',
  },
};

export default async function CompetitionsPage() {
  const initialData = await getCachedDiscoveryData();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading tournaments &amp; competitions...</p>
        </div>
      }
    >
      <CompetitionsView initialData={initialData} />
    </Suspense>
  );
}

