import type { Metadata } from 'next';
import { HomeView } from '@/components/views/HomeView';
import { getCachedDiscoveryData } from '@/lib/cached-queries';
import { SEO_BRAND_KEYWORDS } from '@/lib/seo-config';

export const revalidate = 60; // ISR cache for 60 seconds with on-demand tag revalidation

export const metadata: Metadata = {
  title: 'KnowUrCoach | Find Your Coach Across India - Kids Coaching & Sports Academies',
  description:
    'Find your coach across India with KnowUrCoach! Discover, compare and book free trial classes for kids cricket, badminton, swimming, chess, dance, martial arts, abacus, robotics and cognitive brain boosters with 100% money-back escrow protection.',
  alternates: {
    canonical: '/',
  },
  keywords: SEO_BRAND_KEYWORDS,
  openGraph: {
    title: 'KnowUrCoach | Find Your Coach Across India - Kids Coaching & Sports Academies',
    description:
      'Find your coach across India with KnowUrCoach! Discover, compare and book free trial classes for kids cricket, badminton, swimming, chess, dance, martial arts, abacus and robotics.',
    url: '/',
  },
};

export default async function HomePage() {
  const initialData = await getCachedDiscoveryData();
  return <HomeView initialData={initialData} />;
}
