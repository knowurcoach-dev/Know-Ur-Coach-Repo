import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KnowUrCoach - Find Kids Coaching & Sports Academies Across India',
    short_name: 'KnowUrCoach',
    description:
      'Find your coach across India! Discover & book verified kids coaching, sports academies, swimming, cricket, badminton, chess, martial arts and brain booster classes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
