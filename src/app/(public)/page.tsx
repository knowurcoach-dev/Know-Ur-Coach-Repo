import { HomeView } from '@/components/views/HomeView';
import { getCachedDiscoveryData } from '@/lib/cached-queries';

export const revalidate = 60; // ISR cache for 60 seconds with on-demand tag revalidation

export default async function HomePage() {
  const initialData = await getCachedDiscoveryData();
  return <HomeView initialData={initialData} />;
}
